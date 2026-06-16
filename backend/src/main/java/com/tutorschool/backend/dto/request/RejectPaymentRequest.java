package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RejectPaymentRequest {

    @NotBlank(message = "Rejection reason is required")
    private String note;
}
