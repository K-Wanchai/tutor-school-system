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

    boolean existsByCourseId(Long courseId);

    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    boolean existsByStudentIdAndCourseIdAndStatusNot(Long studentId, Long courseId, EnrollmentStatus status);

    long countByCourseIdAndStatusIn(Long courseId, List<EnrollmentStatus> statuses);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId AND e.paymentStatus IN ('PENDING_VERIFICATION','PAID') AND e.status != 'CANCELLED'")
    long countConfirmedPaymentsByCourseId(@Param("courseId") Long courseId);

    List<Enrollment> findByPaymentStatus(PaymentStatus paymentStatus);

    List<Enrollment> findByStatus(EnrollmentStatus status);

    List<Enrollment> findByStudentIdAndStatus(Long studentId, EnrollmentStatus status);

    List<Enrollment> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT e FROM Enrollment e WHERE e.paymentStatus = 'UNPAID' AND e.paymentDeadline IS NOT NULL AND e.paymentDeadline < :now AND e.status != 'CANCELLED'")
    List<Enrollment> findExpiredUnpaidEnrollments(@Param("now") LocalDateTime now);

    void deleteByCourseId(Long courseId);
}
