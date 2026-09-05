package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.Enrollment;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByStudentId(Long studentId);

    boolean existsByStudentId(Long studentId);

    List<Enrollment> findByCourseId(Long courseId);

    // REJECTED/CANCELLED rows don't count as "still linked" to the course — only an enrollment
    // that's PENDING/APPROVED/COMPLETED should block deleting the course.
    boolean existsByCourseIdAndStatusNotIn(Long courseId, List<EnrollmentStatus> statuses);

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    // student_id + course_id is no longer unique (a student can have a REJECTED/CANCELLED row
    // and later a new one for the same course) — always scope lookups by status too, since
    // findByStudentIdAndCourseId alone would throw IncorrectResultSizeDataAccessException once
    // more than one row exists for the pair.
    Optional<Enrollment> findByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, EnrollmentStatus status);

    boolean existsByStudentIdAndCourseIdAndStatusNotIn(Long studentId, Long courseId, List<EnrollmentStatus> statuses);

    long countByCourseIdAndStatusIn(Long courseId, List<EnrollmentStatus> statuses);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId AND e.paymentStatus IN ('PENDING_VERIFICATION','PAID') AND e.status NOT IN ('CANCELLED','REJECTED')")
    long countConfirmedPaymentsByCourseId(@Param("courseId") Long courseId);

    List<Enrollment> findByPaymentStatus(PaymentStatus paymentStatus);

    List<Enrollment> findByStatus(EnrollmentStatus status);

    List<Enrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);

    List<Enrollment> findTop5ByOrderByCreatedAtDesc();

    // ครอบคลุมทั้ง UNPAID (ยังไม่เคยส่งสลิป) และ FAILED (ถูกตีกลับให้แก้ไขสลิปแล้วแต่ยังไม่ส่งใหม่) —
    // ทั้งสองกรณีมี paymentDeadline เป็นตัวกำหนดเส้นตายเดียวกัน ดู EnrollmentServiceImpl.returnForSlipRevision
    @Query("SELECT e FROM Enrollment e WHERE e.paymentStatus IN ('UNPAID', 'FAILED') AND e.paymentDeadline IS NOT NULL AND e.paymentDeadline < :now AND e.status != 'CANCELLED'")
    List<Enrollment> findExpiredPaymentEnrollments(@Param("now") LocalDateTime now);

    void deleteByCourseId(Long courseId);
}
