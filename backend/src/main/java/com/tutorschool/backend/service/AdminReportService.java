package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.response.AdminReportResponse;
import com.tutorschool.backend.dto.response.AttendanceReportResponse;
import com.tutorschool.backend.dto.response.EnrollmentReportResponse;
import com.tutorschool.backend.dto.response.ExamPerformanceReportResponse;
import com.tutorschool.backend.dto.response.RevenueReportResponse;
import com.tutorschool.backend.entity.AttendanceStatus;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.entity.PaymentVerificationStatus;

import java.time.LocalDate;

public interface AdminReportService {

    AdminReportResponse getOverviewReport();

    RevenueReportResponse getRevenueReport(LocalDate dateFrom, LocalDate dateTo, Long courseId,
                                            PaymentVerificationStatus status);

    EnrollmentReportResponse getEnrollmentReport(LocalDate dateFrom, LocalDate dateTo, Long courseId,
                                                  EnrollmentStatus status);

    AttendanceReportResponse getAttendanceReport(LocalDate dateFrom, LocalDate dateTo, Long courseId,
                                                  Long studentId, AttendanceStatus status);

    ExamPerformanceReportResponse getExamPerformanceReport(LocalDate dateFrom, LocalDate dateTo, Long courseId,
                                                            Long tutorId);
}
