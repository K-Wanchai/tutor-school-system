package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.CreateEnrollmentRequest;
import com.tutorschool.backend.dto.request.UpdateEnrollmentRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.EnrollmentResponse;
import com.tutorschool.backend.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getEnrollmentsByStudentId(
            @PathVariable Long studentId) {
        List<EnrollmentResponse> response = enrollmentService.getEnrollmentsByStudentId(studentId);
        return ResponseEntity.ok(ApiResponse.success("Enrollments retrieved successfully", response));
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getEnrollmentsByCourseId(
            @PathVariable Long courseId) {
        List<EnrollmentResponse> response = enrollmentService.getEnrollmentsByCourseId(courseId);
        return ResponseEntity.ok(ApiResponse.success("Enrollments retrieved successfully", response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> enrollStudent(
            @Valid @RequestBody CreateEnrollmentRequest request) {
        EnrollmentResponse response = enrollmentService.enrollStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student enrolled successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> updateEnrollmentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEnrollmentRequest request) {
        EnrollmentResponse response = enrollmentService.updateEnrollmentStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Enrollment status updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    public ResponseEntity<ApiResponse<Void>> cancelEnrollment(@PathVariable Long id) {
        enrollmentService.cancelEnrollment(id);
        return ResponseEntity.ok(ApiResponse.success("Enrollment cancelled successfully"));
    }
}
