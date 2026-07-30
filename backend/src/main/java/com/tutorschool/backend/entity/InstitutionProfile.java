package com.tutorschool.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "institution_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "institution_code", nullable = false, unique = true, length = 50)
    private String institutionCode;

    @Column(name = "institution_name", nullable = false, length = 255)
    private String institutionName;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_account_name", length = 255)
    private String bankAccountName;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_qr_code", columnDefinition = "TEXT")
    private String bankQrCode;

    @Column(name = "prompt_pay_id", length = 20)
    private String promptPayId;

    @Column(name = "enrollment_payment_deadline_minutes")
    private Integer enrollmentPaymentDeadlineMinutes;

    // ช่วงเวลาที่อนุญาตให้จัดตารางสอนต่อวัน รูปแบบเดียวกับ scheduleDays เช่น "MON:14:00-20:00,SAT:09:00-18:00"
    // วันที่ไม่ได้ตั้งค่าไว้ = ไม่จำกัดเวลาสำหรับวันนั้น
    @Column(name = "allowed_time_slots", columnDefinition = "TEXT")
    private String allowedTimeSlots;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
