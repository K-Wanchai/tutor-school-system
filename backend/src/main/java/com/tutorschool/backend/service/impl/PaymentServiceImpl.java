package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.CreatePaymentRequest;
import com.tutorschool.backend.dto.request.RejectPaymentRequest;
import com.tutorschool.backend.dto.request.VerifyPaymentRequest;
import com.tutorschool.backend.dto.response.PaymentResponse;
import com.tutorschool.backend.entity.*;
import com.tutorschool.backend.exception.*;
import com.tutorschool.backend.mapper.PaymentMapper;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.InstitutionProfileRepository;
import com.tutorschool.backend.repository.PaymentRepository;
import com.tutorschool.backend.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final InstitutionProfileRepository institutionProfileRepository;
    private final PaymentMapper paymentMapper;

    @Override
    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", request.getEnrollmentId()));

        String currentEmail = getCurrentUserEmail();
        if (!enrollment.getStudent().getUser().getEmail().equals(currentEmail)) {
            throw new UnauthorizedPaymentAccessException("You can only create payments for your own enrollments");
        }

        if ((request.getPaymentMethod() == PaymentMethod.BANK_TRANSFER ||
                request.getPaymentMethod() == PaymentMethod.PROMPTPAY) &&
                (request.getPaymentSlipUrl() == null || request.getPaymentSlipUrl().isBlank())) {
            throw new IllegalStateException("Payment slip URL is required for " + request.getPaymentMethod());
        }

        boolean hasDuplicate = paymentRepository.existsByEnrollmentIdAndPaymentStatusIn(
                enrollment.getId(),
                List.of(PaymentVerificationStatus.PENDING, PaymentVerificationStatus.VERIFIED));
        if (hasDuplicate) {
            throw new DuplicatePaymentException("A pending or verified payment already exists for this enrollment");
        }

        InstitutionProfile institutionProfile = institutionProfileRepository.findFirstBy()
                .orElseThrow(() -> new ResourceNotFoundException("Institution profile not configured. Please contact admin."));

        Payment payment = Payment.builder()
                .enrollment(enrollment)
                .student(enrollment.getStudent())
                .institutionProfile(institutionProfile)
                .amount(enrollment.getFinalAmount())
                .paymentMethod(request.getPaymentMethod())
                .paymentSlipUrl(request.getPaymentSlipUrl())
                .transactionReference(request.getTransactionReference())
                .note(request.getNote())
                .build();

        Payment saved = paymentRepository.save(payment);
        saved.setPaymentCode("PAY-" + String.format("%08d", saved.getId()));
        return paymentMapper.toResponse(paymentRepository.save(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new PaymentNotFoundException(id));

        if (!isAdmin() && !payment.getStudent().getUser().getEmail().equals(getCurrentUserEmail())) {
            throw new UnauthorizedPaymentAccessException("You do not have permission to view this payment");
        }

        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByCode(String paymentCode) {
        Payment payment = paymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found with code: " + paymentCode));
        return paymentMapper.toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByEnrollmentId(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", enrollmentId));

        if (!isAdmin() && !enrollment.getStudent().getUser().getEmail().equals(getCurrentUserEmail())) {
            throw new UnauthorizedPaymentAccessException("You do not have permission to view these payments");
        }

        return paymentRepository.findByEnrollmentId(enrollmentId).stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByStudentId(Long studentId) {
        return paymentRepository.findByStudentId(studentId).stream()
                .map(paymentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public PaymentResponse verifyPayment(Long id, VerifyPaymentRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new PaymentNotFoundException(id));

        if (payment.getPaymentStatus() != PaymentVerificationStatus.PENDING) {
            throw new InvalidPaymentStatusException(
                    "Only PENDING payments can be verified. Current status: " + payment.getPaymentStatus());
        }

        payment.setPaymentStatus(PaymentVerificationStatus.VERIFIED);
        payment.setVerifiedBy(getCurrentUserEmail());
        payment.setVerifiedAt(LocalDateTime.now());
        if (request != null && request.getNote() != null) {
            payment.setNote(request.getNote());
        }

        Enrollment enrollment = payment.getEnrollment();
        enrollment.setPaymentStatus(PaymentStatus.PAID);
        enrollmentRepository.save(enrollment);

        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional
    public PaymentResponse rejectPayment(Long id, RejectPaymentRequest request) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new PaymentNotFoundException(id));

        if (payment.getPaymentStatus() != PaymentVerificationStatus.PENDING) {
            throw new InvalidPaymentStatusException(
                    "Only PENDING payments can be rejected. Current status: " + payment.getPaymentStatus());
        }

        payment.setPaymentStatus(PaymentVerificationStatus.REJECTED);
        payment.setNote(request.getNote());

        Enrollment enrollment = payment.getEnrollment();
        enrollment.setPaymentStatus(PaymentStatus.UNPAID);
        enrollmentRepository.save(enrollment);

        return paymentMapper.toResponse(paymentRepository.save(payment));
    }

    @Override
    @Transactional
    public void deletePayment(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new PaymentNotFoundException(id));
        paymentRepository.delete(payment);
    }

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
