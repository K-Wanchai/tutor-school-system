package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.SaveAcademicMajorRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.AcademicMajorResponse;
import com.tutorschool.backend.service.AcademicMajorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * จัดการข้อมูลพื้นฐาน "สาขา" ภายใต้คณะของสถาบันประเภทมหาวิทยาลัย เฉพาะ ADMIN เท่านั้นที่เข้าถึงได้
 */
@RestController
@RequestMapping("/api/v1/admin/exam-institutions/{institutionId}/faculties/{facultyId}/majors")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AcademicMajorController {

    private final AcademicMajorService academicMajorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AcademicMajorResponse>>> getMajors(
            @PathVariable Long institutionId,
            @PathVariable Long facultyId) {
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสาขาสำเร็จ",
                academicMajorService.getMajors(institutionId, facultyId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AcademicMajorResponse>> createMajor(
            @PathVariable Long institutionId,
            @PathVariable Long facultyId,
            @Valid @RequestBody SaveAcademicMajorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("เพิ่มสาขาสำเร็จ",
                        academicMajorService.createMajor(institutionId, facultyId, request)));
    }

    @PutMapping("/{majorId}")
    public ResponseEntity<ApiResponse<AcademicMajorResponse>> updateMajor(
            @PathVariable Long institutionId,
            @PathVariable Long facultyId,
            @PathVariable Long majorId,
            @Valid @RequestBody SaveAcademicMajorRequest request) {
        return ResponseEntity.ok(ApiResponse.success("แก้ไขสาขาสำเร็จ",
                academicMajorService.updateMajor(institutionId, facultyId, majorId, request)));
    }

    @DeleteMapping("/{majorId}")
    public ResponseEntity<ApiResponse<Void>> deleteMajor(
            @PathVariable Long institutionId,
            @PathVariable Long facultyId,
            @PathVariable Long majorId) {
        academicMajorService.deleteMajor(institutionId, facultyId, majorId);
        return ResponseEntity.ok(ApiResponse.success("ปิดใช้งานสาขาสำเร็จ"));
    }
}
