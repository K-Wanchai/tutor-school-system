package com.tutorschool.backend.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tutorschool.backend.dto.request.CreateCourseEvaluationRequest;
import com.tutorschool.backend.dto.request.CriteriaScoreRequest;
import com.tutorschool.backend.dto.request.UpdateCourseEvaluationRequest;
import com.tutorschool.backend.dto.request.UpdateEvaluationStatusRequest;
import com.tutorschool.backend.dto.response.CourseEvaluationResponse;
import com.tutorschool.backend.dto.response.CourseEvaluationSummaryResponse;
import com.tutorschool.backend.dto.response.CriteriaAverageResponse;
import com.tutorschool.backend.dto.response.PendingEvaluationResponse;
import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.CourseEvaluation;
import com.tutorschool.backend.entity.CourseStatus;
import com.tutorschool.backend.entity.Enrollment;
import com.tutorschool.backend.entity.EnrollmentStatus;
import com.tutorschool.backend.entity.EvaluationCriteria;
import com.tutorschool.backend.entity.EvaluationCriteriaScore;
import com.tutorschool.backend.entity.EvaluationStatus;
import com.tutorschool.backend.entity.Role;
import com.tutorschool.backend.entity.Student;
import com.tutorschool.backend.entity.Tutor;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.exception.CourseEvaluationNotFoundException;
import com.tutorschool.backend.exception.EnrollmentNotCompletedException;
import com.tutorschool.backend.exception.EvaluationAlreadyExistsException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.exception.UnauthorizedEvaluationAccessException;
import com.tutorschool.backend.mapper.CourseEvaluationMapper;
import com.tutorschool.backend.repository.CourseEvaluationRepository;
import com.tutorschool.backend.repository.CourseRepository;
import com.tutorschool.backend.repository.EnrollmentRepository;
import com.tutorschool.backend.repository.EvaluationCriteriaRepository;
import com.tutorschool.backend.repository.EvaluationCriteriaScoreRepository;
import com.tutorschool.backend.repository.StudentRepository;
import com.tutorschool.backend.repository.TutorRepository;
import com.tutorschool.backend.repository.UserRepository;
import com.tutorschool.backend.service.CourseEvaluationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CourseEvaluationServiceImpl implements CourseEvaluationService {

    private static final long EDIT_WINDOW_HOURS = 24;

    private final CourseEvaluationRepository evaluationRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final TutorRepository TutorRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseEvaluationMapper evaluationMapper;
    private final EvaluationCriteriaRepository evaluationCriteriaRepository;
    private final EvaluationCriteriaScoreRepository evaluationCriteriaScoreRepository;

    @Override
    @Transactional
    public CourseEvaluationResponse createEvaluation(CreateCourseEvaluationRequest request, String username) {
        // 1. ดึง student จาก username ที่ login
        Student student = findStudentByUsername(username);

        // 2. ดึง enrollment และตรวจสอบว่าเป็นของ student คนนี้
        Enrollment enrollment = enrollmentRepository.findById(request.getEnrollmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", request.getEnrollmentId()));

        if (!enrollment.getStudent().getId().equals(student.getId())) {
            throw new UnauthorizedEvaluationAccessException("This enrollment does not belong to you");
        }

        // 3. ตรวจสอบว่าติวเตอร์ปิดจบการสอนคอร์สแล้ว (enrollment ถูกเลื่อนเป็น COMPLETED ตอนติวเตอร์กดปิดจบ)
        if (enrollment.getStatus() != EnrollmentStatus.COMPLETED
                || enrollment.getCourse().getStatus() != CourseStatus.COMPLETED) {
            throw new EnrollmentNotCompletedException(
                    "ติวเตอร์ยังไม่ได้ปิดจบการสอนคอร์สนี้ จึงยังประเมินไม่ได้");
        }

        // 4. ตรวจสอบว่ายังไม่เคยรีวิวคอร์สนี้
        Long courseId = enrollment.getCourse().getId();
        if (evaluationRepository.existsByStudentIdAndCourseId(student.getId(), courseId)) {
            throw new EvaluationAlreadyExistsException();
        }

        Course course = enrollment.getCourse();
        Tutor Tutor = course.getTutor();

        // 5. สร้าง evaluation — เผยแพร่ทันทีที่ส่ง (ไม่มีขั้นตอนให้แอดมินตรวจสอบ/อนุมัติก่อน)
        CourseEvaluation evaluation = CourseEvaluation.builder()
                .student(student)
                .course(course)
                .enrollment(enrollment)
                .tutor(Tutor)
                .comment(request.getComment())
                .isAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false)
                .status(EvaluationStatus.PUBLISHED)
                .build();

        attachCriteriaScores(evaluation, request.getCriteriaScores());
        evaluation.setRating(computeOverallRating(evaluation.getCriteriaScores()));

        CourseEvaluation saved = evaluationRepository.save(evaluation);
        saved.setEvaluationCode("EVL-" + String.format("%08d", saved.getId()));
        saved = evaluationRepository.save(saved);

        return evaluationMapper.toResponseForAdmin(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PendingEvaluationResponse> getPendingEvaluations(String username) {
        Student student = findStudentByUsername(username);

        return enrollmentRepository.findByStudentIdAndStatus(student.getId(), EnrollmentStatus.COMPLETED).stream()
                .filter(e -> e.getCourse().getStatus() == CourseStatus.COMPLETED)
                .filter(e -> !evaluationRepository.existsByStudentIdAndCourseId(student.getId(), e.getCourse().getId()))
                .map(e -> {
                    Course course = e.getCourse();
                    Tutor tutor = course.getTutor();
                    return PendingEvaluationResponse.builder()
                            .enrollmentId(e.getId())
                            .courseId(course.getId())
                            .courseCode(course.getCourseCode())
                            .courseName(course.getCourseName())
                            .tutorId(tutor.getId())
                            .tutorName(tutor.getFirstName() + " " + tutor.getLastName())
                            .courseStartDate(course.getCourseStartDate())
                            .build();
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseEvaluationResponse> getAllEvaluations() {
        return evaluationRepository.findAll().stream()
                .map(evaluationMapper::toResponseForAdmin)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CourseEvaluationResponse getEvaluationById(Long id, String username) {
        CourseEvaluation evaluation = findEvaluationById(id);
        User user = findUserByUsername(username);

        if (user.getRole() == Role.ADMIN) {
            return evaluationMapper.toResponseForAdmin(evaluation);
        }

        if (user.getRole() == Role.TUTOR) {
            Tutor Tutor = TutorRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found"));
            if (!evaluation.getTutor().getId().equals(Tutor.getId())) {
                throw new UnauthorizedEvaluationAccessException("You can only view evaluations for your own courses");
            }
            return evaluationMapper.toResponseForTeacher(evaluation);
        }

        // STUDENT — ดูได้เฉพาะของตัวเอง
        Student student = findStudentByUsername(username);
        if (!evaluation.getStudent().getId().equals(student.getId())) {
            throw new UnauthorizedEvaluationAccessException("You can only view your own evaluations");
        }
        return evaluationMapper.toResponseForAdmin(evaluation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseEvaluationResponse> getEvaluationsByCourseId(Long courseId, String username) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", courseId);
        }

        User user = findUserByUsername(username);

        if (user.getRole() == Role.ADMIN) {
            return evaluationRepository.findByCourseId(courseId).stream()
                    .map(evaluationMapper::toResponseForAdmin)
                    .toList();
        }

        // Tutor — ตรวจว่าเป็นคอร์สของตัวเอง
        Tutor Tutor = TutorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found"));

        return evaluationRepository.findByCourseId(courseId).stream()
                .filter(e -> e.getTutor().getId().equals(Tutor.getId()))
                .map(evaluationMapper::toResponseForTeacher)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseEvaluationResponse> getEvaluationsByTutorId(Long teacherId, String username) {
        if (!TutorRepository.existsById(teacherId)) {
            throw new ResourceNotFoundException("Tutor", teacherId);
        }

        User user = findUserByUsername(username);

        if (user.getRole() == Role.TUTOR) {
            Tutor Tutor = TutorRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found"));
            if (!Tutor.getId().equals(teacherId)) {
                throw new UnauthorizedEvaluationAccessException("You can only view evaluations for your own courses");
            }
        }

        return evaluationRepository.findByTutorId(teacherId).stream()
                .map(e -> user.getRole() == Role.ADMIN
                        ? evaluationMapper.toResponseForAdmin(e)
                        : evaluationMapper.toResponseForTeacher(e))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseEvaluationResponse> getMyEvaluationsAsTutor(String username) {
        User user = findUserByUsername(username);
        Tutor tutor = TutorRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tutor profile not found"));
        return evaluationRepository.findByTutorId(tutor.getId()).stream()
                .map(evaluationMapper::toResponseForTeacher)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseEvaluationResponse> getMyEvaluations(String username) {
        Student student = findStudentByUsername(username);
        return evaluationRepository.findByStudentId(student.getId()).stream()
                .map(evaluationMapper::toResponseForAdmin)
                .toList();
    }

    @Override
    @Transactional
    public CourseEvaluationResponse updateEvaluation(Long id, UpdateCourseEvaluationRequest request, String username) {
        CourseEvaluation evaluation = findEvaluationById(id);
        Student student = findStudentByUsername(username);

        // ตรวจว่าเป็นเจ้าของ
        if (!evaluation.getStudent().getId().equals(student.getId())) {
            throw new UnauthorizedEvaluationAccessException("You can only edit your own evaluations");
        }

        // ตรวจว่าอยู่ภายใน 24 ชั่วโมง
        LocalDateTime deadline = evaluation.getSubmittedAt().plusHours(EDIT_WINDOW_HOURS);
        if (LocalDateTime.now().isAfter(deadline)) {
            throw new UnauthorizedEvaluationAccessException(
                    "Evaluation can only be edited within " + EDIT_WINDOW_HOURS + " hours after submission");
        }

        evaluation.getCriteriaScores().clear();
        attachCriteriaScores(evaluation, request.getCriteriaScores());
        evaluation.setRating(computeOverallRating(evaluation.getCriteriaScores()));
        evaluation.setComment(request.getComment());
        if (request.getIsAnonymous() != null) {
            evaluation.setIsAnonymous(request.getIsAnonymous());
        }

        return evaluationMapper.toResponseForAdmin(evaluationRepository.save(evaluation));
    }

    @Override
    @Transactional
    public CourseEvaluationResponse updateEvaluationStatus(Long id, UpdateEvaluationStatusRequest request) {
        CourseEvaluation evaluation = findEvaluationById(id);
        evaluation.setStatus(request.getStatus());
        return evaluationMapper.toResponseForAdmin(evaluationRepository.save(evaluation));
    }

    @Override
    @Transactional
    public void deleteEvaluation(Long id) {
        if (!evaluationRepository.existsById(id)) {
            throw new CourseEvaluationNotFoundException(id);
        }
        evaluationRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseEvaluationSummaryResponse getCourseSummary(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));

        long totalEvaluations = evaluationRepository.countByCourseIdAndStatus(courseId, EvaluationStatus.PUBLISHED);

        Tutor Tutor = course.getTutor();
        String teacherName = Tutor.getFirstName() + " " + Tutor.getLastName();

        List<CriteriaAverageResponse> criteriaAverages = evaluationCriteriaRepository
                .findAllByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(criteria -> CriteriaAverageResponse.builder()
                        .criteriaId(criteria.getId())
                        .label(criteria.getLabel())
                        .averageScore(roundToOne(evaluationCriteriaScoreRepository
                                .findAverageScoreByCriteriaIdAndCourseId(criteria.getId(), courseId)))
                        .build())
                .toList();

        return CourseEvaluationSummaryResponse.builder()
                .courseId(courseId)
                .courseName(course.getCourseName())
                .tutorId(Tutor.getId())
                .teacherName(teacherName)
                .totalEvaluations(totalEvaluations)
                .averageRating(roundToOne(evaluationRepository.findAverageRatingByCourseId(courseId)))
                .criteriaAverages(criteriaAverages)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseEvaluationSummaryResponse> getAllCourseSummaries() {
        return evaluationRepository.findDistinctCourseIds().stream()
                .map(this::getCourseSummary)
                .sorted(java.util.Comparator.comparing(
                        CourseEvaluationSummaryResponse::getCourseName,
                        String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    // ---- helper methods ----

    private CourseEvaluation findEvaluationById(Long id) {
        return evaluationRepository.findById(id)
                .orElseThrow(() -> new CourseEvaluationNotFoundException(id));
    }

    private User findUserByUsername(String username) {
        return userRepository.findByEmailOrUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private Student findStudentByUsername(String username) {
        User user = findUserByUsername(username);
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + username));
    }

    private Double roundToOne(Double value) {
        if (value == null) return null;
        return Math.round(value * 10.0) / 10.0;
    }

    private void attachCriteriaScores(CourseEvaluation evaluation, List<CriteriaScoreRequest> items) {
        for (CriteriaScoreRequest item : items) {
            EvaluationCriteria criteria = evaluationCriteriaRepository.findById(item.getCriteriaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Evaluation criteria", item.getCriteriaId()));
            evaluation.getCriteriaScores().add(EvaluationCriteriaScore.builder()
                    .evaluation(evaluation)
                    .criteria(criteria)
                    .score(item.getScore())
                    .build());
        }
    }

    // คะแนนรวม (rating) ไม่ได้ให้ผู้ใช้กดแยกอีกต่อไป — คำนวณจากค่าเฉลี่ยของคะแนนแต่ละหัวข้อที่ให้ไว้ ปัดเป็นจำนวนเต็มที่ใกล้ที่สุด
    private Integer computeOverallRating(List<EvaluationCriteriaScore> scores) {
        double average = scores.stream()
                .mapToInt(EvaluationCriteriaScore::getScore)
                .average()
                .orElse(0);
        return (int) Math.round(average);
    }
}
