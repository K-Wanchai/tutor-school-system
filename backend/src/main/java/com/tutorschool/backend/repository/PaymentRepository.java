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
    // เพื่อให้พารามิเตอร์ไหนไม่ส่งมาก็ไม่ถูกใช้กรอง — ใช้ COALESCE(:param, field) แทน
    // "(:param IS NULL OR field = :param)" เพราะแบบหลัง PostgreSQL หาชนิดข้อมูลของพารามิเตอร์ที่เป็น
    // null ไม่ได้ (error 42P18 "could not determine data type of parameter") เมื่อไม่ส่ง filter มาเลย
    @Query("SELECT p FROM Payment p " +
            "WHERE p.createdAt >= COALESCE(:dateFrom, p.createdAt) " +
            "AND p.createdAt <= COALESCE(:dateTo, p.createdAt) " +
            "AND p.enrollment.course.id = COALESCE(:courseId, p.enrollment.course.id) " +
            "AND p.paymentStatus = COALESCE(:status, p.paymentStatus) " +
            "ORDER BY p.createdAt DESC")
    List<Payment> searchForReport(@Param("dateFrom") LocalDateTime dateFrom,
                                   @Param("dateTo") LocalDateTime dateTo,
                                   @Param("courseId") Long courseId,
                                   @Param("status") PaymentVerificationStatus status);
}
