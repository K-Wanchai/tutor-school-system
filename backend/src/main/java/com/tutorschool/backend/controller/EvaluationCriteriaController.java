package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.CreateEvaluationCriteriaRequest;
import com.tutorschool.backend.dto.request.ReorderEvaluationCriteriaRequest;
import com.tutorschool.backend.dto.request.UpdateEvaluationCriteriaRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.EvaluationCriteriaResponse;
import com.tutorschool.backend.service.EvaluationCriteriaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/evaluation-criteria")
@RequiredArgsConstructor
public class EvaluationCriteriaController {

    private final EvaluationCriteriaService evaluationCriteriaService;

    // GET /api/v1/evaluation-criteria — เฉพาะหัวข้อที่เปิดใช้งาน ให้ฟอร์มประเมินของนักเรียนใช้
    @GetMapping
    public ResponseEntity<ApiResponse<List<EvaluationCriteriaResponse>>> getActiveCriteria() {
        List<EvaluationCriteriaResponse> response = evaluationCriteriaService.getActiveCriteria();
        return ResponseEntity.ok(ApiResponse.success("Evaluation criteria retrieved successfully", response));
    }

    // GET /api/v1/evaluation-criteria/all — Admin เห็นทุกหัวข้อ รวมที่ปิดใช้งาน
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<EvaluationCriteriaResponse>>> getAllCriteria() {
        List<EvaluationCriteriaResponse> response = evaluationCriteriaService.getAllCriteria();
        return ResponseEntity.ok(ApiResponse.success("Evaluation criteria retrieved successfully", response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EvaluationCriteriaResponse>> createCriteria(
            @Valid @RequestBody CreateEvaluationCriteriaRequest request) {
        EvaluationCriteriaResponse response = evaluationCriteriaService.createCriteria(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Evaluation criteria created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EvaluationCriteriaResponse>> updateCriteria(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEvaluationCriteriaRequest request) {
        EvaluationCriteriaResponse response = evaluationCriteriaService.updateCriteria(id, request);
        return ResponseEntity.ok(ApiResponse.success("Evaluation criteria updated successfully", response));
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<EvaluationCriteriaResponse>>> reorderCriteria(
            @Valid @RequestBody ReorderEvaluationCriteriaRequest request) {
        List<EvaluationCriteriaResponse> response = evaluationCriteriaService.reorderCriteria(request);
        return ResponseEntity.ok(ApiResponse.success("Evaluation criteria reordered successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCriteria(@PathVariable Long id) {
        evaluationCriteriaService.deleteCriteria(id);
        return ResponseEntity.ok(ApiResponse.success("Evaluation criteria deleted successfully"));
    }
}
