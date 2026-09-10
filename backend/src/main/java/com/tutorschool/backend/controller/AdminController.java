package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.response.AdminDashboardResponse;
import com.tutorschool.backend.dto.response.AdminReportResponse;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.service.AdminDashboardService;
import com.tutorschool.backend.service.AdminReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminDashboardService adminDashboardService;
    private final AdminReportService adminReportService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboard() {
        AdminDashboardResponse data = adminDashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard data retrieved", data));
    }

    @GetMapping("/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminReportResponse>> getOverviewReport() {
        AdminReportResponse data = adminReportService.getOverviewReport();
        return ResponseEntity.ok(ApiResponse.success("Report data retrieved", data));
    }
}
