package com.tutorschool.backend.scheduler;

import com.tutorschool.backend.entity.Enrollment;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentDeadlineScheduler {

    private final EnrollmentRepository enrollmentRepository;

    // ยกเลิกอัตโนมัติทั้งกรณี UNPAID (หมดเวลาชำระเงินรอบแรก) และ FAILED (หมดเวลาที่ให้แก้ไขสลิปหลังถูกตีกลับ)
    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void cancelExpiredEnrollments() {
        List<Enrollment> expired = enrollmentRepository.findExpiredPaymentEnrollments(LocalDateTime.now());
        if (expired.isEmpty()) return;
        for (Enrollment e : expired) e.setStatus(EnrollmentStatus.CANCELLED);
        enrollmentRepository.saveAll(expired);
        log.info("Auto-cancelled {} expired enrollments (unpaid deadline or slip-revision deadline)", expired.size());
    }
}
