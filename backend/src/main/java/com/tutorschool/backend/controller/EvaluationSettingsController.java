package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.UpdateEvaluationSettingsRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.EvaluationSettingsResponse;
import com.tutorschool.backend.service.EvaluationSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/evaluation-settings")
@RequiredArgsConstructor
public class EvaluationSettingsController {

    private final EvaluationSettingsService evaluationSettingsService;

    @GetMapping
    public ResponseEntity<ApiResponse<EvaluationSettingsResponse>> getEvaluationSettings() {
        EvaluationSettingsResponse response = evaluationSettingsService.getEvaluationSettings();
        return ResponseEntity.ok(ApiResponse.success("Evaluation settings retrieved successfully", response));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EvaluationSettingsResponse>> updateEvaluationSettings(
            @Valid @RequestBody UpdateEvaluationSettingsRequest request) {
        EvaluationSettingsResponse response = evaluationSettingsService.updateEvaluationSettings(request);
        return ResponseEntity.ok(ApiResponse.success("Evaluation settings updated successfully", response));
    }
}
