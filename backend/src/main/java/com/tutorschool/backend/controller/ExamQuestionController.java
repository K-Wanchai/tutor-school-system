package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.CreateQuestionOptionRequest;
import com.tutorschool.backend.dto.request.UpdateExamQuestionRequest;
import com.tutorschool.backend.dto.request.UpdateQuestionOptionRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.ExamQuestionResponse;
import com.tutorschool.backend.dto.response.QuestionOptionResponse;
import com.tutorschool.backend.service.ExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
public class ExamQuestionController {

    private final ExamService examService;

    // ─── Question endpoints ────────────────────────────────────────────────────

    @PutMapping("/api/v1/exam-questions/{id}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExamQuestionResponse>> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody UpdateExamQuestionRequest request,
            Principal principal) {
        ExamQuestionResponse response = examService.updateQuestion(id, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Question updated", response));
    }

    @DeleteMapping("/api/v1/exam-questions/{id}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(@PathVariable Long id, Principal principal) {
        examService.deleteQuestion(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Question deleted"));
    }

    // ─── Option endpoints ──────────────────────────────────────────────────────

    @PostMapping("/api/v1/questions/{questionId}/options")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<QuestionOptionResponse>> addOption(
            @PathVariable Long questionId,
            @Valid @RequestBody CreateQuestionOptionRequest request,
            Principal principal) {
        QuestionOptionResponse response = examService.addOption(questionId, request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Option added", response));
    }

    @PutMapping("/api/v1/question-options/{id}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<QuestionOptionResponse>> updateOption(
            @PathVariable Long id,
            @Valid @RequestBody UpdateQuestionOptionRequest request,
            Principal principal) {
        QuestionOptionResponse response = examService.updateOption(id, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Option updated", response));
    }

    @DeleteMapping("/api/v1/question-options/{id}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteOption(@PathVariable Long id, Principal principal) {
        examService.deleteOption(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Option deleted"));
    }
}
