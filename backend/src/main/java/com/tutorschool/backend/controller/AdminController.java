package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.response.AdminDashboardResponse;
import com.tutorschool.backend.dto.response.AdminReportResponse;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.EnrollmentReportResponse;
import com.tutorschool.backend.dto.response.RevenueReportResponse;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.entity.PaymentVerificationStatus;
import com.tutorschool.backend.service.AdminDashboardService;
import com.tutorschool.backend.service.AdminReportService;
import com.tutorschool.backend.util.CsvWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

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

    // ─── รายงานรายได้/การชำระเงิน ────────────────────────────────────────────

    @GetMapping("/reports/revenue")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RevenueReportResponse>> getRevenueReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) PaymentVerificationStatus status) {
        RevenueReportResponse data = adminReportService.getRevenueReport(dateFrom, dateTo, courseId, status);
        return ResponseEntity.ok(ApiResponse.success("Revenue report retrieved", data));
    }

    @GetMapping("/reports/revenue/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> exportRevenueReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) PaymentVerificationStatus status) {
        RevenueReportResponse data = adminReportService.getRevenueReport(dateFrom, dateTo, courseId, status);
        List<String> headers = List.of(
                "วันที่", "รหัสการชำระเงิน", "นักเรียน", "รหัสนักเรียน", "คอร์ส", "รหัสคอร์ส",
                "ยอดชำระ", "วิธีชำระ", "สถานะ");
        List<List<String>> rows = data.getItems().stream()
                .map(i -> List.of(
                        str(i.getPaymentDate()), str(i.getPaymentCode()), str(i.getStudentName()),
                        str(i.getStudentCode()), str(i.getCourseName()), str(i.getCourseCode()),
                        str(i.getAmount()), str(i.getPaymentMethod()), str(i.getPaymentStatus())))
                .toList();
        return csvResponse("revenue-report", headers, rows);
    }

    // ─── รายงานการสมัครเรียน ─────────────────────────────────────────────────

    @GetMapping("/reports/enrollments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<EnrollmentReportResponse>> getEnrollmentReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) EnrollmentStatus status) {
        EnrollmentReportResponse data = adminReportService.getEnrollmentReport(dateFrom, dateTo, courseId, status);
        return ResponseEntity.ok(ApiResponse.success("Enrollment report retrieved", data));
    }

    @GetMapping("/reports/enrollments/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> exportEnrollmentReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) EnrollmentStatus status) {
        EnrollmentReportResponse data = adminReportService.getEnrollmentReport(dateFrom, dateTo, courseId, status);
        List<String> headers = List.of(
                "รหัสสมัคร", "วันที่สมัคร", "นักเรียน", "รหัสนักเรียน", "คอร์ส", "รหัสคอร์ส",
                "ติวเตอร์", "สถานะสมัคร", "สถานะชำระเงิน", "ยอดชำระ");
        List<List<String>> rows = data.getItems().stream()
                .map(i -> List.of(
                        str(i.getEnrollmentCode()), str(i.getEnrollmentDate()), str(i.getStudentName()),
                        str(i.getStudentCode()), str(i.getCourseName()), str(i.getCourseCode()),
                        str(i.getTutorName()), str(i.getStatus()), str(i.getPaymentStatus()),
                        str(i.getFinalAmount())))
                .toList();
        return csvResponse("enrollment-report", headers, rows);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private String str(Object value) {
        return value == null ? "" : value.toString();
    }

    private ResponseEntity<String> csvResponse(String filenamePrefix, List<String> headers, List<List<String>> rows) {
        String csv = CsvWriter.write(headers, rows);
        String filename = filenamePrefix + "-" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8).build().toString())
                .body(csv);
    }
}
