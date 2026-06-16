package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.AttendanceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAttendanceStatusRequest {

    @NotNull(message = "Status is required")
    private AttendanceStatus status;

    @NotBlank(message = "Reason is required when updating attendance status")
    private String reason;
}
