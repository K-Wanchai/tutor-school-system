package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.response.AdminReportResponse;
import com.tutorschool.backend.dto.response.AdminReportResponse.CourseReportItem;
import com.tutorschool.backend.dto.response.AttendanceReportResponse;
import com.tutorschool.backend.dto.response.CourseReportResponse;
import com.tutorschool.backend.dto.response.EnrollmentReportResponse;
import com.tutorschool.backend.dto.response.EnrollmentReportResponse.EnrollmentReportItem;
import com.tutorschool.backend.dto.response.EvaluationReportResponse;
import com.tutorschool.backend.dto.response.ExamResultReportResponse;
import com.tutorschool.backend.dto.response.PaymentReportResponse;
import com.tutorschool.backend.dto.response.RevenueReportResponse;
import com.tutorschool.backend.dto.response.RevenueReportResponse.RevenueReportItem;
import com.tutorschool.backend.dto.response.StudentReportResponse;
import com.tutorschool.backend.dto.response.TutorReportResponse;
import com.tutorschool.backend.entity.AttendanceStatus;
import com.tutorschool.backend.entity.ClassAttendance;
import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.CourseEvaluation;
import com.tutorschool.backend.entity.Enrollment;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.entity.ExamManualScore;
import com.tutorschool.backend.entity.Payment;
import com.tutorschool.backend.entity.PaymentVerificationStatus;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.Tutor;
import com.tutorschool.backend.repository.ClassAttendanceRepository;
import com.tutorschool.backend.repository.CourseEvaluationRepository;
import com.tutorschool.backend.repository.CourseRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.ExamManualScoreRepository;
import com.tutorschool.backend.repository.PaymentRepository;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.repository.TutorRepository;
import com.tutorschool.backend.mapper.CourseMapper;
import com.tutorschool.backend.mapper.StudentMapper;
import com.tutorschool.backend.mapper.TutorMapper;
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
    private final ClassAttendanceRepository classAttendanceRepository;
    private final ExamManualScoreRepository examManualScoreRepository;
    private final StudentMapper studentMapper;
    private final TutorMapper tutorMapper;
    private final CourseMapper courseMapper;

    @Override
    @Transactional(readOnly = true)
    public AdminReportResponse getOverviewReport() {
        List<Course> courses = courseRepository.findAll();
        List<Enrollment> enrollments = enrollmentRepository.findAll();
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

        // รายได้ที่ยืนยันแล้ว = ยอดของใบสมัครที่ชำระเงินเรียบร้อยแล้ว (APPROVED หรือคอร์สสอนจบแล้ว COMPLETED)
        // ต้องนับ COMPLETED ด้วยเพื่อให้ตรงกับหน้าประวัติการชำระเงิน (ดู getEnrollmentHistoryStatus ฝั่ง frontend)
        // ไม่ใช้ตาราง Payment เพราะ flow อนุมัติการชำระเงินจริงไม่เคยเขียนสถานะ VERIFIED ลงตารางนั้น
        BigDecimal totalRevenue = enrollments.stream()
                .filter(e -> ACTIVE_ENROLLMENT_STATUSES.contains(e.getStatus()) && e.getFinalAmount() != null)
                .map(Enrollment::getFinalAmount)
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
                                                   PaymentVerificationStatus status, Long studentId) {
        List<Payment> payments = paymentRepository.searchForReport(
                startOfDay(dateFrom), endOfDay(dateTo), courseId, status, studentId);

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
                                                         EnrollmentStatus status, Long studentId) {
        List<Enrollment> enrollments = enrollmentRepository.searchForReport(
                startOfDay(dateFrom), endOfDay(dateTo), courseId, status, studentId);

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

    @Override
    @Transactional(readOnly = true)
    public StudentReportResponse getStudentReport(LocalDate dateFrom, LocalDate dateTo, Long studentId) {
        List<Student> students = studentRepository.searchForReport(
                startOfDay(dateFrom), endOfDay(dateTo), studentId);

        return StudentReportResponse.builder()
                .totalCount(students.size())
                .items(students.stream().map(studentMapper::toResponse).toList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TutorReportResponse getTutorReport(LocalDate dateFrom, LocalDate dateTo, Long tutorId) {
        List<Tutor> tutors = tutorRepository.searchForReport(
                startOfDay(dateFrom), endOfDay(dateTo), tutorId);

        return TutorReportResponse.builder()
                .totalCount(tutors.size())
                .items(tutors.stream().map(tutorMapper::toResponse).toList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CourseReportResponse getCourseReport(LocalDate dateFrom, LocalDate dateTo, Long courseId,
                                                 com.tutorschool.backend.entity.CourseStatus status) {
        List<Course> courses = courseRepository.searchForReport(
                startOfDay(dateFrom), endOfDay(dateTo), courseId, status);

        return CourseReportResponse.builder()
                .totalCount(courses.size())
                .items(courses.stream()
                        .map(c -> courseMapper.toResponse(
                                c, enrollmentRepository.countByCourseIdAndStatusIn(c.getId(), ACTIVE_ENROLLMENT_STATUSES)))
                        .toList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentReportResponse getPaymentReport(LocalDate dateFrom, LocalDate dateTo, Long courseId,
                                                   EnrollmentStatus status, Long studentId) {
        List<Enrollment> allReviewed = enrollmentRepository.searchForPaymentReport(
                startOfDay(dateFrom), endOfDay(dateTo), courseId, studentId);

        // "ชำระเงินเรียบร้อยแล้ว" ต้องนับทั้ง APPROVED และ COMPLETED (คอร์สสอนจบแล้ว) เป็นกลุ่มเดียวกัน
        // เหมือนกับที่ getEnrollmentHistoryStatus ฝั่ง frontend ทำ ไม่งั้นจำนวน/ยอดจะไม่ตรงกับหน้า
        // ประวัติการชำระเงิน — ตัวกรอง status ที่ผู้ใช้เลือก (APPROVED หรือ REJECTED) จึงต้องแปลผ่าน bucket นี้
        List<Enrollment> enrollments = allReviewed.stream()
                .filter(e -> status == null || paymentHistoryBucket(e.getStatus()) == status)
                .toList();

        List<PaymentReportResponse.PaymentReportItem> items = enrollments.stream()
                .map(e -> PaymentReportResponse.PaymentReportItem.builder()
                        .enrollmentId(e.getId())
                        .enrollmentCode(e.getEnrollmentCode())
                        .enrollmentDate(e.getEnrollmentDate())
                        .studentName(studentFullName(e.getStudent()))
                        .studentCode(e.getStudent() != null ? e.getStudent().getStudentCode() : null)
                        .courseId(e.getCourse() != null ? e.getCourse().getId() : null)
                        .courseName(e.getCourse() != null ? e.getCourse().getCourseName() : null)
                        .courseCode(e.getCourse() != null ? e.getCourse().getCourseCode() : null)
                        .price(e.getFinalAmount())
                        .paymentMethod(e.getPaymentMethod() != null ? e.getPaymentMethod().name() : null)
                        .status(paymentHistoryBucket(e.getStatus()).name())
                        .processedBy(e.getStatus() == EnrollmentStatus.REJECTED ? e.getRejectedBy() : e.getApprovedBy())
                        .processedAt(e.getStatus() == EnrollmentStatus.REJECTED ? e.getUpdatedAt() : e.getApprovedAt())
                        .note(e.getNote())
                        .build())
                .toList();

        // ใช้ Enrollment.finalAmount (ยอดที่บันทึกไว้จริงตอนสมัคร) ไม่ใช่ Course.price ปัจจุบัน — ราคาคอร์ส
        // แก้ไขได้ภายหลัง (ดู CourseServiceImpl#updateCourse) ถ้าใช้ Course.price ยอดจะไม่ตรงกับหน้า
        // ประวัติการชำระเงินซึ่งคำนวณจาก finalAmount ของแต่ละ enrollment เสมอ
        BigDecimal totalAmount = sumAmount(enrollments, Enrollment::getFinalAmount);
        BigDecimal approvedAmount = sumAmount(
                allReviewed.stream().filter(e -> paymentHistoryBucket(e.getStatus()) == EnrollmentStatus.APPROVED).toList(),
                Enrollment::getFinalAmount);
        BigDecimal rejectedAmount = sumAmount(
                allReviewed.stream().filter(e -> paymentHistoryBucket(e.getStatus()) == EnrollmentStatus.REJECTED).toList(),
                Enrollment::getFinalAmount);

        return PaymentReportResponse.builder()
                .totalCount(enrollments.size())
                .totalAmount(totalAmount)
                .approvedAmount(approvedAmount)
                .rejectedAmount(rejectedAmount)
                .items(items)
                .build();
    }

    // จับกลุ่มสถานะแบบเดียวกับ getEnrollmentHistoryStatus ฝั่ง frontend — APPROVED/COMPLETED ถือเป็น
    // "ชำระเงินเรียบร้อยแล้ว" กลุ่มเดียวกัน (แทนด้วย EnrollmentStatus.APPROVED), ที่เหลือคือ REJECTED
    private EnrollmentStatus paymentHistoryBucket(EnrollmentStatus status) {
        return status == EnrollmentStatus.COMPLETED ? EnrollmentStatus.APPROVED : status;
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceReportResponse getAttendanceReport(LocalDate dateFrom, LocalDate dateTo, Long courseId, Long studentId) {
        List<ClassAttendance> records = classAttendanceRepository.searchForReport(dateFrom, dateTo, courseId, studentId);

        record StudentCourseKey(Long studentId, Long courseId) {}
        Map<StudentCourseKey, List<ClassAttendance>> grouped = records.stream()
                .collect(Collectors.groupingBy(a -> new StudentCourseKey(
                        a.getStudent() != null ? a.getStudent().getId() : null,
                        a.getCourse() != null ? a.getCourse().getId() : null)));

        List<AttendanceReportResponse.AttendanceReportItem> items = grouped.values().stream()
                .map(list -> {
                    ClassAttendance sample = list.get(0);
                    long present = list.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
                    long late = list.stream().filter(a -> a.getStatus() == AttendanceStatus.LATE).count();
                    long absent = list.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
                    long leave = list.stream().filter(a -> a.getStatus() == AttendanceStatus.LEAVE).count();
                    long total = list.size();
                    // อัตราเข้าเรียน = (เข้าเรียน + มาสาย) / จำนวนครั้งทั้งหมด — มาสายยังถือว่าเข้าเรียน
                    double rate = total == 0 ? 0.0 : Math.round((present + late) * 1000.0 / total) / 10.0;

                    return AttendanceReportResponse.AttendanceReportItem.builder()
                            .studentId(sample.getStudent() != null ? sample.getStudent().getId() : null)
                            .studentName(studentFullName(sample.getStudent()))
                            .studentCode(sample.getStudent() != null ? sample.getStudent().getStudentCode() : null)
                            .courseId(sample.getCourse() != null ? sample.getCourse().getId() : null)
                            .courseName(sample.getCourse() != null ? sample.getCourse().getCourseName() : null)
                            .courseCode(sample.getCourse() != null ? sample.getCourse().getCourseCode() : null)
                            .totalSessions(total)
                            .presentCount(present)
                            .lateCount(late)
                            .absentCount(absent)
                            .leaveCount(leave)
                            .attendanceRate(rate)
                            .build();
                })
                .sorted(Comparator.comparing(
                        AttendanceReportResponse.AttendanceReportItem::getStudentName,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        return AttendanceReportResponse.builder()
                .totalCount(items.size())
                .items(items)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ExamResultReportResponse getExamResultReport(LocalDate dateFrom, LocalDate dateTo, Long courseId, Long studentId) {
        List<ExamManualScore> scores = examManualScoreRepository.searchForReport(
                startOfDay(dateFrom), endOfDay(dateTo), courseId, studentId);

        // คอร์สไหน "สอบจบก่อน" ดูจากเวลาสิ้นสุดของข้อสอบครั้งล่าสุดในคอร์สนั้น (MAX endTime, fallback
        // เป็น startTime ถ้าไม่มี endTime) — ต้องดูทุกข้อสอบของคอร์สนั้นถึงจะรู้ว่า "จบ" เมื่อไหร่
        Map<Long, LocalDateTime> courseFinishTime = new java.util.HashMap<>();
        for (ExamManualScore s : scores) {
            if (s.getExam() == null || s.getExam().getCourse() == null) continue;
            Long cId = s.getExam().getCourse().getId();
            LocalDateTime examTime = s.getExam().getEndTime() != null ? s.getExam().getEndTime() : s.getExam().getStartTime();
            if (examTime == null) continue;
            courseFinishTime.merge(cId, examTime, (a, b) -> a.isAfter(b) ? a : b);
        }

        List<ExamResultReportResponse.ExamResultReportItem> items = scores.stream()
                .map(s -> {
                    Double totalScore = s.getExam() != null ? s.getExam().getTotalScore() : null;
                    Double percentage = (totalScore != null && totalScore > 0 && s.getScore() != null)
                            ? Math.round(s.getScore() / totalScore * 1000.0) / 10.0
                            : null;
                    return ExamResultReportResponse.ExamResultReportItem.builder()
                            .examId(s.getExam() != null ? s.getExam().getId() : null)
                            .examCode(s.getExam() != null ? s.getExam().getExamCode() : null)
                            .examTitle(s.getExam() != null ? s.getExam().getTitle() : null)
                            .courseId(s.getExam() != null && s.getExam().getCourse() != null ? s.getExam().getCourse().getId() : null)
                            .courseName(s.getExam() != null && s.getExam().getCourse() != null ? s.getExam().getCourse().getCourseName() : null)
                            .courseCode(s.getExam() != null && s.getExam().getCourse() != null ? s.getExam().getCourse().getCourseCode() : null)
                            .studentId(s.getStudent() != null ? s.getStudent().getId() : null)
                            .studentName(studentFullName(s.getStudent()))
                            .studentCode(s.getStudent() != null ? s.getStudent().getStudentCode() : null)
                            .score(s.getScore())
                            .totalScore(totalScore)
                            .percentage(percentage)
                            .gradedBy(s.getGradedBy())
                            .examStartTime(s.getExam() != null ? s.getExam().getStartTime() : null)
                            .note(s.getNote())
                            .build();
                })
                // เรียง: คอร์สที่สอบจบก่อน -> รหัสนักเรียนภายในคอร์สนั้น -> วันที่สอบ (ถ้านักเรียนคนเดียวกัน
                // มีหลายครั้งในคอร์สเดียวกัน)
                .sorted(Comparator
                        .comparing((ExamResultReportResponse.ExamResultReportItem i) -> courseFinishTime.get(i.getCourseId()),
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(ExamResultReportResponse.ExamResultReportItem::getStudentCode,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(ExamResultReportResponse.ExamResultReportItem::getExamStartTime,
                                Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        double averagePercentage = items.stream()
                .map(ExamResultReportResponse.ExamResultReportItem::getPercentage)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        return ExamResultReportResponse.builder()
                .totalCount(items.size())
                .averagePercentage(Math.round(averagePercentage * 10.0) / 10.0)
                .items(items)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public EvaluationReportResponse getEvaluationReport(LocalDate dateFrom, LocalDate dateTo, Long courseId) {
        List<CourseEvaluation> evaluations = courseEvaluationRepository.searchForReport(
                startOfDay(dateFrom), endOfDay(dateTo), courseId);

        Map<Long, List<CourseEvaluation>> byCourse = evaluations.stream()
                .filter(e -> e.getCourse() != null)
                .collect(Collectors.groupingBy(e -> e.getCourse().getId()));

        List<EvaluationReportResponse.EvaluationReportItem> items = byCourse.values().stream()
                .map(list -> {
                    CourseEvaluation sample = list.get(0);
                    double avg = list.stream()
                            .mapToInt(CourseEvaluation::getRating)
                            .average()
                            .orElse(0.0);
                    return EvaluationReportResponse.EvaluationReportItem.builder()
                            .courseId(sample.getCourse().getId())
                            .courseName(sample.getCourse().getCourseName())
                            .courseCode(sample.getCourse().getCourseCode())
                            .tutorName(tutorFullName(sample.getCourse().getTutor()))
                            .evaluationCount(list.size())
                            .averageRating(Math.round(avg * 10.0) / 10.0)
                            .build();
                })
                .sorted(Comparator.comparing(
                        EvaluationReportResponse.EvaluationReportItem::getCourseName,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        double overallAverage = evaluations.stream()
                .mapToInt(CourseEvaluation::getRating)
                .average()
                .orElse(0.0);

        return EvaluationReportResponse.builder()
                .totalCount(items.size())
                .overallAverageRating(Math.round(overallAverage * 10.0) / 10.0)
                .items(items)
                .build();
    }
}
