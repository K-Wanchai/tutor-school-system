package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.SaveScheduleAttendanceRequest;
import com.tutorschool.backend.dto.response.ScheduleAttendanceResponse;
import com.tutorschool.backend.entity.CourseSchedule;
import com.tutorschool.backend.entity.ScheduleAttendance;
import com.tutorschool.backend.entity.ScheduleStatus;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.Tutor;
import com.tutorschool.backend.exception.ExamAccessDeniedException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.repository.CourseScheduleRepository;
import com.tutorschool.backend.repository.ScheduleAttendanceRepository;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.repository.TutorRepository;
import com.tutorschool.backend.service.ScheduleAttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ScheduleAttendanceServiceImpl implements ScheduleAttendanceService {

    private final ScheduleAttendanceRepository attendanceRepository;
    private final CourseScheduleRepository scheduleRepository;
    private final StudentRepository studentRepository;
    private final TutorRepository tutorRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleAttendanceResponse> getCourseAttendance(Long courseId, String tutorEmail) {
        Tutor tutor = getTutor(tutorEmail);
        return attendanceRepository.findByScheduleCourseId(courseId).stream()
                .filter(a -> a.getSchedule().getTutor().getId().equals(tutor.getId()))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ScheduleAttendanceResponse saveAttendance(SaveScheduleAttendanceRequest request, String tutorEmail) {
        Tutor tutor = getTutor(tutorEmail);

        CourseSchedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Course schedule not found with id: " + request.getScheduleId()));
        requireOwner(schedule, tutor);

        if (schedule.getStatus() == ScheduleStatus.CANCELLED) {
            throw new IllegalArgumentException("คาบเรียนนี้ถูกยกเลิกแล้ว ไม่สามารถบันทึกการเข้าเรียนได้");
        }
        if (schedule.getScheduleDate() != null && schedule.getScheduleDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("ยังบันทึกการเข้าเรียนไม่ได้ เนื่องจากยังไม่ถึงวันเรียน");
        }

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + request.getStudentId()));

        ScheduleAttendance record = attendanceRepository
                .findByScheduleIdAndStudentId(schedule.getId(), student.getId())
                .orElseGet(() -> ScheduleAttendance.builder().schedule(schedule).student(student).build());

        record.setStatus(request.getStatus());
        record.setNote(request.getNote() != null && !request.getNote().isBlank() ? request.getNote().trim() : null);
        record.setRecordedBy(tutorEmail);

        return toResponse(attendanceRepository.save(record));
    }

    @Override
    @Transactional
    public void deleteAttendance(Long scheduleId, Long studentId, String tutorEmail) {
        Tutor tutor = getTutor(tutorEmail);
        CourseSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Course schedule not found with id: " + scheduleId));
        requireOwner(schedule, tutor);
        attendanceRepository.findByScheduleIdAndStudentId(scheduleId, studentId)
                .ifPresent(attendanceRepository::delete);
    }

    private Tutor getTutor(String tutorEmail) {
        return tutorRepository.findByUserEmail(tutorEmail)
                .orElseThrow(() -> new ExamAccessDeniedException("Current user is not registered as a Tutor"));
    }

    private void requireOwner(CourseSchedule schedule, Tutor tutor) {
        if (!schedule.getTutor().getId().equals(tutor.getId())) {
            throw new ExamAccessDeniedException("You do not have permission to record attendance for this class");
        }
    }

    private ScheduleAttendanceResponse toResponse(ScheduleAttendance record) {
        Student student = record.getStudent();
        return ScheduleAttendanceResponse.builder()
                .id(record.getId())
                .scheduleId(record.getSchedule().getId())
                .studentId(student.getId())
                .studentName(student.getFullName())
                .studentCode(student.getStudentCode())
                .status(record.getStatus())
                .note(record.getNote())
                .recordedBy(record.getRecordedBy())
                .updatedAt(record.getUpdatedAt())
                .build();
    }
}
