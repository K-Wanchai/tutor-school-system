package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.Payment;
import com.tutorschool.backend.entity.PaymentVerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentCode(String paymentCode);

    List<Payment> findByEnrollmentId(Long enrollmentId);

    List<Payment> findByStudentId(Long studentId);

    boolean existsByEnrollmentIdAndPaymentStatusIn(Long enrollmentId, List<PaymentVerificationStatus> statuses);

    long countByPaymentStatus(PaymentVerificationStatus paymentStatus);

    List<Payment> findTop5ByOrderByCreatedAtDesc();

    void deleteByEnrollmentIdIn(List<Long> enrollmentIds);

    // รายงานรายได้/การชำระเงิน — ใช้ createdAt เป็นวันที่ทำรายการ (paymentDate ไม่เคยถูกตั้งค่าจริง
    // ในโค้ด สร้าง Payment แล้วปล่อยเป็น null เสมอ ดู PaymentServiceImpl) กรองแบบ nullable-param
    // เพื่อให้พารามิเตอร์ไหนไม่ส่งมาก็ไม่ถูกใช้กรอง
    @Query("SELECT p FROM Payment p " +
            "WHERE (:dateFrom IS NULL OR p.createdAt >= :dateFrom) " +
            "AND (:dateTo IS NULL OR p.createdAt <= :dateTo) " +
            "AND (:courseId IS NULL OR p.enrollment.course.id = :courseId) " +
            "AND (:status IS NULL OR p.paymentStatus = :status) " +
            "ORDER BY p.createdAt DESC")
    List<Payment> searchForReport(@Param("dateFrom") LocalDateTime dateFrom,
                                   @Param("dateTo") LocalDateTime dateTo,
                                   @Param("courseId") Long courseId,
                                   @Param("status") PaymentVerificationStatus status);
}
