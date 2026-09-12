package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.response.AdminReportResponse;
import com.tutorschool.backend.dto.response.EnrollmentReportResponse;
import com.tutorschool.backend.dto.response.RevenueReportResponse;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.entity.PaymentVerificationStatus;

import java.time.LocalDate;

public interface AdminReportService {

    AdminReportResponse getOverviewReport();

    RevenueReportResponse getRevenueReport(LocalDate dateFrom, LocalDate dateTo, Long courseId,
                                            PaymentVerificationStatus status);

    EnrollmentReportResponse getEnrollmentReport(LocalDate dateFrom, LocalDate dateTo, Long courseId,
                                                  EnrollmentStatus status);
}
