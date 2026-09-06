package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SaveScheduleAttendanceRequest {

    @NotNull(message = "scheduleId is required")
    private Long scheduleId;

    @NotNull(message = "studentId is required")
    private Long studentId;

    @NotNull(message = "status is required")
    private AttendanceStatus status;

    private String note;
}
