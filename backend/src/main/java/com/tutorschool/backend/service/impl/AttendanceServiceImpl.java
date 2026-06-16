package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.UpdateAttendanceStatusRequest;
import com.tutorschool.backend.dto.response.AttendanceRecordResponse;
import com.tutorschool.backend.entity.*;
import com.tutorschool.backend.exception.ForbiddenException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.AttendanceRecordMapper;
import com.tutorschool.backend.repository.*;
import com.tutorschool.backend.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceAuditLogRepository attendanceAuditLogRepository;
    private final ClassroomSessionRepository classroomSessionRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final AttendanceRecordMapper attendanceRecordMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getAllAttendanceRecords() {
        return attendanceRecordRepository.findAll().stream()
                .map(attendanceRecordMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceRecordResponse getAttendanceRecordById(Long id, Authentication auth) {
        AttendanceRecord record = attendanceRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceRecord", id));

        if (isStudentRole(auth)) {
            Student student = getStudentFromAuth(auth);
            if (!record.getStudent().getId().equals(student.getId())) {
                throw new ForbiddenException("You can only view your own attendance records");
            }
        } else if (isTeacherRole(auth)) {
            Teacher teacher = getTeacherFromAuth(auth);
            if (!record.getCourse().getTeacher().getId().equals(teacher.getId())) {
                throw new ForbiddenException("You can only view attendance records for your own courses");
            }
        }

        return attendanceRecordMapper.toResponse(record);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getAttendanceRecordsBySessionId(Long sessionId, Authentication auth) {
        ClassroomSession session = classroomSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassroomSession", sessionId));

        if (isTeacherRole(auth)) {
            Teacher teacher = getTeacherFromAuth(auth);
            if (!session.getTeacher().getId().equals(teacher.getId())) {
                throw new ForbiddenException("You can only view attendance for your own sessions");
            }
        }

        return attendanceRecordRepository.findBySessionId(sessionId).stream()
                .map(attendanceRecordMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getAttendanceRecordsByCourseId(Long courseId, Authentication auth) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        if (isTeacherRole(auth)) {
            Teacher teacher = getTeacherFromAuth(auth);
            if (!course.getTeacher().getId().equals(teacher.getId())) {
                throw new ForbiddenException("You can only view attendance records for your own courses");
            }
        }

        return attendanceRecordRepository.findByCourseId(courseId).stream()
                .map(attendanceRecordMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getMyAttendanceRecords(Authentication auth) {
        Student student = getStudentFromAuth(auth);
        return attendanceRecordRepository.findByStudentId(student.getId()).stream()
                .map(attendanceRecordMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AttendanceRecordResponse updateAttendanceStatus(Long id, UpdateAttendanceStatusRequest request, Authentication auth) {
        AttendanceRecord record = attendanceRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceRecord", id));

        Teacher teacher = getTeacherFromAuth(auth);
        if (!record.getCourse().getTeacher().getId().equals(teacher.getId())) {
            throw new ForbiddenException("You can only update attendance records for your own courses");
        }

        AttendanceStatus oldStatus = record.getStatus();
        record.setStatus(request.getStatus());
        AttendanceRecord updated = attendanceRecordRepository.save(record);

        AttendanceAuditLog auditLog = AttendanceAuditLog.builder()
                .attendanceRecord(updated)
                .oldStatus(oldStatus)
                .newStatus(request.getStatus())
                .changedBy(auth.getName())
                .changedRole(Role.TEACHER.name())
                .reason(request.getReason())
                .build();
        attendanceAuditLogRepository.save(auditLog);

        return attendanceRecordMapper.toResponse(updated);
    }

    private boolean isTeacherRole(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TEACHER"));
    }

    private boolean isStudentRole(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
    }

    private Teacher getTeacherFromAuth(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return teacherRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher profile not found for current user"));
    }

    private Student getStudentFromAuth(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for current user"));
    }
}
