package com.tutorschool.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tutorschool.backend.dto.request.CreateCourseEvaluationRequest;
import com.tutorschool.backend.dto.request.UpdateCourseEvaluationRequest;
import com.tutorschool.backend.dto.request.UpdateEvaluationStatusRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.CourseEvaluationResponse;
import com.tutorschool.backend.dto.response.CourseEvaluationSummaryResponse;
import com.tutorschool.backend.service.CourseEvaluationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/course-evaluations")
@RequiredArgsConstructor
public class CourseEvaluationController {

    private final CourseEvaluationService evaluationService;

    // POST /api/v1/course-evaluations â€” à¸™à¸±à¸à¹€à¸£à¸µà¸¢à¸™à¸ªà¹ˆà¸‡à¸£à¸µà¸§à¸´à¸§
    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<CourseEvaluationResponse>> createEvaluation(
            @Valid @RequestBody CreateCourseEvaluationRequest request,
            Authentication authentication) {
        CourseEvaluationResponse response = evaluationService.createEvaluation(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Evaluation submitted successfully", response));
    }

    // GET /api/v1/course-evaluations â€” Admin à¸”à¸¹à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CourseEvaluationResponse>>> getAllEvaluations() {
        List<CourseEvaluationResponse> response = evaluationService.getAllEvaluations();
        return ResponseEntity.ok(ApiResponse.success("Evaluations retrieved successfully", response));
    }

    // GET /api/v1/course-evaluations/{id} â€” à¸”à¸¹à¸•à¸²à¸¡ ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<CourseEvaluationResponse>> getEvaluationById(
            @PathVariable Long id,
            Authentication authentication) {
        CourseEvaluationResponse response = evaluationService.getEvaluationById(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Evaluation retrieved successfully", response));
    }

    // GET /api/v1/course-evaluations/course/{courseId} â€” à¸”à¸¹à¸£à¸µà¸§à¸´à¸§à¸‚à¸­à¸‡à¸„à¸­à¸£à¹Œà¸ª
    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<List<CourseEvaluationResponse>>> getEvaluationsByCourseId(
            @PathVariable Long courseId,
            Authentication authentication) {
        List<CourseEvaluationResponse> response = evaluationService.getEvaluationsByCourseId(courseId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Evaluations retrieved successfully", response));
    }

    // GET /api/v1/course-evaluations/tutor/me
    @GetMapping("/tutor/me")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<ApiResponse<List<CourseEvaluationResponse>>> getMyEvaluationsAsTutor(
            Authentication authentication) {
        List<CourseEvaluationResponse> response = evaluationService.getMyEvaluationsAsTutor(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("My evaluations retrieved successfully", response));
    }

    // GET /api/v1/course-evaluations/tutor/{tutorId} â€” à¸”à¸¹à¸£à¸µà¸§à¸´à¸§à¸‚à¸­à¸‡ Tutor
    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<List<CourseEvaluationResponse>>> getEvaluationsByTutorId(
            @PathVariable Long tutorId,
            Authentication authentication) {
        List<CourseEvaluationResponse> response = evaluationService.getEvaluationsByTutorId(tutorId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Evaluations retrieved successfully", response));
    }

    // GET /api/v1/course-evaluations/student/me â€” à¸™à¸±à¸à¹€à¸£à¸µà¸¢à¸™à¸”à¸¹à¸£à¸µà¸§à¸´à¸§à¸•à¸±à¸§à¹€à¸­à¸‡
    @GetMapping("/student/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<CourseEvaluationResponse>>> getMyEvaluations(
            Authentication authentication) {
        List<CourseEvaluationResponse> response = evaluationService.getMyEvaluations(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("My evaluations retrieved successfully", response));
    }

    // GET /api/v1/course-evaluations/course/{courseId}/summary â€” à¸”à¸¹ summary à¸„à¸°à¹à¸™à¸™
    @GetMapping("/course/{courseId}/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<CourseEvaluationSummaryResponse>> getCourseSummary(
            @PathVariable Long courseId) {
        CourseEvaluationSummaryResponse response = evaluationService.getCourseSummary(courseId);
        return ResponseEntity.ok(ApiResponse.success("Course evaluation summary retrieved successfully", response));
    }

    // PUT /api/v1/course-evaluations/{id} â€” à¸™à¸±à¸à¹€à¸£à¸µà¸¢à¸™à¹à¸à¹‰à¹„à¸‚à¸£à¸µà¸§à¸´à¸§ (à¸ à¸²à¸¢à¹ƒà¸™ 24 à¸Šà¸¡.)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<CourseEvaluationResponse>> updateEvaluation(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCourseEvaluationRequest request,
            Authentication authentication) {
        CourseEvaluationResponse response = evaluationService.updateEvaluation(id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Evaluation updated successfully", response));
    }

    // PATCH /api/v1/course-evaluations/{id}/status â€” Admin à¹€à¸›à¸¥à¸µà¹ˆà¸¢à¸™ status
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseEvaluationResponse>> updateEvaluationStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEvaluationStatusRequest request) {
        CourseEvaluationResponse response = evaluationService.updateEvaluationStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Evaluation status updated successfully", response));
    }

    // DELETE /api/v1/course-evaluations/{id} â€” Admin à¸¥à¸šà¸£à¸µà¸§à¸´à¸§
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteEvaluation(@PathVariable Long id) {
        evaluationService.deleteEvaluation(id);
        return ResponseEntity.ok(ApiResponse.success("Evaluation deleted successfully"));
    }
}

