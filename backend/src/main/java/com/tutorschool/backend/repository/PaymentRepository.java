package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.Payment;
import com.tutorschool.backend.entity.PaymentVerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentCode(String paymentCode);

    List<Payment> findByEnrollmentId(Long enrollmentId);

    List<Payment> findByStudentId(Long studentId);

    boolean existsByEnrollmentIdAndPaymentStatusIn(Long enrollmentId, List<PaymentVerificationStatus> statuses);
}
