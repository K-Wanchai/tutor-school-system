package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.*;
import com.tutorschool.backend.dto.response.*;
import com.tutorschool.backend.entity.*;
import com.tutorschool.backend.exception.*;
import com.tutorschool.backend.mapper.ExamMapper;
import com.tutorschool.backend.mapper.ExamQuestionMapper;
import com.tutorschool.backend.repository.*;
import com.tutorschool.backend.service.ExamService;
import com.tutorschool.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {

    private final ExamRepository examRepository;
    private final ExamQuestionRepository questionRepository;
    private final ExamQuestionOptionRepository optionRepository;
    private final CourseRepository courseRepository;
    private final CourseLessonRepository lessonRepository;
    private final TutorRepository TutorRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;
    private final ExamMapper examMapper;
    private final ExamQuestionMapper questionMapper;

    // ─── Exam CRUD ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public ExamResponse createExam(CreateExamRequest request, String teacherEmail) {
        Tutor Tutor = getTeacherByEmail(teacherEmail);
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", request.getCourseId()));

        validateTeacherOwnsCourse(Tutor, course);
        validateExamDates(request.getStartTime(), request.getEndTime());

        CourseLesson lesson = null;
        if (request.getLessonId() != null) {
            lesson = lessonRepository.findById(request.getLessonId())
                    .orElseThrow(() -> new ResourceNotFoundException("CourseLesson", request.getLessonId()));
            if (!lesson.getCourse().getId().equals(course.getId())) {
                throw new IllegalStateException("Lesson does not belong to the specified course");
            }
        }

        Exam exam = Exam.builder()
                .course(course)
                .lesson(lesson)
                .tutor(Tutor)
                .title(request.getTitle())
                .description(request.getDescription())
                .passingScore(request.getPassingScore())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .durationMinutes(request.getDurationMinutes())
                .allowMultipleAttempts(request.isAllowMultipleAttempts())
                .maxAttempts(request.getMaxAttempts())
                .shuffleQuestions(request.isShuffleQuestions())
                .showScoreAfterSubmit(request.isShowScoreAfterSubmit())
                .showCorrectAnswersAfterSubmit(request.isShowCorrectAnswersAfterSubmit())
                .build();

        Exam saved = examRepository.save(exam);
        saved.setExamCode("EXM-" + String.format("%08d", saved.getId()));
        return examMapper.toResponse(examRepository.save(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public ExamResponse getExamById(Long id) {
        Exam exam = findExamById(id);
        return examMapper.toResponse(exam);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getAllExams() {
        return examRepository.findAll().stream()
                .map(examMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getExamsByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", courseId);
        }
        return examRepository.findByCourseId(courseId).stream()
                .map(examMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getExamsByLesson(Long lessonId) {
        if (!lessonRepository.existsById(lessonId)) {
            throw new ResourceNotFoundException("CourseLesson", lessonId);
        }
        return examRepository.findByLessonId(lessonId).stream()
                .map(examMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getOpenExamsByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", courseId);
        }
        return examRepository.findByCourseIdAndStatus(courseId, ExamStatus.OPEN).stream()
                .map(examMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getMyExamsAsStudent(Long studentUserId) {
        Student student = studentRepository.findByUserId(studentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found"));

        List<Long> courseIds = enrollmentRepository.findByStudentId(student.getId()).stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.APPROVED || e.getStatus() == EnrollmentStatus.COMPLETED)
                .map(e -> e.getCourse().getId())
                .toList();

        if (courseIds.isEmpty()) return List.of();

        return examRepository.findByCourseIdIn(courseIds).stream()
                .filter(e -> e.getStatus() != ExamStatus.CANCELLED)
                .map(examMapper::toScheduleResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> getMyExamsAsTutor(String teacherEmail) {
        Tutor tutor = getTeacherByEmail(teacherEmail);
        return examRepository.findByTutorId(tutor.getId()).stream()
                .map(examMapper::toScheduleResponse)
                .toList();
    }

    @Override
    @Transactional
    public void autoTransitionExams() {
        LocalDateTime now = LocalDateTime.now();

        // DRAFT ที่ถึงเวลา startTime แล้ว และยังไม่พ้น endTime และมีคำถามอย่างน้อย 1 ข้อ → เปิดสอบให้อัตโนมัติ
        List<Exam> draftDue = examRepository.findByStatusAndStartTimeLessThanEqual(ExamStatus.DRAFT, now);
        for (Exam exam : draftDue) {
            if (exam.getEndTime() != null && !exam.getEndTime().isAfter(now)) {
                continue; // พ้นช่วงเวลาไปแล้วโดยยังไม่เคยเปิด — ปล่อยให้ติวเตอร์จัดการเอง ไม่เปิดย้อนหลัง
            }
            if (exam.getQuestions() == null || exam.getQuestions().isEmpty()) {
                continue; // ยังไม่มีคำถาม ยังไม่พร้อมเปิดสอบ
            }
            exam.setStatus(ExamStatus.OPEN);
            Exam saved = examRepository.save(exam);
            notifyExamOpened(saved);
            log.info("Auto-opened exam {} ({})", saved.getId(), saved.getTitle());
        }

        // OPEN ที่พ้น endTime แล้ว → ปิดสอบให้อัตโนมัติ
        List<Exam> openDue = examRepository.findByStatusAndEndTimeLessThanEqual(ExamStatus.OPEN, now);
        if (!openDue.isEmpty()) {
            openDue.forEach(exam -> exam.setStatus(ExamStatus.CLOSED));
            examRepository.saveAll(openDue);
            log.info("Auto-closed {} exam(s) past their end time", openDue.size());
        }
    }

    @Override
    @Transactional
    public ExamResponse updateExam(Long id, UpdateExamRequest request, String teacherEmail) {
        Tutor Tutor = getTeacherByEmail(teacherEmail);
        Exam exam = findExamById(id);
        validateTeacherOwnsExam(Tutor, exam);

        if (exam.getStatus() == ExamStatus.OPEN) {
            throw new IllegalStateException("Cannot edit an exam that is currently OPEN. Close it first.");
        }

        if (request.getTitle() != null) exam.setTitle(request.getTitle());
        if (request.getDescription() != null) exam.setDescription(request.getDescription());
        if (request.getPassingScore() != null) {
            if (exam.getTotalScore() != null && request.getPassingScore() > exam.getTotalScore()) {
                throw new IllegalStateException("Passing score cannot exceed total score (" + exam.getTotalScore() + ")");
            }
            exam.setPassingScore(request.getPassingScore());
        }
        if (request.getStartTime() != null) exam.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) exam.setEndTime(request.getEndTime());
        if (request.getDurationMinutes() != null) exam.setDurationMinutes(request.getDurationMinutes());
        if (request.getAllowMultipleAttempts() != null) exam.setAllowMultipleAttempts(request.getAllowMultipleAttempts());
        if (request.getMaxAttempts() != null) exam.setMaxAttempts(request.getMaxAttempts());
        if (request.getShuffleQuestions() != null) exam.setShuffleQuestions(request.getShuffleQuestions());
        if (request.getShowScoreAfterSubmit() != null) exam.setShowScoreAfterSubmit(request.getShowScoreAfterSubmit());
        if (request.getShowCorrectAnswersAfterSubmit() != null) {
            exam.setShowCorrectAnswersAfterSubmit(request.getShowCorrectAnswersAfterSubmit());
        }

        return examMapper.toResponse(examRepository.save(exam));
    }

    @Override
    @Transactional
    public ExamResponse openExam(Long id, String teacherEmail) {
        Tutor Tutor = getTeacherByEmail(teacherEmail);
        Exam exam = findExamById(id);
        validateTeacherOwnsExam(Tutor, exam);

        if (exam.getStatus() == ExamStatus.OPEN) {
            throw new IllegalStateException("Exam is already OPEN");
        }
        if (exam.getStatus() == ExamStatus.CANCELLED) {
            throw new IllegalStateException("Cannot open a CANCELLED exam");
        }
        if (questionRepository.countByExamId(id) == 0) {
            throw new IllegalStateException("Cannot open an exam with no questions");
        }

        exam.setStatus(ExamStatus.OPEN);
        Exam saved = examRepository.save(exam);
        notifyExamOpened(saved);
        return examMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ExamResponse closeExam(Long id, String teacherEmail) {
        Tutor Tutor = getTeacherByEmail(teacherEmail);
        Exam exam = findExamById(id);
        validateTeacherOwnsExam(Tutor, exam);

        if (exam.getStatus() != ExamStatus.OPEN) {
            throw new IllegalStateException("Exam is not currently OPEN");
        }

        exam.setStatus(ExamStatus.CLOSED);
        return examMapper.toResponse(examRepository.save(exam));
    }

    @Override
    @Transactional
    public void deleteExam(Long id, String teacherEmail) {
        Tutor Tutor = getTeacherByEmail(teacherEmail);
        Exam exam = findExamById(id);
        validateTeacherOwnsExam(Tutor, exam);

        if (exam.getStatus() == ExamStatus.OPEN) {
            throw new IllegalStateException("Cannot delete an exam that is currently OPEN. Close it first.");
        }

        examRepository.delete(exam);
    }

    // ─── Question management ──────────────────────────────────────────────────

    @Override
    @Transactional
    public ExamQuestionResponse addQuestion(Long examId, CreateExamQuestionRequest request, String teacherEmail) {
        Tutor Tutor = getTeacherByEmail(teacherEmail);
        Exam exam = findExamById(examId);
        validateTeacherOwnsExam(Tutor, exam);

        if (exam.getStatus() == ExamStatus.OPEN) {
            throw new IllegalStateException("Cannot add questions to an OPEN exam. Close it first.");
        }

        ExamQuestion question = ExamQuestion.builder()
                .exam(exam)
                .questionText(request.getQuestionText())
                .questionType(request.getQuestionType())
                .explanation(request.getExplanation())
                .score(request.getScore())
                .required(request.isRequired())
                .questionOrder(request.getQuestionOrder())
                .build();

        ExamQuestion savedQuestion = questionRepository.save(question);

        if (request.getOptions() != null && !request.getOptions().isEmpty()) {
            for (CreateQuestionOptionRequest optReq : request.getOptions()) {
                ExamQuestionOption option = ExamQuestionOption.builder()
                        .question(savedQuestion)
                        .optionText(optReq.getOptionText())
                        .correct(optReq.isCorrect())
                        .optionOrder(optReq.getOptionOrder())
                        .build();
                optionRepository.save(option);
            }
            savedQuestion = questionRepository.findById(savedQuestion.getId()).orElseThrow();
        }

        recalculateTotalScore(exam);
        return questionMapper.toResponse(savedQuestion);
    }

    @Override
    @Transactional
    public ExamQuestionResponse updateQuestion(Long questionId, UpdateExamQuestionRequest request, String teacherEmail) {
        Tutor Tutor = getTeacherByEmail(teacherEmail);
        ExamQuestion question = findQuestionById(questionId);
        validateTeacherOwnsExam(Tutor, question.getExam());

        if (question.getExam().getStatus() == ExamStatus.OPEN) {
            throw new IllegalStateException("Cannot edit questions of an OPEN exam. Close it first.");
        }

        if (request.getQuestionText() != null) question.setQuestionText(request.getQuestionText());
        if (request.getQuestionType() != null) question.setQuestionType(request.getQuestionType());
        if (request.getExplanation() != null) question.setExplanation(request.getExplanation());
        if (request.getScore() != null) {
            question.setScore(request.getScore());
            recalculateTotalScore(question.getExam());
        }
        if (request.getRequired() != null) question.setRequired(request.getRequired());
        if (request.getQuestionOrder() != null) question.setQuestionOrder(request.getQuestionOrder());

        return questionMapper.toResponse(questionRepository.save(question));
    }

    @Override
    @Transactional
    public void deleteQuestion(Long questionId, String teacherEmail) {
        Tutor Tutor = getTeacherByEmail(teacherEmail);
        ExamQuestion question = findQuestionById(questionId);
        Exam exam = question.getExam();
        validateTeacherOwnsExam(Tutor, exam);

        if (exam.getStatus() == ExamStatus.OPEN) {
            throw new IllegalStateException("Cannot delete questions from an OPEN exam. Close it first.");
        }

        questionRepository.delete(question);
        recalculateTotalScore(exam);
    }

    // ─── Option management ────────────────────────────────────────────────────

    @Override
    @Transactional
    public QuestionOptionResponse addOption(Long questionId, CreateQuestionOptionRequest request, String teacherEmail) {
        Tutor Tutor = getTeacherByEmail(teacherEmail);
        ExamQuestion question = findQuestionById(questionId);
        validateTeacherOwnsExam(Tutor, question.getExam());

        ExamQuestionOption option = ExamQuestionOption.builder()
                .question(question)
                .optionText(request.getOptionText())
                .correct(request.isCorrect())
                .optionOrder(request.getOptionOrder())
                .build();

        ExamQuestionOption saved = optionRepository.save(option);
        return questionMapper.toOptionResponse(saved);
    }

    @Override
    @Transactional
    public QuestionOptionResponse updateOption(Long optionId, UpdateQuestionOptionRequest request, String teacherEmail) {
        Tutor Tutor = getTeacherByEmail(teacherEmail);
        ExamQuestionOption option = findOptionById(optionId);
        validateTeacherOwnsExam(Tutor, option.getQuestion().getExam());

        if (request.getOptionText() != null) option.setOptionText(request.getOptionText());
        if (request.getCorrect() != null) option.setCorrect(request.getCorrect());
        if (request.getOptionOrder() != null) option.setOptionOrder(request.getOptionOrder());

        return questionMapper.toOptionResponse(optionRepository.save(option));
    }

    @Override
    @Transactional
    public void deleteOption(Long optionId, String teacherEmail) {
        Tutor Tutor = getTeacherByEmail(teacherEmail);
        ExamQuestionOption option = findOptionById(optionId);
        validateTeacherOwnsExam(Tutor, option.getQuestion().getExam());

        optionRepository.delete(option);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private Tutor getTeacherByEmail(String email) {
        return TutorRepository.findByUserEmail(email)
                .orElseThrow(() -> new ExamAccessDeniedException("Current user is not registered as a Tutor"));
    }

    private Exam findExamById(Long id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new ExamNotFoundException(id));
    }

    private ExamQuestion findQuestionById(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ExamQuestion", id));
    }

    private ExamQuestionOption findOptionById(Long id) {
        return optionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ExamQuestionOption", id));
    }

    private void validateTeacherOwnsCourse(Tutor Tutor, Course course) {
        if (!course.getTutor().getId().equals(Tutor.getId())) {
            throw new ExamAccessDeniedException("You are not the Tutor of this course");
        }
    }

    private void validateTeacherOwnsExam(Tutor Tutor, Exam exam) {
        if (!exam.getTutor().getId().equals(Tutor.getId())) {
            throw new ExamAccessDeniedException("You do not have permission to modify this exam");
        }
    }

    private void validateExamDates(java.time.LocalDateTime start, java.time.LocalDateTime end) {
        if (start != null && end != null && !start.isBefore(end)) {
            throw new IllegalStateException("Start time must be before end time");
        }
    }

    // แจ้งเตือนนักเรียนที่ลงทะเบียน (APPROVED/COMPLETED) เมื่อข้อสอบเปิดสอบ — เรียกทั้งตอนเปิดเองและตอนระบบเปิดอัตโนมัติ
    private void notifyExamOpened(Exam exam) {
        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(exam.getCourse().getId()).stream()
                .filter(e -> e.getStatus() == EnrollmentStatus.APPROVED || e.getStatus() == EnrollmentStatus.COMPLETED)
                .toList();

        String subject = "เปิดสอบแล้ว: " + exam.getTitle();
        String deadline = exam.getEndTime() != null ? "ปิดรับภายใน " + exam.getEndTime() : "";

        for (Enrollment enrollment : enrollments) {
            try {
                CreateNotificationRequest req = new CreateNotificationRequest();
                req.setUserId(enrollment.getStudent().getUser().getId());
                req.setRecipientEmail(enrollment.getStudent().getUser().getEmail());
                req.setSubject(subject);
                req.setMessage(
                        "คอร์ส " + exam.getCourse().getCourseName() + " เปิดสอบ \"" + exam.getTitle() + "\" แล้ว\n" +
                        deadline + "\n\nกรุณาเข้าสู่ระบบเพื่อทำข้อสอบ"
                );
                req.setNotificationType(NotificationType.EXAM_OPENED);
                req.setReferenceType(ReferenceType.EXAM);
                req.setReferenceId(exam.getId());
                notificationService.sendNotification(req);
            } catch (Exception e) {
                log.warn("Failed to notify student {} for exam {} opened: {}",
                        enrollment.getStudent().getId(), exam.getId(), e.getMessage());
            }
        }
    }

    // คำนวณ totalScore จากผลรวม score ของทุกคำถาม
    private void recalculateTotalScore(Exam exam) {
        List<ExamQuestion> questions = questionRepository.findByExamIdOrderByQuestionOrderAsc(exam.getId());
        double total = questions.stream()
                .mapToDouble(ExamQuestion::getScore)
                .sum();
        exam.setTotalScore(total);

        if (exam.getPassingScore() != null && exam.getPassingScore() > total) {
            exam.setPassingScore(total);
        }

        examRepository.save(exam);
    }
}
