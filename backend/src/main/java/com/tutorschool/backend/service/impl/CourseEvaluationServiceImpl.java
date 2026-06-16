package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.CreateCourseEvaluationRequest;
import com.tutorschool.backend.dto.request.UpdateCourseEvaluationRequest;
import com.tutorschool.backend.dto.request.UpdateEvaluationStatusRequest;
import com.tutorschool.backend.dto.response.CourseEvaluationResponse;
import com.tutorschool.backend.dto.response.CourseEvaluationSummaryResponse;
import com.tutorschool.backend.entity.*;
import com.tutorschool.backend.exception.*;
import com.tutorschool.backend.mapper.CourseEvaluationMapper;
import com.tutorschool.backend.repository.*;
import com.tutorschool.backend.service.CourseEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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

        // 3. ตรวจสอบว่า enrollment status เป็น COMPLETED
        if (enrollment.getStatus() != EnrollmentStatus.COMPLETED) {
            throw new EnrollmentNotCompletedException();
        }

        // 4. ตรวจสอบว่ายังไม่เคยรีวิวคอร์สนี้
        Long courseId = enrollment.getCourse().getId();
        if (evaluationRepository.existsByStudentIdAndCourseId(student.getId(), courseId)) {
            throw new EvaluationAlreadyExistsException();
        }

        Course course = enrollment.getCourse();
        Tutor Tutor = course.getTutor();

        // 5. สร้าง evaluation
        CourseEvaluation evaluation = CourseEvaluation.builder()
                .student(student)
                .course(course)
                .enrollment(enrollment)
                .tutor(Tutor)
                .rating(request.getRating())
                .teachingScore(request.getTeachingScore())
                .contentScore(request.getContentScore())
                .materialScore(request.getMaterialScore())
                .communicationScore(request.getCommunicationScore())
                .valueScore(request.getValueScore())
                .comment(request.getComment())
                .suggestion(request.getSuggestion())
                .isAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : false)
                .build();

        CourseEvaluation saved = evaluationRepository.save(evaluation);
        saved.setEvaluationCode("EVL-" + String.format("%08d", saved.getId()));
        saved = evaluationRepository.save(saved);

        return evaluationMapper.toResponseForAdmin(saved);
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
    public List<CourseEvaluationResponse> getEvaluationsByTeacherId(Long teacherId, String username) {
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

        evaluation.setRating(request.getRating());
        evaluation.setTeachingScore(request.getTeachingScore());
        evaluation.setContentScore(request.getContentScore());
        evaluation.setMaterialScore(request.getMaterialScore());
        evaluation.setCommunicationScore(request.getCommunicationScore());
        evaluation.setValueScore(request.getValueScore());
        evaluation.setComment(request.getComment());
        evaluation.setSuggestion(request.getSuggestion());
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

        return CourseEvaluationSummaryResponse.builder()
                .courseId(courseId)
                .courseName(course.getCourseName())
                .teacherId(Tutor.getId())
                .teacherName(teacherName)
                .totalEvaluations(totalEvaluations)
                .averageRating(roundToOne(evaluationRepository.findAverageRatingByCourseId(courseId)))
                .averageTeachingScore(roundToOne(evaluationRepository.findAverageTeachingScoreByCourseId(courseId)))
                .averageContentScore(roundToOne(evaluationRepository.findAverageContentScoreByCourseId(courseId)))
                .averageMaterialScore(roundToOne(evaluationRepository.findAverageMaterialScoreByCourseId(courseId)))
                .averageCommunicationScore(roundToOne(evaluationRepository.findAverageCommunicationScoreByCourseId(courseId)))
                .averageValueScore(roundToOne(evaluationRepository.findAverageValueScoreByCourseId(courseId)))
                .build();
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
}
