package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.PaymentMethod;
import com.tutorschool.backend.entity.PaymentVerificationStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class PaymentResponse {

    private Long id;
    private String paymentCode;
    private Long enrollmentId;
    private String enrollmentCode;
    private Long studentId;
    private String studentName;
    private Long courseId;
    private String courseName;
    private String institutionName;
    private LocalDateTime paymentDate;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentVerificationStatus paymentStatus;
    private String paymentSlipUrl;
    private String transactionReference;
    private String note;
    private String verifiedBy;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
