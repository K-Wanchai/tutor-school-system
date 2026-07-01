package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.EnrollmentResponse;
import com.tutorschool.backend.entity.Enrollment;
import org.springframework.stereotype.Component;

@Component
public class EnrollmentMapper {

    public EnrollmentResponse toResponse(Enrollment enrollment) {
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .enrollmentCode(enrollment.getEnrollmentCode())
                .studentId(enrollment.getStudent().getId())
                .studentName(enrollment.getStudent().getFullName())
                .courseId(enrollment.getCourse().getId())
                .courseCode(enrollment.getCourse().getCourseCode())
                .courseName(enrollment.getCourse().getCourseName())
                .tutorName(enrollment.getCourse().getTutor().getFirstName() + " " + enrollment.getCourse().getTutor().getLastName())
                .tutorEmail(enrollment.getCourse().getTutor().getUser().getEmail())
                .enrollmentDate(enrollment.getEnrollmentDate())
                .status(enrollment.getStatus())
                .paymentStatus(enrollment.getPaymentStatus())
                .paymentMethod(enrollment.getPaymentMethod())
                .amount(enrollment.getAmount())
                .discountAmount(enrollment.getDiscountAmount())
                .finalAmount(enrollment.getFinalAmount())
                .paymentSlipUrl(enrollment.getPaymentSlipUrl())
                .note(enrollment.getNote())
                .paymentDeadline(enrollment.getPaymentDeadline())
                .approvedBy(enrollment.getApprovedBy())
                .approvedAt(enrollment.getApprovedAt())
                .createdAt(enrollment.getCreatedAt())
                .updatedAt(enrollment.getUpdatedAt())
                .build();
    }
}
