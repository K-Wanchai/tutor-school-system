package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.ManualGradeRequest;
import com.tutorschool.backend.dto.request.SubmitExamRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.ExamSubmissionResponse;
import com.tutorschool.backend.dto.response.StudentExamResponse;
import com.tutorschool.backend.service.ExamSubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ExamSubmissionController {

    private final ExamSubmissionService submissionService;

    // ─── Student: เริ่มสอบ ────────────────────────────────────────────────────

    @PostMapping("/exams/{examId}/start")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<StudentExamResponse>> startExam(
            @PathVariable Long examId,
            Principal principal) {
        StudentExamResponse response = submissionService.startExam(examId, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Exam started successfully", response));
    }

    // ─── Student: ส่งข้อสอบ ───────────────────────────────────────────────────

    @PostMapping("/exams/{examId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<ExamSubmissionResponse>> submitExam(
            @PathVariable Long examId,
            @Valid @RequestBody SubmitExamRequest request,
            Principal principal) {
        ExamSubmissionResponse response = submissionService.submitExam(examId, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Exam submitted successfully", response));
    }

    // ─── Student: ดูการสอบของตัวเอง ──────────────────────────────────────────

    @GetMapping("/exam-submissions/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<ExamSubmissionResponse>>> getMySubmissions(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Submissions retrieved",
                submissionService.getMySubmissions(principal.getName())));
    }

    @GetMapping("/exam-submissions/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ExamSubmissionResponse>> getSubmissionById(
            @PathVariable Long id,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Submission retrieved",
                submissionService.getSubmissionById(id, principal.getName())));
    }

    // ─── Tutor: Manual grading ──────────────────────────────────────────────

    @PostMapping("/exam-submissions/{submissionId}/grade")
    @PreAuthorize("hasRole('Tutor') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExamSubmissionResponse>> manualGrade(
            @PathVariable Long submissionId,
            @Valid @RequestBody ManualGradeRequest request,
            Principal principal) {
        ExamSubmissionResponse response = submissionService.manualGrade(submissionId, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Grading completed", response));
    }
}
