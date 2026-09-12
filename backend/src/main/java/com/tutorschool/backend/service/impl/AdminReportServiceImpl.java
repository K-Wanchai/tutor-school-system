package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.response.AdminReportResponse;
import com.tutorschool.backend.dto.response.AdminReportResponse.CourseReportItem;
import com.tutorschool.backend.dto.response.EnrollmentReportResponse;
import com.tutorschool.backend.dto.response.EnrollmentReportResponse.EnrollmentReportItem;
import com.tutorschool.backend.dto.response.RevenueReportResponse;
import com.tutorschool.backend.dto.response.RevenueReportResponse.RevenueReportItem;
import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.CourseEvaluation;
import com.tutorschool.backend.entity.Enrollment;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.entity.Payment;
import com.tutorschool.backend.entity.PaymentVerificationStatus;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.Tutor;
import com.tutorschool.backend.repository.CourseEvaluationRepository;
import com.tutorschool.backend.repository.CourseRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.PaymentRepository;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.repository.TutorRepository;
import com.tutorschool.backend.service.AdminReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminReportServiceImpl implements AdminReportService {

    private static final List<EnrollmentStatus> ACTIVE_ENROLLMENT_STATUSES =
            List.of(EnrollmentStatus.APPROVED, EnrollmentStatus.COMPLETED);

    private final StudentRepository studentRepository;
    private final TutorRepository tutorRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PaymentRepository paymentRepository;
    private final CourseEvaluationRepository courseEvaluationRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminReportResponse getOverviewReport() {
        List<Course> courses = courseRepository.findAll();
        List<Enrollment> enrollments = enrollmentRepository.findAll();
        List<Payment> payments = paymentRepository.findAll();
        List<CourseEvaluation> evaluations = courseEvaluationRepository.findAll();

        Map<Long, Long> activeEnrollmentByCourse = enrollments.stream()
                .filter(e -> e.getCourse() != null && ACTIVE_ENROLLMENT_STATUSES.contains(e.getStatus()))
                .collect(Collectors.groupingBy(e -> e.getCourse().getId(), Collectors.counting()));

        Map<Long, Double> avgRatingByCourse = evaluations.stream()
                .filter(e -> e.getCourse() != null && e.getRating() != null)
                .collect(Collectors.groupingBy(
                        e -> e.getCourse().getId(),
                        Collectors.averagingInt(CourseEvaluation::getRating)));

        List<CourseReportItem> topCourses = courses.stream()
                .map(course -> {
                    long enrolled = activeEnrollmentByCourse.getOrDefault(course.getId(), 0L);
                    Double avg = avgRatingByCourse.get(course.getId());
                    return CourseReportItem.builder()
                            .courseId(course.getId())
                            .courseName(course.getCourseName())
                            .courseCode(course.getCourseCode())
                            .tutorName(course.getTutor() != null
                                    ? (course.getTutor().getFirstName() + " " + course.getTutor().getLastName()).trim()
                                    : "")
                            .status(course.getStatus() != null ? course.getStatus().name() : "")
                            .enrolledCount(enrolled)
                            .averageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : null)
                            .build();
                })
                .sorted(Comparator.comparingLong(CourseReportItem::getEnrolledCount).reversed())
                .limit(5)
                .toList();

        BigDecimal totalRevenue = payments.stream()
                .filter(p -> p.getPaymentStatus() == PaymentVerificationStatus.VERIFIED && p.getAmount() != null)
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double averageRating = evaluations.stream()
                .filter(e -> e.getRating() != null)
                .mapToInt(CourseEvaluation::getRating)
                .average()
                .orElse(0.0);

        return AdminReportResponse.builder()
                .totalStudents(studentRepository.count())
                .totalTutors(tutorRepository.count())
                .totalCourses(courses.size())
                .totalEnrollments(enrollments.size())
                .coursesByStatus(countBy(courses, c -> c.getStatus() != null ? c.getStatus().name() : "UNKNOWN"))
                .enrollmentsByStatus(countBy(enrollments, e -> e.getStatus() != null ? e.getStatus().name() : "UNKNOWN"))
                .totalRevenue(totalRevenue)
                .pendingPaymentVerifications(
                        paymentRepository.countByPaymentStatus(PaymentVerificationStatus.PENDING))
                .totalEvaluations(evaluations.size())
                .averageRating(Math.round(averageRating * 10.0) / 10.0)
                .topCourses(topCourses)
                .build();
    }

    private <T> Map<String, Long> countBy(List<T> items, Function<T, String> keyFn) {
        return items.stream().collect(Collectors.groupingBy(
                keyFn, LinkedHashMap::new, Collectors.counting()));
    }

    // ช่วงวันที่จาก UI เป็น LocalDate (แค่วัน) — แปลงเป็นขอบเขต LocalDateTime ครอบคลุมทั้งวัน
    // ก่อนส่งเข้า query ที่เก็บเป็น LocalDateTime; ไม่ส่งมาก็ปล่อยเป็น null (ไม่กรอง)
    private LocalDateTime startOfDay(LocalDate date) {
        return date != null ? date.atStartOfDay() : null;
    }

    private LocalDateTime endOfDay(LocalDate date) {
        return date != null ? LocalDateTime.of(date, LocalTime.MAX) : null;
    }

    private String tutorFullName(Tutor tutor) {
        if (tutor == null) return "";
        return ((tutor.getFirstName() != null ? tutor.getFirstName() : "") + " "
                + (tutor.getLastName() != null ? tutor.getLastName() : "")).trim();
    }

    private String studentFullName(Student student) {
        if (student == null) return "";
        if (student.getFullName() != null && !student.getFullName().isBlank()) return student.getFullName();
        return ((student.getFirstName() != null ? student.getFirstName() : "") + " "
                + (student.getLastName() != null ? student.getLastName() : "")).trim();
    }

    @Override
    @Transactional(readOnly = true)
    public RevenueReportResponse getRevenueReport(LocalDate dateFrom, LocalDate dateTo, Long courseId,
                                                   PaymentVerificationStatus status) {
        List<Payment> payments = paymentRepository.searchForReport(
                startOfDay(dateFrom), endOfDay(dateTo), courseId, status);

        List<RevenueReportItem> items = payments.stream()
                .map(p -> {
                    Course course = p.getEnrollment() != null ? p.getEnrollment().getCourse() : null;
                    return RevenueReportItem.builder()
                            .paymentId(p.getId())
                            .paymentCode(p.getPaymentCode())
                            .paymentDate(p.getCreatedAt())
                            .studentName(studentFullName(p.getStudent()))
                            .studentCode(p.getStudent() != null ? p.getStudent().getStudentCode() : null)
                            .courseId(course != null ? course.getId() : null)
                            .courseName(course != null ? course.getCourseName() : null)
                            .courseCode(course != null ? course.getCourseCode() : null)
                            .amount(p.getAmount())
                            .paymentMethod(p.getPaymentMethod() != null ? p.getPaymentMethod().name() : null)
                            .paymentStatus(p.getPaymentStatus() != null ? p.getPaymentStatus().name() : null)
                            .build();
                })
                .toList();

        BigDecimal totalAmount = sumAmount(payments, Payment::getAmount);
        BigDecimal verifiedAmount = sumAmount(
                payments.stream().filter(p -> p.getPaymentStatus() == PaymentVerificationStatus.VERIFIED).toList(),
                Payment::getAmount);
        BigDecimal pendingAmount = sumAmount(
                payments.stream().filter(p -> p.getPaymentStatus() == PaymentVerificationStatus.PENDING).toList(),
                Payment::getAmount);

        return RevenueReportResponse.builder()
                .totalCount(payments.size())
                .totalAmount(totalAmount)
                .verifiedAmount(verifiedAmount)
                .pendingAmount(pendingAmount)
                .items(items)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public EnrollmentReportResponse getEnrollmentReport(LocalDate dateFrom, LocalDate dateTo, Long courseId,
                                                         EnrollmentStatus status) {
        List<Enrollment> enrollments = enrollmentRepository.searchForReport(
                startOfDay(dateFrom), endOfDay(dateTo), courseId, status);

        List<EnrollmentReportItem> items = enrollments.stream()
                .map(e -> EnrollmentReportItem.builder()
                        .enrollmentId(e.getId())
                        .enrollmentCode(e.getEnrollmentCode())
                        .enrollmentDate(e.getEnrollmentDate())
                        .studentName(studentFullName(e.getStudent()))
                        .studentCode(e.getStudent() != null ? e.getStudent().getStudentCode() : null)
                        .courseId(e.getCourse() != null ? e.getCourse().getId() : null)
                        .courseName(e.getCourse() != null ? e.getCourse().getCourseName() : null)
                        .courseCode(e.getCourse() != null ? e.getCourse().getCourseCode() : null)
                        .tutorName(e.getCourse() != null ? tutorFullName(e.getCourse().getTutor()) : null)
                        .status(e.getStatus() != null ? e.getStatus().name() : null)
                        .paymentStatus(e.getPaymentStatus() != null ? e.getPaymentStatus().name() : null)
                        .finalAmount(e.getFinalAmount())
                        .build())
                .toList();

        BigDecimal totalAmount = enrollments.stream()
                .map(Enrollment::getFinalAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return EnrollmentReportResponse.builder()
                .totalCount(enrollments.size())
                .totalAmount(totalAmount)
                .byStatus(countBy(enrollments, e -> e.getStatus() != null ? e.getStatus().name() : "UNKNOWN"))
                .items(items)
                .build();
    }

    private <T> BigDecimal sumAmount(List<T> items, Function<T, BigDecimal> amountFn) {
        return items.stream()
                .map(amountFn)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
