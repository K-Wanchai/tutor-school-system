package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.AttendanceMethod;
import com.tutorschool.backend.entity.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecordResponse {

    private Long id;
    private String attendanceCode;

    private Long enrollmentId;
    private Long studentId;
    private String studentName;

    private Long courseId;
    private String courseName;

    private Long lessonId;
    private String lessonTitle;

    private Long sessionId;
    private String sessionCode;

    private LocalDateTime firstJoinAt;
    private LocalDateTime lastLeaveAt;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;

    private Integer lateMinutes;
    private AttendanceStatus status;
    private AttendanceMethod attendanceMethod;

    private Boolean cameraVerified;
    private String cameraSnapshotUrl;
    private String note;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
