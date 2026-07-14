package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.SaveAdmissionRoundRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.AdmissionRoundResponse;
import com.tutorschool.backend.service.AdmissionRoundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * จัดการข้อมูลพื้นฐาน "รอบที่สอบติด" ของแต่ละสถาบัน เฉพาะ ADMIN เท่านั้นที่เข้าถึงได้
 */
@RestController
@RequestMapping("/api/v1/admin/exam-institutions/{institutionId}/admission-rounds")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdmissionRoundController {

    private final AdmissionRoundService admissionRoundService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdmissionRoundResponse>>> getRounds(@PathVariable Long institutionId) {
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลรอบที่สอบติดสำเร็จ", admissionRoundService.getRounds(institutionId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdmissionRoundResponse>> createRound(
            @PathVariable Long institutionId,
            @Valid @RequestBody SaveAdmissionRoundRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("เพิ่มรอบที่สอบติดสำเร็จ", admissionRoundService.createRound(institutionId, request)));
    }

    @PutMapping("/{roundId}")
    public ResponseEntity<ApiResponse<AdmissionRoundResponse>> updateRound(
            @PathVariable Long institutionId,
            @PathVariable Long roundId,
            @Valid @RequestBody SaveAdmissionRoundRequest request) {
        return ResponseEntity.ok(ApiResponse.success("แก้ไขรอบที่สอบติดสำเร็จ",
                admissionRoundService.updateRound(institutionId, roundId, request)));
    }

    @DeleteMapping("/{roundId}")
    public ResponseEntity<ApiResponse<Void>> deleteRound(
            @PathVariable Long institutionId,
            @PathVariable Long roundId) {
        admissionRoundService.deleteRound(institutionId, roundId);
        return ResponseEntity.ok(ApiResponse.success("ปิดใช้งานรอบที่สอบติดสำเร็จ"));
    }
}
