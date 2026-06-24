package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.SaveTestQuestionRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.TestQuestionResponse;
import com.tutorschool.backend.service.TestQuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/course-tests/{testId}/questions")
@RequiredArgsConstructor
public class TestQuestionController {

    private final TestQuestionService testQuestionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<List<TestQuestionResponse>>> getQuestions(
            @PathVariable Long testId) {
        return ResponseEntity.ok(ApiResponse.success("OK", testQuestionService.getQuestions(testId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<TestQuestionResponse>> addQuestion(
            @PathVariable Long testId,
            @Valid @RequestBody SaveTestQuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Created", testQuestionService.saveQuestion(testId, request)));
    }

    @PutMapping("/{questionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<TestQuestionResponse>> updateQuestion(
            @PathVariable Long testId,
            @PathVariable Long questionId,
            @Valid @RequestBody SaveTestQuestionRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Updated",
                testQuestionService.updateQuestion(testId, questionId, request)));
    }

    @DeleteMapping("/{questionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(
            @PathVariable Long testId,
            @PathVariable Long questionId) {
        testQuestionService.deleteQuestion(testId, questionId);
        return ResponseEntity.ok(ApiResponse.success("Deleted"));
    }

    /** บันทึกคำถามทั้งชุดพร้อมกัน (replace all) */
    @PutMapping("/save-all")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<List<TestQuestionResponse>>> saveAll(
            @PathVariable Long testId,
            @RequestBody List<@Valid SaveTestQuestionRequest> questions) {
        return ResponseEntity.ok(ApiResponse.success("Saved",
                testQuestionService.saveAllQuestions(testId, questions)));
    }
}
