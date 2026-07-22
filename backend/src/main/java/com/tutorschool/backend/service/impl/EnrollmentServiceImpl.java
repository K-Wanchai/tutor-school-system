package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.*;
import com.tutorschool.backend.dto.request.ConfirmEnrollmentRequest;
import com.tutorschool.backend.dto.response.EnrollmentResponse;
import com.tutorschool.backend.entity.*;
import com.tutorschool.backend.exception.CourseScheduleConflictException;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.EnrollmentMapper;
import com.tutorschool.backend.repository.CourseRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.InstitutionProfileRepository;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.service.EnrollmentService;
import com.tutorschool.backend.util.ScheduleDaysParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private static final int DEFAULT_PAYMENT_DEADLINE_MINUTES = 15;

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentMapper enrollmentMapper;
    private final InstitutionProfileRepository institutionProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getAllEnrollments() {
        return enrollmentRepository.findAll().stream()
                .map(enrollmentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EnrollmentResponse getEnrollmentById(Long id) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));
        return enrollmentMapper.toResponse(enrollment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByStudentId(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Student", studentId);
        }
        return enrollmentRepository.findByStudentId(studentId).stream()
                .map(enrollmentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrollmentsByCourseId(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", courseId);
        }
        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(enrollmentMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public EnrollmentResponse enrollStudent(CreateEnrollmentRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", request.getStudentId()));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", request.getCourseId()));

        validateEnrollmentEligibility(request.getStudentId(), request.getCourseId(), course);

        // Remove any cancelled record so the student can re-enroll (unique constraint).
        // flush() is required: Hibernate flushes inserts before deletes within the same
        // transaction, so without it the insert below would race the delete and violate
        // the unique (student_id, course_id) constraint.
        enrollmentRepository.findByStudentIdAndCourseId(request.getStudentId(), request.getCourseId())
                .filter(e -> e.getStatus() == EnrollmentStatus.CANCELLED)
                .ifPresent(e -> {
                    enrollmentRepository.delete(e);
                    enrollmentRepository.flush();
                });

        BigDecimal amount = course.getPrice();
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = amount.subtract(discountAmount);

        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .course(course)
                .paymentMethod(request.getPaymentMethod())
                .amount(amount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .note(request.getNote())
                .paymentDeadline(LocalDateTime.now().plusMinutes(getPaymentDeadlineMinutes()))
                .build();

        Enrollment saved = enrollmentRepository.save(enrollment);
        saved.setEnrollmentCode("ENR-" + String.format("%08d", saved.getId()));
        return enrollmentMapper.toResponse(enrollmentRepository.save(saved));
    }

    @Override
    @Transactional
    public EnrollmentResponse confirmEnrollmentWithPayment(Long studentId, ConfirmEnrollmentRequest request) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", request.getCourseId()));

        if (course.getStatus() != CourseStatus.OPEN_FOR_REGISTRATION) {
            throw new IllegalStateException("Course is not open for registration");
        }

        // Check not already enrolled with an active record
        if (enrollmentRepository.existsByStudentIdAndCourseIdAndStatusNot(studentId, request.getCourseId(), EnrollmentStatus.CANCELLED)) {
            throw new DuplicateResourceException("Student is already enrolled in this course");
        }

        validateNoScheduleConflict(studentId, course);

        // Remove previous cancelled record (unique constraint) — flush immediately,
        // otherwise Hibernate flushes the insert below before this delete and the
        // unique (student_id, course_id) constraint rejects it.
        enrollmentRepository.findByStudentIdAndCourseId(studentId, request.getCourseId())
                .filter(e -> e.getStatus() == EnrollmentStatus.CANCELLED)
                .ifPresent(e -> {
                    enrollmentRepository.delete(e);
                    enrollmentRepository.flush();
                });

        // Seat check — only count those who have confirmed payment
        long confirmed = enrollmentRepository.countConfirmedPaymentsByCourseId(course.getId());
        if (confirmed >= course.getSeatLimit()) {
            throw new IllegalStateException("SEAT_FULL");
        }

        BigDecimal amount = course.getPrice();
        Enrollment enrollment = Enrollment.builder()
                .student(student)
                .course(course)
                .amount(amount)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(amount)
                .paymentSlipUrl(request.getPaymentSlipUrl())
                .paymentStatus(PaymentStatus.PENDING_VERIFICATION)
                .build();

        Enrollment saved = enrollmentRepository.save(enrollment);
        saved.setEnrollmentCode("ENR-" + String.format("%08d", saved.getId()));
        return enrollmentMapper.toResponse(enrollmentRepository.save(saved));
    }

    @Override
    @Transactional
    public EnrollmentResponse updateEnrollmentStatus(Long id, UpdateEnrollmentRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));

        enrollment.setStatus(request.getStatus());
        if (request.getNote() != null) {
            enrollment.setNote(request.getNote());
        }
        return enrollmentMapper.toResponse(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional
    public EnrollmentResponse updatePayment(Long id, UpdatePaymentRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));

        if (request.getPaymentStatus() != null) {
            enrollment.setPaymentStatus(request.getPaymentStatus());
        }
        if (request.getPaymentMethod() != null) {
            enrollment.setPaymentMethod(request.getPaymentMethod());
        }
        if (request.getDiscountAmount() != null) {
            BigDecimal discount = request.getDiscountAmount();
            if (discount.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Discount amount cannot be negative");
            }
            BigDecimal finalAmount = enrollment.getAmount().subtract(discount);
            if (finalAmount.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Final amount cannot be negative");
            }
            enrollment.setDiscountAmount(discount);
            enrollment.setFinalAmount(finalAmount);
        }
        if (request.getNote() != null) {
            enrollment.setNote(request.getNote());
        }

        return enrollmentMapper.toResponse(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional
    public EnrollmentResponse uploadPaymentSlip(Long id, UploadSlipRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));

        if (enrollment.getStatus() == EnrollmentStatus.CANCELLED) {
            throw new IllegalStateException("Enrollment has been cancelled due to payment timeout");
        }

        // Check seat availability at payment confirmation — this is when seats are reserved
        Course course = enrollment.getCourse();
        long confirmed = enrollmentRepository.countConfirmedPaymentsByCourseId(course.getId());
        // exclude self if already PENDING_VERIFICATION (re-upload case)
        long selfOffset = enrollment.getPaymentStatus() == PaymentStatus.PENDING_VERIFICATION ? 1L : 0L;
        if (confirmed - selfOffset >= course.getSeatLimit()) {
            throw new IllegalStateException("SEAT_FULL");
        }

        enrollment.setPaymentSlipUrl(request.getPaymentSlipUrl());
        enrollment.setPaymentStatus(PaymentStatus.PENDING_VERIFICATION);

        return enrollmentMapper.toResponse(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional
    public EnrollmentResponse approveEnrollment(Long id, ApproveEnrollmentRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));

        enrollment.setStatus(EnrollmentStatus.APPROVED);
        enrollment.setApprovedBy(request.getApprovedBy());
        enrollment.setApprovedAt(LocalDateTime.now());
        if (request.getNote() != null) {
            enrollment.setNote(request.getNote());
        }

        return enrollmentMapper.toResponse(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional
    public void cancelEnrollment(Long id) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));

        enrollment.setStatus(EnrollmentStatus.CANCELLED);
        enrollmentRepository.save(enrollment);
    }

    private int getPaymentDeadlineMinutes() {
        return institutionProfileRepository.findFirstBy()
                .map(InstitutionProfile::getEnrollmentPaymentDeadlineMinutes)
                .orElse(DEFAULT_PAYMENT_DEADLINE_MINUTES);
    }

    private void validateEnrollmentEligibility(Long studentId, Long courseId, Course course) {
        if (course.getStatus() != CourseStatus.OPEN_FOR_REGISTRATION) {
            LocalDate today = LocalDate.now();
            if (course.getRegistrationStartDate() != null && today.isBefore(course.getRegistrationStartDate())) {
                throw new IllegalStateException("Registration has not started yet");
            }
            if (course.getRegistrationEndDate() != null && today.isAfter(course.getRegistrationEndDate())) {
                throw new IllegalStateException("Registration period has ended");
            }
            throw new IllegalStateException("Course is not open for registration");
        }

        // Allow re-enrollment if previous attempt was cancelled (expired deadline)
        if (enrollmentRepository.existsByStudentIdAndCourseIdAndStatusNot(studentId, courseId, EnrollmentStatus.CANCELLED)) {
            throw new DuplicateResourceException("Student is already enrolled in this course");
        }

        validateNoScheduleConflict(studentId, course);

        // Seat is locked immediately when the student registers (PENDING/APPROVED both hold a seat) —
        // matches the count shown to students as "enrolledCount" so the button disables in sync.
        long active = enrollmentRepository.countByCourseIdAndStatusIn(
                courseId, List.of(EnrollmentStatus.PENDING, EnrollmentStatus.APPROVED));
        if (active >= course.getSeatLimit()) {
            throw new IllegalStateException("SEAT_FULL");
        }
    }

    /**
     * Course.scheduleDays packs per-day time ranges as "MON:10:00-15:00,WED:15:00-19:00"
     * (scheduleStartTime/scheduleEndTime on Course are always null in practice — the admin UI
     * only ever writes times into scheduleDays). Entries without a time range (legacy "MON" only)
     * are skipped since there's nothing to compare.
     */
    private void validateNoScheduleConflict(Long studentId, Course newCourse) {
        Map<String, LocalTime[]> newSlots = ScheduleDaysParser.parseSlots(newCourse.getScheduleDays());

        if (newSlots.isEmpty()) {
            return;
        }

        List<Enrollment> approvedEnrollments =
                enrollmentRepository.findByStudentIdAndStatus(studentId, EnrollmentStatus.APPROVED);

        for (Enrollment existing : approvedEnrollments) {
            Course existingCourse = existing.getCourse();
            if (existingCourse.getId().equals(newCourse.getId())) {
                continue;
            }

            Map<String, LocalTime[]> existingSlots = ScheduleDaysParser.parseSlots(existingCourse.getScheduleDays());

            for (Map.Entry<String, LocalTime[]> entry : newSlots.entrySet()) {
                LocalTime[] existingRange = existingSlots.get(entry.getKey());
                if (existingRange == null) {
                    continue;
                }

                LocalTime newStart = entry.getValue()[0];
                LocalTime newEnd = entry.getValue()[1];
                LocalTime existingStart = existingRange[0];
                LocalTime existingEnd = existingRange[1];

                if (newStart.isBefore(existingEnd) && existingStart.isBefore(newEnd)) {
                    throw new CourseScheduleConflictException(
                            "ตารางเรียนของคอร์สนี้ชนกับคอร์สที่คุณลงทะเบียนไว้แล้ว: " + existingCourse.getCourseName());
                }
            }
        }
    }
}
