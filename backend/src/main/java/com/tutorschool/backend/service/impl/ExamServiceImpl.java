package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.*;
import com.tutorschool.backend.dto.response.*;
import com.tutorschool.backend.entity.*;
import com.tutorschool.backend.exception.*;
import com.tutorschool.backend.mapper.ExamMapper;
import com.tutorschool.backend.mapper.ExamQuestionMapper;
import com.tutorschool.backend.repository.*;
import com.tutorschool.backend.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {

    private final ExamRepository examRepository;
    private final ExamQuestionRepository questionRepository;
    private final ExamQuestionOptionRepository optionRepository;
    private final CourseRepository courseRepository;
    private final CourseLessonRepository lessonRepository;
    private final TutorRepository TutorRepository;
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
                .Tutor(Tutor)
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
        return examMapper.toResponse(examRepository.save(exam));
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
