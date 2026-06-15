package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.*;
import com.tutorschool.backend.dto.response.EnrollmentResponse;

import java.util.List;

public interface EnrollmentService {

    List<EnrollmentResponse> getAllEnrollments();

    EnrollmentResponse getEnrollmentById(Long id);

    List<EnrollmentResponse> getEnrollmentsByStudentId(Long studentId);

    List<EnrollmentResponse> getEnrollmentsByCourseId(Long courseId);

    EnrollmentResponse enrollStudent(CreateEnrollmentRequest request);

    EnrollmentResponse updateEnrollmentStatus(Long id, UpdateEnrollmentRequest request);

    EnrollmentResponse updatePayment(Long id, UpdatePaymentRequest request);

    EnrollmentResponse uploadPaymentSlip(Long id, UploadSlipRequest request);

    EnrollmentResponse approveEnrollment(Long id, ApproveEnrollmentRequest request);

    void cancelEnrollment(Long id);
}
