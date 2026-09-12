package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * รายงานการสมัครเรียน — กรองตามช่วงวันที่, คอร์ส, สถานะการสมัคร
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnrollmentReportResponse {

    private long totalCount;
    private BigDecimal totalAmount;
    private Map<String, Long> byStatus;

    private List<EnrollmentReportItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EnrollmentReportItem {
        private Long enrollmentId;
        private String enrollmentCode;
        private LocalDateTime enrollmentDate;
        private String studentName;
        private String studentCode;
        private Long courseId;
        private String courseName;
        private String courseCode;
        private String tutorName;
        private String status;
        private String paymentStatus;
        private BigDecimal finalAmount;
    }
}
