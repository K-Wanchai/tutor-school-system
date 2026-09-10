package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * รายงานภาพรวมสำหรับผู้ดูแลระบบ — สรุปจากข้อมูลที่มีอยู่จริงในฐานข้อมูล
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReportResponse {

    private long totalStudents;
    private long totalTutors;
    private long totalCourses;
    private long totalEnrollments;

    // จำนวนคอร์สแยกตามสถานะ เช่น ONGOING, COMPLETED
    private Map<String, Long> coursesByStatus;
    // จำนวนใบสมัครแยกตามสถานะ เช่น APPROVED, PENDING
    private Map<String, Long> enrollmentsByStatus;
    // จำนวนบันทึกการเข้าเรียนแยกตามสถานะ เช่น PRESENT, ABSENT, LATE
    private Map<String, Long> attendanceByStatus;

    private BigDecimal totalRevenue;
    private long pendingPaymentVerifications;

    private long totalEvaluations;
    private double averageRating;

    private List<CourseReportItem> topCourses;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourseReportItem {
        private Long courseId;
        private String courseName;
        private String courseCode;
        private String tutorName;
        private String status;
        private long enrolledCount;
        private Double averageRating;
    }
}
