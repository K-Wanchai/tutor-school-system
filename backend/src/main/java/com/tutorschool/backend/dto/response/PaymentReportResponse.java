package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * รายงานข้อมูลการชำระเงิน — สร้างจาก Enrollment.paymentStatus/finalAmount เพราะเป็นแหล่งข้อมูล
 * การชำระเงินจริงเพียงแหล่งเดียวที่ flow อนุมัติของแอดมินเขียนถึง (ตาราง Payment แยกไม่ถูกใช้งาน)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReportResponse {

    private long totalCount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal pendingAmount;

    private List<PaymentReportItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentReportItem {
        private Long enrollmentId;
        private String enrollmentCode;
        private LocalDateTime enrollmentDate;
        private String studentName;
        private String studentCode;
        private Long courseId;
        private String courseName;
        private String courseCode;
        private BigDecimal price;
        private String paymentMethod;
        private String paymentStatus;
        private String approvedBy;
        private LocalDateTime approvedAt;
    }
}
