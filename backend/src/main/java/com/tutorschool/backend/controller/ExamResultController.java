package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.ExamResultResponse;
import com.tutorschool.backend.service.ExamSubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/exam-results")
@RequiredArgsConstructor
public class ExamResultController {

    private final ExamSubmissionService submissionService;

    // Student ดูผลสอบของตัวเอง
    @GetMapping("/student/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<ExamResultResponse>>> getMyResults(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Results retrieved",
                submissionService.getMyResults(principal.getName())));
    }

    // Teacher ดูผลสอบแยกตาม exam
    @GetMapping("/exam/{examId}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ExamResultResponse>>> getResultsByExam(
            @PathVariable Long examId,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Results retrieved",
                submissionService.getResultsByExam(examId, principal.getName())));
    }

    // Teacher ดูผลสอบทั้งหมดในคอร์ส
    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('TEACHER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ExamResultResponse>>> getResultsByCourse(
            @PathVariable Long courseId,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Results retrieved",
                submissionService.getResultsByCourse(courseId, principal.getName())));
    }
}
