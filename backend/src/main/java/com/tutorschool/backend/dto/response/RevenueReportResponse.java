package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * รายงานรายได้/การชำระเงิน — กรองตามช่วงวันที่, คอร์ส, สถานะการชำระเงิน
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueReportResponse {

    private long totalCount;
    private BigDecimal totalAmount;
    private BigDecimal verifiedAmount;
    private BigDecimal pendingAmount;

    private List<RevenueReportItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueReportItem {
        private Long paymentId;
        private String paymentCode;
        private LocalDateTime paymentDate;
        private String studentName;
        private String studentCode;
        private Long courseId;
        private String courseName;
        private String courseCode;
        private BigDecimal amount;
        private String paymentMethod;
        private String paymentStatus;
    }
}
