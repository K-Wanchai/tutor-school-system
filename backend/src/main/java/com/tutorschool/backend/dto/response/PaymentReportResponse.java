package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * รายงานข้อมูลการชำระเงิน — สร้างจาก Enrollment.status/finalAmount เพราะเป็นแหล่งข้อมูลการชำระเงิน
 * จริงเพียงแหล่งเดียวที่ flow อนุมัติของแอดมินเขียนถึง (ตาราง Payment แยกไม่ถูกใช้งาน) จำกัดเฉพาะ
 * ใบสมัครที่ตรวจสอบจบแล้ว — APPROVED (ชำระเงินเรียบร้อยแล้ว) หรือ REJECTED (ปฏิเสธ)
 *
 * price ใช้ Enrollment.finalAmount (ยอดที่บันทึกไว้จริงตอนสมัคร) ไม่ใช่ Course.price ปัจจุบัน
 * เพราะราคาคอร์สแก้ไขได้ภายหลัง การใช้ Course.price จะทำให้ยอดไม่ตรงกับหน้าประวัติการชำระเงิน
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
        // ผู้ดำเนินการ/วันที่ดำเนินการ — ครอบคลุมทั้งอนุมัติ (Enrollment.approvedBy) และปฏิเสธ
        // (Enrollment.rejectedBy) ส่วนวันที่ปฏิเสธไม่มีคอลัมน์แยก ใช้ updatedAt แทน — แถวเก่าก่อนมี
        // rejectedBy จะว่างเปล่า (ย้อนไปกรอกให้ไม่ได้)
        private String processedBy;
        private LocalDateTime processedAt;
        private String note;
    }
}
