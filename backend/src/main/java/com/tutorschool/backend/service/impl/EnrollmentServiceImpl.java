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
import com.tutorschool.backend.repository.CourseScheduleDayRepository;
import com.tutorschool.backend.repository.CourseScheduleRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.InstitutionProfileRepository;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.service.EnrollmentService;
import com.tutorschool.backend.service.NotificationService;
import com.tutorschool.backend.util.ScheduleDaysParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnrollmentServiceImpl implements EnrollmentService {

    private static final int DEFAULT_PAYMENT_DEADLINE_MINUTES = 15;

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final CourseScheduleRepository courseScheduleRepository;
    private final CourseScheduleDayRepository courseScheduleDayRepository;
    private final EnrollmentMapper enrollmentMapper;
    private final InstitutionProfileRepository institutionProfileRepository;
    private final NotificationService notificationService;

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

        BigDecimal amount = course.getPrice();
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = amount.subtract(discountAmount);

        // Re-enrolling after a previous cancelled or rejected attempt always creates a brand new
        // row (own id/enrollmentCode) — student_id+course_id is not unique, so the old row stays
        // untouched as its own history entry instead of being overwritten/reused.
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
        if (enrollmentRepository.existsByStudentIdAndCourseIdAndStatusNotIn(
                studentId, request.getCourseId(), List.of(EnrollmentStatus.CANCELLED, EnrollmentStatus.REJECTED))) {
            throw new DuplicateResourceException("Student is already enrolled in this course");
        }

        validateNoScheduleConflict(studentId, course);

        // Seat check — only count those who have confirmed payment
        long confirmed = enrollmentRepository.countConfirmedPaymentsByCourseId(course.getId());
        if (confirmed >= course.getSeatLimit()) {
            throw new IllegalStateException("SEAT_FULL");
        }

        BigDecimal amount = course.getPrice();

        // Re-enrolling after a previous cancelled or rejected attempt always creates a brand new
        // row — see the matching comment in enrollStudent() for why.
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

        // Re-check schedule conflicts here, not just at signup — the student's set of APPROVED
        // courses can change between signup and approval (e.g. another enrollment got approved
        // while this one was sent back for slip revision), so a stale eligibility check at
        // signup time is not enough to guarantee no overlap at the moment this one becomes APPROVED.
        validateNoScheduleConflict(enrollment.getStudent().getId(), enrollment.getCourse());

        enrollment.setStatus(EnrollmentStatus.APPROVED);
        enrollment.setApprovedBy(request.getApprovedBy());
        enrollment.setApprovedAt(LocalDateTime.now());
        if (request.getNote() != null) {
            enrollment.setNote(request.getNote());
        }

        return enrollmentMapper.toResponse(enrollmentRepository.save(enrollment));
    }

    // ตีกลับให้นักเรียนแก้ไขสลิป — ไม่ใช่การปฏิเสธถาวร: status ยังคง PENDING ไว้ (ไม่แตะ APPROVED/REJECTED)
    // เปลี่ยนแค่ paymentStatus เป็น FAILED ซึ่งหน้าชำระเงินของนักเรียนรองรับการอัปโหลดสลิปใหม่อยู่แล้ว
    // และไม่ถูกนับที่นั่ง (countConfirmedPaymentsByCourseId นับเฉพาะ PENDING_VERIFICATION/PAID) จึงคืนที่นั่งให้อัตโนมัติ
    @Override
    @Transactional
    public EnrollmentResponse returnForSlipRevision(Long id, ReturnSlipRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));

        enrollment.setPaymentStatus(PaymentStatus.FAILED);
        enrollment.setNote(request.getNote());

        Enrollment saved = enrollmentRepository.save(enrollment);
        sendSlipReturnedNotification(saved);
        return enrollmentMapper.toResponse(saved);
    }

    // ปฏิเสธการสมัคร (ถาวร) — ต่างจาก returnForSlipRevision ตรงที่ status เปลี่ยนเป็น REJECTED เลย ไม่ใช่ PENDING
    // ที่นั่งจะถูกคืนกลับเข้าพูลอัตโนมัติ เพราะทั้ง countByCourseIdAndStatusIn (นับเฉพาะ PENDING/APPROVED)
    // และ countConfirmedPaymentsByCourseId (exclude CANCELLED/REJECTED) ไม่นับ enrollment ที่ REJECTED แล้ว
    @Override
    @Transactional
    public EnrollmentResponse rejectEnrollment(Long id, RejectEnrollmentRequest request) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", id));

        enrollment.setStatus(EnrollmentStatus.REJECTED);
        enrollment.setNote(request.getNote());

        Enrollment saved = enrollmentRepository.save(enrollment);
        sendRejectionNotification(saved);
        return enrollmentMapper.toResponse(saved);
    }

    private void sendRejectionNotification(Enrollment enrollment) {
        try {
            String studentEmail = enrollment.getStudent().getUser().getEmail();
            String studentName = enrollment.getStudent().getFirstName() + " " + enrollment.getStudent().getLastName();
            CreateNotificationRequest notif = new CreateNotificationRequest();
            notif.setUserId(enrollment.getStudent().getUser().getId());
            notif.setRecipientEmail(studentEmail);
            notif.setSubject("ใบสมัครไม่ได้รับการอนุมัติ: " + enrollment.getCourse().getCourseName());
            notif.setMessage(
                "เรียน " + studentName + "\n\n" +
                "ใบสมัครเรียนคอร์ส \"" + enrollment.getCourse().getCourseName() +
                "\" (รหัสการสมัคร " + enrollment.getEnrollmentCode() + ") ไม่ได้รับการอนุมัติ\n\n" +
                "เหตุผล: " + enrollment.getNote() + "\n\n" +
                "ที่นั่งของคอร์สนี้ถูกคืนกลับเข้าระบบแล้ว หากต้องการสมัครใหม่สามารถทำได้ที่หน้าคอร์สเรียน"
            );
            notif.setNotificationType(NotificationType.PAYMENT_REJECTED);
            notif.setReferenceType(ReferenceType.ENROLLMENT);
            notif.setReferenceId(enrollment.getId());
            notificationService.sendNotification(notif);
        } catch (Exception e) {
            log.warn("Failed to send rejection notification for enrollment {}: {}", enrollment.getId(), e.getMessage());
        }
    }

    private void sendSlipReturnedNotification(Enrollment enrollment) {
        try {
            String studentEmail = enrollment.getStudent().getUser().getEmail();
            String studentName = enrollment.getStudent().getFirstName() + " " + enrollment.getStudent().getLastName();
            CreateNotificationRequest notif = new CreateNotificationRequest();
            notif.setUserId(enrollment.getStudent().getUser().getId());
            notif.setRecipientEmail(studentEmail);
            notif.setSubject("กรุณาแก้ไขหลักฐานการชำระเงิน: " + enrollment.getCourse().getCourseName());
            notif.setMessage(
                "เรียน " + studentName + "\n\n" +
                "หลักฐานการชำระเงิน (สลิป) ที่แนบมาสำหรับคอร์ส \"" + enrollment.getCourse().getCourseName() +
                "\" (รหัสการสมัคร " + enrollment.getEnrollmentCode() + ") ไม่ถูกต้อง กรุณาอัปโหลดสลิปใหม่อีกครั้ง\n\n" +
                "เหตุผล: " + enrollment.getNote() + "\n\n" +
                "กรุณาเข้าสู่ระบบไปที่หน้า \"การชำระเงิน\" เพื่ออัปโหลดหลักฐานการชำระเงินใหม่"
            );
            notif.setNotificationType(NotificationType.PAYMENT_REJECTED);
            notif.setReferenceType(ReferenceType.ENROLLMENT);
            notif.setReferenceId(enrollment.getId());
            notificationService.sendNotification(notif);
        } catch (Exception e) {
            log.warn("Failed to send slip-returned notification for enrollment {}: {}", enrollment.getId(), e.getMessage());
        }
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

        // Allow re-enrollment if previous attempt was cancelled (expired deadline) or rejected by admin
        if (enrollmentRepository.existsByStudentIdAndCourseIdAndStatusNotIn(
                studentId, courseId, List.of(EnrollmentStatus.CANCELLED, EnrollmentStatus.REJECTED))) {
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
     * ตารางสอนรายสัปดาห์ของแต่ละคอร์สอ่านจากตาราง course_schedule_days (1 แถวต่อ 1 วันสอน)
     * ไม่ parse string แล้ว
     *
     * Same weekday+time only actually conflicts if the two courses' calendar date ranges overlap —
     * e.g. an approved course ending 2026-08-20 does not block a new course starting 2026-08-21
     * even if both fall on, say, every Monday 17:00-19:00. When either course's date range can't be
     * determined, we fall back to the conservative weekday/time-only check (treat as a possible conflict).
     *
     * Any PENDING enrollment blocks too, same as APPROVED — regardless of paymentStatus (UNPAID still
     * within the payment deadline, PENDING_VERIFICATION awaiting the admin's first review, or FAILED /
     * "NEEDS_REVISION" after being returned for slip revision). It's still an open application the
     * student intends to keep — nothing has rejected or cancelled it — so leaving any of those substates
     * unblocked let a student register and pay for a second, time-conflicting course before the first
     * one had even been looked at once, and once one of the two later got approved the other became
     * unapprovable (schedule conflict) despite already being paid for, with no in-system refund path.
     * Blocking at signup/payment time — not just at approval — is what actually prevents that. It keeps
     * blocking until the admin rejects it or the student cancels it.
     */
    private void validateNoScheduleConflict(Long studentId, Course newCourse) {
        List<CourseScheduleDay> newSlots = courseScheduleDayRepository.findByCourseId(newCourse.getId());

        if (newSlots.isEmpty()) {
            return;
        }

        LocalDate newEnd = resolveCourseEndDate(newCourse);

        List<Enrollment> blockingEnrollments = new java.util.ArrayList<>(
                enrollmentRepository.findByStudentIdAndStatus(studentId, EnrollmentStatus.APPROVED));
        blockingEnrollments.addAll(enrollmentRepository.findByStudentIdAndStatus(studentId, EnrollmentStatus.PENDING));

        for (Enrollment existing : blockingEnrollments) {
            Course existingCourse = existing.getCourse();
            if (existingCourse.getId().equals(newCourse.getId())) {
                continue;
            }

            LocalDate existingEnd = resolveCourseEndDate(existingCourse);
            if (newCourse.getCourseStartDate() != null && newEnd != null
                    && existingCourse.getCourseStartDate() != null && existingEnd != null) {
                boolean dateRangesOverlap = !newEnd.isBefore(existingCourse.getCourseStartDate())
                        && !existingEnd.isBefore(newCourse.getCourseStartDate());
                if (!dateRangesOverlap) {
                    continue;
                }
            }

            Map<String, CourseScheduleDay> existingSlotsByDay = courseScheduleDayRepository
                    .findByCourseId(existingCourse.getId()).stream()
                    .collect(java.util.stream.Collectors.toMap(CourseScheduleDay::getDayOfWeek, s -> s));

            for (CourseScheduleDay newSlot : newSlots) {
                CourseScheduleDay existingSlot = existingSlotsByDay.get(newSlot.getDayOfWeek());
                if (existingSlot == null) {
                    continue;
                }

                if (newSlot.getStartTime().isBefore(existingSlot.getEndTime())
                        && existingSlot.getStartTime().isBefore(newSlot.getEndTime())) {
                    String message = existing.getStatus() == EnrollmentStatus.APPROVED
                            ? "ตารางเรียนของคอร์สนี้ชนกับคอร์สที่คุณลงทะเบียนไว้แล้ว: " + existingCourse.getCourseName()
                            : "ตารางเรียนของคอร์สนี้ชนกับคอร์ส \"" + existingCourse.getCourseName()
                                    + "\" ที่คุณมีใบสมัครค้างอยู่ (ยังไม่ได้รับการอนุมัติหรือปฏิเสธ) "
                                    + "กรุณารอผลการตรวจสอบคอร์สดังกล่าวก่อนจึงจะสมัครคอร์สนี้ได้";
                    throw new CourseScheduleConflictException(message);
                }
            }
        }
    }

    /**
     * The date of the course's last session. Prefers the actual generated CourseSchedule rows
     * (ground truth, e.g. from generateSchedulesFromCoursePattern) when they exist; otherwise
     * estimates it by walking the weekly pattern (course_schedule_days) forward from
     * courseStartDate, accumulating each matched day's session length until totalHours is
     * covered. Returns null when there isn't enough data to determine an end date.
     */
    private LocalDate resolveCourseEndDate(Course course) {
        List<CourseSchedule> schedules =
                courseScheduleRepository.findByCourseIdOrderByScheduleDateAscStartTimeAsc(course.getId());
        if (!schedules.isEmpty()) {
            return schedules.get(schedules.size() - 1).getScheduleDate();
        }
        return estimateCourseEndDateFromPattern(course);
    }

    private LocalDate estimateCourseEndDateFromPattern(Course course) {
        Map<String, CourseScheduleDay> daySlots = courseScheduleDayRepository.findByCourseId(course.getId()).stream()
                .collect(java.util.stream.Collectors.toMap(CourseScheduleDay::getDayOfWeek, s -> s));
        if (daySlots.isEmpty() || course.getTotalHours() == null || course.getCourseStartDate() == null) {
            return null;
        }

        double remainingHours = course.getTotalHours();
        LocalDate cursor = course.getCourseStartDate();
        LocalDate lastMatchedDay = null;
        int scanned = 0;
        int safetyLimitDays = 3650; // 10 years — guards against an unmatched pattern looping forever

        while (remainingHours > 0 && scanned < safetyLimitDays) {
            CourseScheduleDay slot = daySlots.get(ScheduleDaysParser.toDayCode(cursor.getDayOfWeek()));
            if (slot != null) {
                remainingHours -= Duration.between(slot.getStartTime(), slot.getEndTime()).toMinutes() / 60.0;
                lastMatchedDay = cursor;
            }
            cursor = cursor.plusDays(1);
            scanned++;
        }

        return lastMatchedDay;
    }
}
