package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {

    private long totalStudents;
    private long totalTutors;
    private long totalCourses;
    private long totalEnrollments;
    private long pendingPayments;
    private List<RecentEnrollmentItem> recentEnrollments;
    private List<RecentPaymentItem> recentPayments;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentEnrollmentItem {
        private Long id;
        private String enrollmentCode;
        private String studentName;
        private String courseName;
        private String tutorName;
        private LocalDateTime enrollmentDate;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentPaymentItem {
        private Long id;
        private String paymentCode;
        private String studentName;
        private String courseName;
        private BigDecimal amount;
        private LocalDateTime paymentDate;
        private String paymentStatus;
    }
}
