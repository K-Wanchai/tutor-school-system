package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.response.AdminDashboardResponse;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.service.AdminDashboardService;
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

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboard() {
        AdminDashboardResponse data = adminDashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard data retrieved", data));
    }
}
