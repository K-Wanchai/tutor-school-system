package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.SaveVocationalMajorRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.VocationalMajorResponse;
import com.tutorschool.backend.service.VocationalMajorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * จัดการข้อมูลพื้นฐาน "สาขา" ของสถาบันประเภทอนุปริญญา (ปวส.) เฉพาะ ADMIN เท่านั้นที่เข้าถึงได้
 */
@RestController
@RequestMapping("/api/v1/admin/exam-institutions/{institutionId}/vocational-majors")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class VocationalMajorController {

    private final VocationalMajorService vocationalMajorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VocationalMajorResponse>>> getMajors(
            @PathVariable Long institutionId) {
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสาขาสำเร็จ",
                vocationalMajorService.getMajors(institutionId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VocationalMajorResponse>> createMajor(
            @PathVariable Long institutionId,
            @Valid @RequestBody SaveVocationalMajorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("เพิ่มสาขาสำเร็จ",
                        vocationalMajorService.createMajor(institutionId, request)));
    }

    @PutMapping("/{majorId}")
    public ResponseEntity<ApiResponse<VocationalMajorResponse>> updateMajor(
            @PathVariable Long institutionId,
            @PathVariable Long majorId,
            @Valid @RequestBody SaveVocationalMajorRequest request) {
        return ResponseEntity.ok(ApiResponse.success("แก้ไขสาขาสำเร็จ",
                vocationalMajorService.updateMajor(institutionId, majorId, request)));
    }

    @DeleteMapping("/{majorId}")
    public ResponseEntity<ApiResponse<Void>> deleteMajor(
            @PathVariable Long institutionId,
            @PathVariable Long majorId) {
        vocationalMajorService.deleteMajor(institutionId, majorId);
        return ResponseEntity.ok(ApiResponse.success("ปิดใช้งานสาขาสำเร็จ"));
    }
}
