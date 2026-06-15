package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApproveEnrollmentRequest {

    @NotBlank(message = "Approved by is required")
    private String approvedBy;

    private String note;
}
