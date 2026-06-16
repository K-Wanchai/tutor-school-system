package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.CreateClassroomSessionRequest;
import com.tutorschool.backend.dto.request.JoinClassroomSessionRequest;
import com.tutorschool.backend.dto.request.LeaveClassroomSessionRequest;
import com.tutorschool.backend.dto.response.AttendanceRecordResponse;
import com.tutorschool.backend.dto.response.ClassroomSessionResponse;
import com.tutorschool.backend.dto.response.JoinClassroomSessionResponse;
import com.tutorschool.backend.entity.*;
import com.tutorschool.backend.exception.*;
import com.tutorschool.backend.mapper.AttendanceRecordMapper;
import com.tutorschool.backend.mapper.ClassroomSessionMapper;
import com.tutorschool.backend.repository.*;
import com.tutorschool.backend.service.ClassroomSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ClassroomSessionServiceImpl implements ClassroomSessionService {

    private final ClassroomSessionRepository classroomSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final CourseLessonRepository courseLessonRepository;
    private final TutorRepository TutorRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final ClassroomSessionMapper classroomSessionMapper;
    private final AttendanceRecordMapper attendanceRecordMapper;

    @Override
    @Transactional
    public ClassroomSessionResponse createSession(CreateClassroomSessionRequest request, Authentication auth) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", request.getCourseId()));

        if (request.getEndTime().isBefore(request.getStartTime()) ||
                request.getEndTime().isEqual(request.getStartTime())) {
            throw new InvalidSessionTimeException("End time must be after start time");
        }

        Tutor Tutor = course.getTutor();

        if (isTeacherRole(auth)) {
            Tutor currentTeacher = getTeacherFromAuth(auth);
            if (!Tutor.getId().equals(currentTeacher.getId())) {
                throw new ForbiddenException("You can only create sessions for your own courses");
            }
        }

        CourseLesson lesson = null;
        if (request.getLessonId() != null) {
            lesson = courseLessonRepository.findById(request.getLessonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lesson", request.getLessonId()));
            if (!lesson.getCourse().getId().equals(course.getId())) {
                throw new ResourceNotFoundException("Lesson does not belong to the specified course");
            }
        }

        int threshold = request.getLateThresholdMinutes() != null ? request.getLateThresholdMinutes() : 15;

        ClassroomSession session = ClassroomSession.builder()
                .sessionCode(generateSessionCode())
                .course(course)
                .lesson(lesson)
                .tutor(Tutor)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .lateThresholdMinutes(threshold)
                .joinCode(request.getJoinCode())
                .isCameraRequired(request.getIsCameraRequired() != null && request.getIsCameraRequired())
                .status(ClassroomSessionStatus.SCHEDULED)
                .build();

        return classroomSessionMapper.toResponse(classroomSessionRepository.save(session));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomSessionResponse> getAllSessions() {
        return classroomSessionRepository.findAll().stream()
                .map(classroomSessionMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomSessionResponse getSessionById(Long id) {
        ClassroomSession session = classroomSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ClassroomSession", id));
        return classroomSessionMapper.toResponse(session);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomSessionResponse> getSessionsByCourseId(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", courseId);
        }
        return classroomSessionRepository.findByCourseId(courseId).stream()
                .map(classroomSessionMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ClassroomSessionResponse openSession(Long id, Authentication auth) {
        ClassroomSession session = classroomSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ClassroomSession", id));

        checkTeacherOwnership(session, auth);

        session.setStatus(ClassroomSessionStatus.OPEN);
        return classroomSessionMapper.toResponse(classroomSessionRepository.save(session));
    }

    @Override
    @Transactional
    public ClassroomSessionResponse closeSession(Long id, Authentication auth) {
        ClassroomSession session = classroomSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ClassroomSession", id));

        checkTeacherOwnership(session, auth);

        session.setStatus(ClassroomSessionStatus.CLOSED);
        return classroomSessionMapper.toResponse(classroomSessionRepository.save(session));
    }

    @Override
    @Transactional
    public void deleteSession(Long id, Authentication auth) {
        ClassroomSession session = classroomSessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ClassroomSession", id));

        checkTeacherOwnership(session, auth);

        classroomSessionRepository.delete(session);
    }

    @Override
    @Transactional
    public JoinClassroomSessionResponse joinSession(Long sessionId, JoinClassroomSessionRequest request, Authentication auth) {
        ClassroomSession session = classroomSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassroomSession", sessionId));

        if (session.getStatus() != ClassroomSessionStatus.OPEN) {
            throw new ClassroomSessionClosedException(sessionId);
        }

        if (!session.getJoinCode().equals(request.getJoinCode())) {
            throw new ForbiddenException("Invalid join code");
        }

        Student student = getStudentFromAuth(auth);

        Enrollment enrollment = enrollmentRepository
                .findByStudentIdAndCourseId(student.getId(), session.getCourse().getId())
                .orElseThrow(() -> new StudentNotEnrolledException(student.getId(), session.getCourse().getId()));

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new StudentNotEnrolledException("Your enrollment is not approved for this course");
        }

        Optional<AttendanceRecord> existingRecord =
                attendanceRecordRepository.findByStudentIdAndSessionId(student.getId(), sessionId);

        if (existingRecord.isPresent()) {
            AttendanceRecord record = existingRecord.get();
            return buildJoinResponse(record, session, false);
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lateDeadline = session.getStartTime().plusMinutes(session.getLateThresholdMinutes());

        long lateMinutes = 0;
        AttendanceStatus status;

        if (now.isAfter(lateDeadline)) {
            lateMinutes = ChronoUnit.MINUTES.between(session.getStartTime(), now);
            status = AttendanceStatus.LATE;
        } else {
            status = AttendanceStatus.PRESENT;
        }

        // TODO: Future camera verification — if session.getIsCameraRequired() && !cameraVerified → handle accordingly
        AttendanceRecord record = AttendanceRecord.builder()
                .attendanceCode(generateAttendanceCode())
                .enrollment(enrollment)
                .student(student)
                .course(session.getCourse())
                .lesson(session.getLesson())
                .session(session)
                .firstJoinAt(now)
                .checkInTime(now)
                .lateMinutes((int) lateMinutes)
                .status(status)
                .attendanceMethod(AttendanceMethod.AUTO_JOIN)
                .cameraVerified(false)
                .build();

        AttendanceRecord saved = attendanceRecordRepository.save(record);
        return buildJoinResponse(saved, session, true);
    }

    @Override
    @Transactional
    public AttendanceRecordResponse leaveSession(Long sessionId, LeaveClassroomSessionRequest request, Authentication auth) {
        ClassroomSession session = classroomSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassroomSession", sessionId));

        Student student = getStudentFromAuth(auth);

        AttendanceRecord record = attendanceRecordRepository
                .findByStudentIdAndSessionId(student.getId(), sessionId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attendance record not found for this session"));

        LocalDateTime now = LocalDateTime.now();
        record.setLastLeaveAt(now);
        record.setCheckOutTime(now);

        if (request.getNote() != null && !request.getNote().isBlank()) {
            record.setNote(request.getNote());
        }

        return attendanceRecordMapper.toResponse(attendanceRecordRepository.save(record));
    }

    private JoinClassroomSessionResponse buildJoinResponse(AttendanceRecord record, ClassroomSession session, boolean isNew) {
        String lessonTitle = session.getLesson() != null ? session.getLesson().getLessonTitle() : null;

        String message;
        if (!isNew) {
            message = "คุณเข้าร่วมห้องเรียนนี้แล้ว";
        } else if (record.getStatus() == AttendanceStatus.LATE) {
            message = "เข้าเรียนสำเร็จ แต่ถือว่าสาย";
        } else {
            message = "เข้าเรียนสำเร็จ";
        }

        return JoinClassroomSessionResponse.builder()
                .attendanceCode(record.getAttendanceCode())
                .studentName(record.getStudent().getFullName())
                .courseName(session.getCourse().getCourseName())
                .lessonTitle(lessonTitle)
                .firstJoinAt(record.getFirstJoinAt())
                .lateMinutes(record.getLateMinutes())
                .status(record.getStatus())
                .message(message)
                .isNewRecord(isNew)
                .build();
    }

    private void checkTeacherOwnership(ClassroomSession session, Authentication auth) {
        if (isTeacherRole(auth)) {
            Tutor currentTeacher = getTeacherFromAuth(auth);
            if (!session.getTutor().getId().equals(currentTeacher.getId())) {
                throw new ForbiddenException("You can only manage sessions for your own courses");
            }
        }
    }

    private boolean isTeacherRole(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TUTOR"));
    }

    private Tutor getTeacherFromAuth(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return TutorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found for current user"));
    }

    private Student getStudentFromAuth(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for current user"));
    }

    private String generateSessionCode() {
        String code;
        do {
            code = "SES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (classroomSessionRepository.existsBySessionCode(code));
        return code;
    }

    private String generateAttendanceCode() {
        return "ATT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
