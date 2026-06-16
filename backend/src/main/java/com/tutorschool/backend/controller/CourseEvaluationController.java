package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.CreateCourseEvaluationRequest;
import com.tutorschool.backend.dto.request.UpdateCourseEvaluationRequest;
import com.tutorschool.backend.dto.request.UpdateEvaluationStatusRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.CourseEvaluationResponse;
import com.tutorschool.backend.dto.response.CourseEvaluationSummaryResponse;
import com.tutorschool.backend.service.CourseEvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/course-evaluations")
@RequiredArgsConstructor
public class CourseEvaluationController {

    private final CourseEvaluationService evaluationService;

    // POST /api/v1/course-evaluations — นักเรียนส่งรีวิว
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<CourseEvaluationResponse>> createEvaluation(
            @Valid @RequestBody CreateCourseEvaluationRequest request,
            Authentication authentication) {
        CourseEvaluationResponse response = evaluationService.createEvaluation(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Evaluation submitted successfully", response));
    }

    // GET /api/v1/course-evaluations — Admin ดูทั้งหมด
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CourseEvaluationResponse>>> getAllEvaluations() {
        List<CourseEvaluationResponse> response = evaluationService.getAllEvaluations();
        return ResponseEntity.ok(ApiResponse.success("Evaluations retrieved successfully", response));
    }

    // GET /api/v1/course-evaluations/{id} — ดูตาม ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'Tutor', 'STUDENT')")
    public ResponseEntity<ApiResponse<CourseEvaluationResponse>> getEvaluationById(
            @PathVariable Long id,
            Authentication authentication) {
        CourseEvaluationResponse response = evaluationService.getEvaluationById(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Evaluation retrieved successfully", response));
    }

    // GET /api/v1/course-evaluations/course/{courseId} — ดูรีวิวของคอร์ส
    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'Tutor')")
    public ResponseEntity<ApiResponse<List<CourseEvaluationResponse>>> getEvaluationsByCourseId(
            @PathVariable Long courseId,
            Authentication authentication) {
        List<CourseEvaluationResponse> response = evaluationService.getEvaluationsByCourseId(courseId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Evaluations retrieved successfully", response));
    }

    // GET /api/v1/course-evaluations/tutor/{tutorId} — ดูรีวิวของ Tutor
    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'Tutor')")
    public ResponseEntity<ApiResponse<List<CourseEvaluationResponse>>> getEvaluationsByTeacherId(
            @PathVariable Long tutorId,
            Authentication authentication) {
        List<CourseEvaluationResponse> response = evaluationService.getEvaluationsByTeacherId(tutorId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Evaluations retrieved successfully", response));
    }

    // GET /api/v1/course-evaluations/student/me — นักเรียนดูรีวิวตัวเอง
    @GetMapping("/student/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<CourseEvaluationResponse>>> getMyEvaluations(
            Authentication authentication) {
        List<CourseEvaluationResponse> response = evaluationService.getMyEvaluations(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("My evaluations retrieved successfully", response));
    }

    // GET /api/v1/course-evaluations/course/{courseId}/summary — ดู summary คะแนน
    @GetMapping("/course/{courseId}/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'Tutor')")
    public ResponseEntity<ApiResponse<CourseEvaluationSummaryResponse>> getCourseSummary(
            @PathVariable Long courseId) {
        CourseEvaluationSummaryResponse response = evaluationService.getCourseSummary(courseId);
        return ResponseEntity.ok(ApiResponse.success("Course evaluation summary retrieved successfully", response));
    }

    // PUT /api/v1/course-evaluations/{id} — นักเรียนแก้ไขรีวิว (ภายใน 24 ชม.)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<CourseEvaluationResponse>> updateEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCourseEvaluationRequest request,
            Authentication authentication) {
        CourseEvaluationResponse response = evaluationService.updateEvaluation(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Evaluation updated successfully", response));
    }

    // PATCH /api/v1/course-evaluations/{id}/status — Admin เปลี่ยน status
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseEvaluationResponse>> updateEvaluationStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEvaluationStatusRequest request) {
        CourseEvaluationResponse response = evaluationService.updateEvaluationStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Evaluation status updated successfully", response));
    }

    // DELETE /api/v1/course-evaluations/{id} — Admin ลบรีวิว
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEvaluation(@PathVariable Long id) {
        evaluationService.deleteEvaluation(id);
        return ResponseEntity.ok(ApiResponse.success("Evaluation deleted successfully"));
    }
}
