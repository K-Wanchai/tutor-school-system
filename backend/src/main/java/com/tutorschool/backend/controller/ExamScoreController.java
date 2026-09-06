package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.SaveExamScoreRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.ExamManualScoreResponse;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.service.ExamScoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * คะแนนสอบที่ติวเตอร์กรอกเอง (ข้อสอบลิงก์ภายนอก) — ใช้ในหน้า "คะแนนสอบ" ฝั่งติวเตอร์
 */
@RestController
@RequestMapping("/api/v1/exam-scores")
@RequiredArgsConstructor
public class ExamScoreController {

    private final ExamScoreService examScoreService;

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ExamManualScoreResponse>>> getCourseScores(
            @PathVariable Long courseId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Scores retrieved",
                examScoreService.getCourseScores(courseId, currentUser)));
    }

    @PutMapping
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExamManualScoreResponse>> saveScore(
            @Valid @RequestBody SaveExamScoreRequest request,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Score saved",
                examScoreService.saveScore(request, principal.getName())));
    }

    @DeleteMapping("/exam/{examId}/student/{studentId}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteScore(
            @PathVariable Long examId,
            @PathVariable Long studentId,
            Principal principal) {
        examScoreService.deleteScore(examId, studentId, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Score deleted"));
    }
}
