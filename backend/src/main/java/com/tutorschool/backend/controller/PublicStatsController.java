package com.tutorschool.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.EntranceExamResultReportResponse;
import com.tutorschool.backend.dto.response.PublicEntranceExamStatsResponse;
import com.tutorschool.backend.service.AdminReportService;

import lombok.RequiredArgsConstructor;

/**
 * สถิติสาธารณะสำหรับหน้าแลนดิ้งเพจ — ไม่ต้องล็อกอิน (permitAll ดูที่ SecurityConfig)
 * แสดงเฉพาะตัวเลขรวม/ชื่อสถาบัน ไม่เปิดเผยชื่อหรือข้อมูลส่วนตัวของนักเรียนรายบุคคล
 */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicStatsController {

    private static final int TOP_INSTITUTIONS_LIMIT = 6;

    private final AdminReportService adminReportService;

    @GetMapping("/entrance-exam-stats")
    public ResponseEntity<ApiResponse<PublicEntranceExamStatsResponse>> getEntranceExamStats() {
        EntranceExamResultReportResponse full = adminReportService.getEntranceExamResultReport(null, null);

        List<EntranceExamResultReportResponse.InstitutionCount> byInstitution =
                full.getByInstitution() != null ? full.getByInstitution() : List.of();
        List<EntranceExamResultReportResponse.InstitutionCount> top =
                byInstitution.stream().limit(TOP_INSTITUTIONS_LIMIT).toList();

        PublicEntranceExamStatsResponse response = PublicEntranceExamStatsResponse.builder()
                .totalCount(full.getTotalCount())
                .totalInstitutions(byInstitution.size())
                .topInstitutions(top)
                .byEducationLevel(full.getByEducationLevel())
                .build();

        return ResponseEntity.ok(ApiResponse.success("Entrance exam stats retrieved", response));
    }
}
