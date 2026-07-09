package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.ExamInstitutionRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.ExamInstitutionResponse;
import com.tutorschool.backend.dto.response.InstitutionAchievementOverviewResponse;
import com.tutorschool.backend.entity.InstitutionType;
import com.tutorschool.backend.service.ExamInstitutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * จัดการข้อมูลพื้นฐาน "สถาบันที่จัดสอบ" — สถาบันปลายทางที่นักเรียนสอบเข้า
 * (โรงเรียนมัธยม / มหาวิทยาลัย) เฉพาะ ADMIN เท่านั้นที่เข้าถึง endpoint นี้ได้
 */
@RestController
@RequestMapping("/api/v1/admin/exam-institutions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ExamInstitutionController {

    private final ExamInstitutionService examInstitutionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExamInstitutionResponse>>> getExamInstitutions(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) InstitutionType type,
            @RequestParam(required = false) Boolean active) {
        List<ExamInstitutionResponse> data = examInstitutionService.searchExamInstitutions(keyword, type, active);
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสถาบันที่จัดสอบสำเร็จ", data));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamInstitutionResponse>> getExamInstitutionById(@PathVariable Long id) {
        ExamInstitutionResponse data = examInstitutionService.getExamInstitutionById(id);
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลสถาบันที่จัดสอบสำเร็จ", data));
    }

    @GetMapping("/{id}/achievements")
    public ResponseEntity<ApiResponse<InstitutionAchievementOverviewResponse>> getInstitutionAchievements(
            @PathVariable Long id) {
        InstitutionAchievementOverviewResponse data = examInstitutionService.getInstitutionAchievements(id);
        return ResponseEntity.ok(ApiResponse.success("ดึงข้อมูลนักเรียนที่สอบติดสำเร็จ", data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExamInstitutionResponse>> createExamInstitution(
            @Valid @RequestBody ExamInstitutionRequest request) {
        ExamInstitutionResponse data = examInstitutionService.createExamInstitution(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("เพิ่มสถาบันที่จัดสอบสำเร็จ", data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExamInstitutionResponse>> updateExamInstitution(
            @PathVariable Long id,
            @Valid @RequestBody ExamInstitutionRequest request) {
        ExamInstitutionResponse data = examInstitutionService.updateExamInstitution(id, request);
        return ResponseEntity.ok(ApiResponse.success("แก้ไขข้อมูลสถาบันที่จัดสอบสำเร็จ", data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExamInstitution(@PathVariable Long id) {
        examInstitutionService.deleteExamInstitution(id);
        return ResponseEntity.ok(ApiResponse.success("ปิดใช้งานสถาบันที่จัดสอบสำเร็จ"));
    }
}
