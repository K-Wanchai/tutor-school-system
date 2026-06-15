package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.UpdateInstitutionProfileRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.InstitutionProfileResponse;
import com.tutorschool.backend.service.InstitutionProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/institution-profile")
@RequiredArgsConstructor
public class InstitutionProfileController {

    private final InstitutionProfileService institutionProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<InstitutionProfileResponse>> getInstitutionProfile() {
        InstitutionProfileResponse response = institutionProfileService.getInstitutionProfile();
        return ResponseEntity.ok(ApiResponse.success("Institution profile retrieved successfully", response));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<InstitutionProfileResponse>> updateInstitutionProfile(
            @Valid @RequestBody UpdateInstitutionProfileRequest request) {
        InstitutionProfileResponse response = institutionProfileService.updateInstitutionProfile(request);
        return ResponseEntity.ok(ApiResponse.success("Institution profile updated successfully", response));
    }
}
