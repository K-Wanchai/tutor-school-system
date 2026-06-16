package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.AttendanceRecordResponse;
import com.tutorschool.backend.entity.AttendanceRecord;
import org.springframework.stereotype.Component;

@Component
public class AttendanceRecordMapper {

    public AttendanceRecordResponse toResponse(AttendanceRecord record) {
        Long lessonId = record.getLesson() != null ? record.getLesson().getId() : null;
        String lessonTitle = record.getLesson() != null ? record.getLesson().getLessonTitle() : null;

        return AttendanceRecordResponse.builder()
                .id(record.getId())
                .attendanceCode(record.getAttendanceCode())
                .enrollmentId(record.getEnrollment().getId())
                .studentId(record.getStudent().getId())
                .studentName(record.getStudent().getFullName())
                .courseId(record.getCourse().getId())
                .courseName(record.getCourse().getCourseName())
                .lessonId(lessonId)
                .lessonTitle(lessonTitle)
                .sessionId(record.getSession().getId())
                .sessionCode(record.getSession().getSessionCode())
                .firstJoinAt(record.getFirstJoinAt())
                .lastLeaveAt(record.getLastLeaveAt())
                .checkInTime(record.getCheckInTime())
                .checkOutTime(record.getCheckOutTime())
                .lateMinutes(record.getLateMinutes())
                .status(record.getStatus())
                .attendanceMethod(record.getAttendanceMethod())
                .cameraVerified(record.getCameraVerified())
                .cameraSnapshotUrl(record.getCameraSnapshotUrl())
                .note(record.getNote())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }
}
