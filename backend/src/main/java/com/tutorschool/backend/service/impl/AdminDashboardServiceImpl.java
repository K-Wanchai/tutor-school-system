package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.response.AdminDashboardResponse;
import com.tutorschool.backend.dto.response.AdminDashboardResponse.RecentEnrollmentItem;
import com.tutorschool.backend.dto.response.AdminDashboardResponse.RecentPaymentItem;
import com.tutorschool.backend.entity.Enrollment;
import com.tutorschool.backend.entity.Payment;
import com.tutorschool.backend.entity.PaymentVerificationStatus;
import com.tutorschool.backend.repository.CourseRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.PaymentRepository;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.repository.TutorRepository;
import com.tutorschool.backend.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final StudentRepository studentRepository;
    private final TutorRepository tutorRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PaymentRepository paymentRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboardStats() {
        List<RecentEnrollmentItem> recentEnrollments = enrollmentRepository
                .findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toEnrollmentItem)
                .collect(Collectors.toList());

        List<RecentPaymentItem> recentPayments = paymentRepository
                .findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toPaymentItem)
                .collect(Collectors.toList());

        return AdminDashboardResponse.builder()
                .totalStudents(studentRepository.count())
                .totalTutors(tutorRepository.count())
                .totalCourses(courseRepository.count())
                .totalEnrollments(enrollmentRepository.count())
                .pendingPayments(paymentRepository.countByPaymentStatus(PaymentVerificationStatus.PENDING))
                .recentEnrollments(recentEnrollments)
                .recentPayments(recentPayments)
                .build();
    }

    private RecentEnrollmentItem toEnrollmentItem(Enrollment e) {
        String tutorName = "";
        if (e.getCourse() != null && e.getCourse().getTutor() != null) {
            tutorName = e.getCourse().getTutor().getFirstName() + " " + e.getCourse().getTutor().getLastName();
        }
        return RecentEnrollmentItem.builder()
                .id(e.getId())
                .enrollmentCode(e.getEnrollmentCode())
                .studentName(e.getStudent() != null ? e.getStudent().getFullName() : "")
                .courseName(e.getCourse() != null ? e.getCourse().getCourseName() : "")
                .tutorName(tutorName.trim())
                .enrollmentDate(e.getEnrollmentDate())
                .status(e.getStatus() != null ? e.getStatus().name() : "")
                .build();
    }

    private RecentPaymentItem toPaymentItem(Payment p) {
        String courseName = "";
        if (p.getEnrollment() != null && p.getEnrollment().getCourse() != null) {
            courseName = p.getEnrollment().getCourse().getCourseName();
        }
        return RecentPaymentItem.builder()
                .id(p.getId())
                .paymentCode(p.getPaymentCode())
                .studentName(p.getStudent() != null ? p.getStudent().getFullName() : "")
                .courseName(courseName)
                .amount(p.getAmount())
                .paymentDate(p.getPaymentDate())
                .paymentStatus(p.getPaymentStatus() != null ? p.getPaymentStatus().name() : "")
                .build();
    }
}
