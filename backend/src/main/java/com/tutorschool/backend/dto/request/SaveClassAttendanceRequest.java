package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class SaveClassAttendanceRequest {

    @NotNull(message = "courseId is required")
    private Long courseId;

    @NotNull(message = "studentId is required")
    private Long studentId;

    @NotNull(message = "sessionDate is required")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate sessionDate;

    @NotNull(message = "status is required")
    private AttendanceStatus status;

    private String note;
}
