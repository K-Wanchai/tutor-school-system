package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePaymentRequest {

    @NotNull(message = "Enrollment ID is required")
    private Long enrollmentId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private String paymentSlipUrl;

    private String transactionReference;

    private String note;
}
