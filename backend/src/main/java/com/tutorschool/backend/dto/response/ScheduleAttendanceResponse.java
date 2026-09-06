package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.AttendanceStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleAttendanceResponse {

    private Long id;
    private Long scheduleId;
    private Long studentId;
    private String studentName;
    private String studentCode;
    private AttendanceStatus status;
    private String note;
    private String recordedBy;
    private LocalDateTime updatedAt;
}
