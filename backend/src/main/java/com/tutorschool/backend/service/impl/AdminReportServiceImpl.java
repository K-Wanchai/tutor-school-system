package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.response.AdminReportResponse;
import com.tutorschool.backend.dto.response.AdminReportResponse.CourseReportItem;
import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.CourseEvaluation;
import com.tutorschool.backend.entity.Enrollment;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.entity.Payment;
import com.tutorschool.backend.entity.PaymentVerificationStatus;
import com.tutorschool.backend.repository.AttendanceRecordRepository;
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
    private final AttendanceRecordRepository attendanceRecordRepository;

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
                .attendanceByStatus(countBy(attendanceRecordRepository.findAll(),
                        a -> a.getStatus() != null ? a.getStatus().name() : "UNKNOWN"))
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
}
