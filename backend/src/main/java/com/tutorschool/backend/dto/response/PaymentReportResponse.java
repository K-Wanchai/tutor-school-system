package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * รายงานข้อมูลการชำระเงิน — สร้างจาก Enrollment.status/Course.price เพราะเป็นแหล่งข้อมูลการชำระเงิน
 * จริงเพียงแหล่งเดียวที่ flow อนุมัติของแอดมินเขียนถึง (ตาราง Payment แยกไม่ถูกใช้งาน) จำกัดเฉพาะ
 * ใบสมัครที่ตรวจสอบจบแล้ว — APPROVED (ชำระเงินเรียบร้อยแล้ว) หรือ REJECTED (ปฏิเสธ)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReportResponse {

    private long totalCount;
    private BigDecimal totalAmount;
    private BigDecimal approvedAmount;
    private BigDecimal rejectedAmount;

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
        private String status;
        private String approvedBy;
        private LocalDateTime approvedAt;
    }
}
