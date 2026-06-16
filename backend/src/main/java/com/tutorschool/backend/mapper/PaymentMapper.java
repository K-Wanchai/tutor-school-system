package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.PaymentResponse;
import com.tutorschool.backend.entity.Payment;
import org.springframework.stereotype.Component;

@Component
public class PaymentMapper {

    public PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .paymentCode(payment.getPaymentCode())
                .enrollmentId(payment.getEnrollment().getId())
                .enrollmentCode(payment.getEnrollment().getEnrollmentCode())
                .studentId(payment.getStudent().getId())
                .studentName(payment.getStudent().getFullName())
                .courseId(payment.getEnrollment().getCourse().getId())
                .courseName(payment.getEnrollment().getCourse().getCourseName())
                .institutionName(payment.getInstitutionProfile().getInstitutionName())
                .paymentDate(payment.getPaymentDate())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .paymentSlipUrl(payment.getPaymentSlipUrl())
                .transactionReference(payment.getTransactionReference())
                .note(payment.getNote())
                .verifiedBy(payment.getVerifiedBy())
                .verifiedAt(payment.getVerifiedAt())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
