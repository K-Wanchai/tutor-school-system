package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.SaveClassAttendanceRequest;
import com.tutorschool.backend.dto.response.ClassAttendanceResponse;
import com.tutorschool.backend.dto.response.CourseSessionResponse;
import com.tutorschool.backend.entity.ClassAttendance;
import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.CourseScheduleDay;
import com.tutorschool.backend.entity.Role;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.Tutor;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.exception.ExamAccessDeniedException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.repository.ClassAttendanceRepository;
import com.tutorschool.backend.repository.CourseRepository;
import com.tutorschool.backend.repository.CourseScheduleDayRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.repository.TutorRepository;
import com.tutorschool.backend.repository.UserRepository;
import com.tutorschool.backend.service.ClassAttendanceService;
import com.tutorschool.backend.util.ScheduleDaysParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ClassAttendanceServiceImpl implements ClassAttendanceService {

    private final ClassAttendanceRepository attendanceRepository;
    private final CourseRepository courseRepository;
    private final CourseScheduleDayRepository courseScheduleDayRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final TutorRepository tutorRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ClassAttendanceResponse> getCourseAttendance(Long courseId, User currentUser) {
        Course course = getCourse(courseId);
        if (currentUser.getRole() != Role.ADMIN) {
            requireOwner(course, getTutor(currentUser.getEmail()));
        }
        return attendanceRepository.findByCourseId(courseId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseSessionResponse> getCourseSessions(Long courseId, User currentUser) {
        Course course = getCourse(courseId);
        if (currentUser.getRole() == Role.TUTOR) {
            requireOwner(course, getTutor(currentUser.getEmail()));
        } else if (currentUser.getRole() == Role.STUDENT) {
            requireEnrolled(course, currentUser.getEmail());
        }
        return computeSessions(course);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseSessionResponse> getCourseSessionsForStudent(Long courseId, Long studentId) {
        Course course = getCourse(courseId);
        if (!enrollmentRepository.existsByStudentIdAndCourseId(studentId, courseId)) {
            throw new ExamAccessDeniedException("Student is not enrolled in this course");
        }
        return computeSessions(course);
    }

    private List<CourseSessionResponse> computeSessions(Course course) {
        Map<String, LocalTime[]> daySlots = new HashMap<>();
        for (CourseScheduleDay pattern : courseScheduleDayRepository.findByCourseId(course.getId())) {
            daySlots.put(pattern.getDayOfWeek(), new LocalTime[]{pattern.getStartTime(), pattern.getEndTime()});
        }
        if (daySlots.isEmpty() || course.getCourseStartDate() == null || course.getTotalHours() == null) {
            return List.of();
        }

        List<LocalDate> sessionDates = ScheduleDaysParser.computeSessionDates(
                course.getCourseStartDate(), course.getTotalHours(), daySlots);

        List<CourseSessionResponse> sessions = new ArrayList<>();
        for (LocalDate date : sessionDates) {
            LocalTime[] slot = daySlots.get(ScheduleDaysParser.toDayCode(date.getDayOfWeek()));
            sessions.add(CourseSessionResponse.builder()
                    .scheduleDate(date)
                    .startTime(slot[0])
                    .endTime(slot[1])
                    .build());
        }

        return sessions;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassAttendanceResponse> getMyAttendance(String studentEmail) {
        User user = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + studentEmail));
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for current user"));
        return getAttendanceByStudentId(student.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassAttendanceResponse> getAttendanceByStudentId(Long studentId) {
        return attendanceRepository.findByStudentId(studentId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ClassAttendanceResponse saveAttendance(SaveClassAttendanceRequest request, String tutorEmail) {
        Tutor tutor = getTutor(tutorEmail);
        Course course = getCourse(request.getCourseId());
        requireOwner(course, tutor);

        if (request.getSessionDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("ยังเช็คชื่อไม่ได้ เนื่องจากยังไม่ถึงวันเรียน");
        }

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + request.getStudentId()));

        ClassAttendance record = attendanceRepository
                .findByCourseIdAndStudentIdAndSessionDate(course.getId(), student.getId(), request.getSessionDate())
                .orElseGet(() -> ClassAttendance.builder()
                        .course(course)
                        .student(student)
                        .sessionDate(request.getSessionDate())
                        .build());

        record.setStatus(request.getStatus());
        record.setNote(request.getNote() != null && !request.getNote().isBlank() ? request.getNote().trim() : null);
        record.setRecordedBy(tutorEmail);

        return toResponse(attendanceRepository.save(record));
    }

    @Override
    @Transactional
    public void deleteAttendance(Long courseId, Long studentId, LocalDate sessionDate, String tutorEmail) {
        Tutor tutor = getTutor(tutorEmail);
        Course course = getCourse(courseId);
        requireOwner(course, tutor);
        attendanceRepository.findByCourseIdAndStudentIdAndSessionDate(courseId, studentId, sessionDate)
                .ifPresent(attendanceRepository::delete);
    }

    private Tutor getTutor(String tutorEmail) {
        return tutorRepository.findByUserEmail(tutorEmail)
                .orElseThrow(() -> new ExamAccessDeniedException("Current user is not registered as a Tutor"));
    }

    private Course getCourse(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with id: " + courseId));
    }

    private void requireOwner(Course course, Tutor tutor) {
        if (course.getTutor() == null || !course.getTutor().getId().equals(tutor.getId())) {
            throw new ExamAccessDeniedException("You do not have permission to record attendance for this course");
        }
    }

    private void requireEnrolled(Course course, String studentEmail) {
        User user = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + studentEmail));
        Student student = studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for current user"));
        if (!enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())) {
            throw new ExamAccessDeniedException("You do not have permission to view this course's sessions");
        }
    }

    private ClassAttendanceResponse toResponse(ClassAttendance record) {
        Student student = record.getStudent();
        return ClassAttendanceResponse.builder()
                .id(record.getId())
                .courseId(record.getCourse().getId())
                .studentId(student.getId())
                .studentName(student.getFullName())
                .studentCode(student.getStudentCode())
                .sessionDate(record.getSessionDate())
                .status(record.getStatus())
                .note(record.getNote())
                .recordedBy(record.getRecordedBy())
                .updatedAt(record.getUpdatedAt())
                .build();
    }
}
