package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CreateEnrollmentRequest;
import com.tutorschool.backend.dto.request.UpdateEnrollmentRequest;
import com.tutorschool.backend.dto.response.EnrollmentResponse;

import java.util.List;

public interface EnrollmentService {

    List<EnrollmentResponse> getEnrollmentsByStudentId(Long studentId);

    List<EnrollmentResponse> getEnrollmentsByCourseId(Long courseId);

    EnrollmentResponse enrollStudent(CreateEnrollmentRequest request);

    EnrollmentResponse updateEnrollmentStatus(Long id, UpdateEnrollmentRequest request);

    void cancelEnrollment(Long id);
}
