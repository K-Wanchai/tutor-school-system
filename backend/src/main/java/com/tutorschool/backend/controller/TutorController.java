package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.CreateTutorRequest;
import com.tutorschool.backend.dto.request.UpdateTutorRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.dto.response.TutorResponse;
import com.tutorschool.backend.service.TutorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/tutors")
@RequiredArgsConstructor
public class TutorController {

    private final TutorService TutorService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'Tutor', 'STUDENT')")
    public ResponseEntity<ApiResponse<PageResponse<TutorResponse>>> getAllTeachers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<TutorResponse> response = TutorService.getAllTeachers(page, size);
        return ResponseEntity.ok(ApiResponse.success("Teachers retrieved successfully", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'Tutor', 'STUDENT')")
    public ResponseEntity<ApiResponse<TutorResponse>> getTeacherById(@PathVariable Long id) {
        TutorResponse response = TutorService.getTeacherById(id);
        return ResponseEntity.ok(ApiResponse.success("Tutor retrieved successfully", response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TutorResponse>> createTeacher(
            @Valid @RequestBody CreateTutorRequest request) {
        TutorResponse response = TutorService.createTeacher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tutor created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TutorResponse>> updateTeacher(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTutorRequest request) {
        TutorResponse response = TutorService.updateTeacher(id, request);
        return ResponseEntity.ok(ApiResponse.success("Tutor updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTeacher(@PathVariable Long id) {
        TutorService.deleteTeacher(id);
        return ResponseEntity.ok(ApiResponse.success("Tutor deleted successfully"));
    }
}
