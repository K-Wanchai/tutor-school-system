package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.EnrollmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEnrollmentRequest {

    @NotNull(message = "Status is required")
    private EnrollmentStatus status;

    private String note;
}
