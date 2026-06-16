package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.ManualGradeRequest;
import com.tutorschool.backend.dto.request.SubmitExamAnswerRequest;
import com.tutorschool.backend.dto.request.SubmitExamRequest;
import com.tutorschool.backend.dto.response.ExamResultResponse;
import com.tutorschool.backend.dto.response.ExamSubmissionResponse;
import com.tutorschool.backend.dto.response.StudentExamResponse;
import com.tutorschool.backend.entity.*;
import com.tutorschool.backend.exception.*;
import com.tutorschool.backend.mapper.ExamMapper;
import com.tutorschool.backend.mapper.ExamSubmissionMapper;
import com.tutorschool.backend.repository.*;
import com.tutorschool.backend.service.ExamSubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamSubmissionServiceImpl implements ExamSubmissionService {

    private final ExamRepository examRepository;
    private final ExamSubmissionRepository submissionRepository;
    private final ExamAnswerRepository answerRepository;
    private final ExamQuestionRepository questionRepository;
    private final ExamQuestionOptionRepository optionRepository;
    private final ExamScoreAuditLogRepository auditLogRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final ExamMapper examMapper;
    private final ExamSubmissionMapper submissionMapper;

    // ─── Student flow ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public StudentExamResponse startExam(Long examId, String studentEmail) {
        Student student = getStudentByEmail(studentEmail);
        Exam exam = findExamById(examId);

        validateExamIsOpen(exam);
        validateExamTimeWindow(exam);

        Enrollment enrollment = enrollmentRepository
                .findByStudentIdAndCourseId(student.getId(), exam.getCourse().getId())
                .orElseThrow(() -> new ExamAccessDeniedException(
                        "You must be enrolled in this course before taking the exam"));

        if (enrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new ExamAccessDeniedException("Your enrollment must be APPROVED to take this exam");
        }

        // ตรวจสอบว่ามีการสอบที่ค้างอยู่หรือไม่
        if (submissionRepository.existsByExamIdAndStudentIdAndStatus(
                examId, student.getId(), ExamSubmissionStatus.IN_PROGRESS)) {
            throw new ExamAlreadyStartedException(examId);
        }

        // ตรวจสอบจำนวนครั้งที่สอบ
        long attemptCount = submissionRepository.countByExamIdAndStudentId(examId, student.getId());
        if (!exam.isAllowMultipleAttempts() && attemptCount > 0) {
            throw new ExamMaxAttemptsExceededException(1);
        }
        if (exam.getMaxAttempts() != null && attemptCount >= exam.getMaxAttempts()) {
            throw new ExamMaxAttemptsExceededException(exam.getMaxAttempts());
        }

        ExamSubmission submission = ExamSubmission.builder()
                .exam(exam)
                .student(student)
                .enrollment(enrollment)
                .attemptNumber((int) attemptCount + 1)
                .totalScore(exam.getTotalScore())
                .build();

        ExamSubmission saved = submissionRepository.save(submission);
        saved.setSubmissionCode("SUB-" + String.format("%08d", saved.getId()));
        saved = submissionRepository.save(saved);

        // โหลด questions พร้อม options — ซ่อนเฉลย
        exam.setQuestions(questionRepository.findByExamIdOrderByQuestionOrderAsc(examId));
        return examMapper.toStudentResponse(exam, saved.getId());
    }

    @Override
    @Transactional
    public ExamSubmissionResponse submitExam(Long examId, SubmitExamRequest request, String studentEmail) {
        Student student = getStudentByEmail(studentEmail);
        Exam exam = findExamById(examId);

        ExamSubmission submission = submissionRepository
                .findByExamIdAndStudentId(examId, student.getId())
                .stream()
                .filter(s -> s.getStatus() == ExamSubmissionStatus.IN_PROGRESS)
                .findFirst()
                .orElseThrow(() -> new ExamSubmissionNotFoundException(0L));

        if (submission.getStatus() != ExamSubmissionStatus.IN_PROGRESS) {
            throw new ExamAlreadySubmittedException(submission.getId());
        }

        // ตรวจสอบว่าหมดเวลาหรือยัง
        if (exam.getDurationMinutes() != null) {
            LocalDateTime deadline = submission.getStartedAt().plusMinutes(exam.getDurationMinutes());
            if (LocalDateTime.now().isAfter(deadline)) {
                throw new ExamNotOpenException("Exam time has expired");
            }
        }

        List<ExamQuestion> questions = questionRepository.findByExamIdOrderByQuestionOrderAsc(examId);
        Map<Long, SubmitExamAnswerRequest> answerMap = request.getAnswers().stream()
                .collect(Collectors.toMap(SubmitExamAnswerRequest::getQuestionId, a -> a,
                        (a1, a2) -> a1));

        List<ExamAnswer> answers = new ArrayList<>();
        double obtainedScore = 0.0;
        int correctCount = 0;
        int wrongCount = 0;
        int unansweredCount = 0;

        for (ExamQuestion question : questions) {
            SubmitExamAnswerRequest answerReq = answerMap.get(question.getId());
            ExamAnswer answer = gradeQuestion(submission, question, answerReq);
            answers.add(answer);

            if (isUnanswered(answerReq, question)) {
                unansweredCount++;
            } else if (answer.getIsCorrect() == null) {
                // SHORT_ANSWER / PARAGRAPH — รอ manual grading
            } else if (Boolean.TRUE.equals(answer.getIsCorrect())) {
                correctCount++;
                obtainedScore += answer.getScoreAwarded();
            } else {
                wrongCount++;
            }
        }

        answerRepository.saveAll(answers);

        submission.setSubmittedAt(LocalDateTime.now());
        submission.setObtainedScore(obtainedScore);
        submission.setCorrectCount(correctCount);
        submission.setWrongCount(wrongCount);
        submission.setUnansweredCount(unansweredCount);
        submission.setTotalScore(exam.getTotalScore());
        submission.setStatus(ExamSubmissionStatus.SUBMITTED);

        if (exam.getPassingScore() != null) {
            submission.setIsPassed(obtainedScore >= exam.getPassingScore());
        }

        submissionRepository.save(submission);

        // โหลด answers กลับมา
        submission.setAnswers(answerRepository.findBySubmissionId(submission.getId()));
        return submissionMapper.toResponse(submission);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamSubmissionResponse> getMySubmissions(String studentEmail) {
        Student student = getStudentByEmail(studentEmail);
        return submissionRepository.findByStudentId(student.getId()).stream()
                .map(submissionMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ExamSubmissionResponse getSubmissionById(Long submissionId, String userEmail) {
        ExamSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ExamSubmissionNotFoundException(submissionId));

        // นักเรียนดูได้เฉพาะของตัวเอง — Teacher/Admin ดูได้ทุกคน
        boolean isStudent = studentRepository.existsByUserEmail(userEmail);
        if (isStudent) {
            User user = userRepository.findByEmail(userEmail).orElseThrow();
            Student student = studentRepository.findByUserId(user.getId()).orElseThrow();
            if (!submission.getStudent().getId().equals(student.getId())) {
                throw new ExamAccessDeniedException("You can only view your own submissions");
            }
        }

        submission.setAnswers(answerRepository.findBySubmissionId(submissionId));
        return submissionMapper.toResponse(submission);
    }

    // ─── Manual grading (Teacher) ─────────────────────────────────────────────

    @Override
    @Transactional
    public ExamSubmissionResponse manualGrade(Long submissionId, ManualGradeRequest request, String teacherEmail) {
        Teacher teacher = teacherRepository.findByUserEmail(teacherEmail)
                .orElseThrow(() -> new ExamAccessDeniedException("Current user is not registered as a teacher"));

        ExamSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ExamSubmissionNotFoundException(submissionId));

        if (!submission.getExam().getTeacher().getId().equals(teacher.getId())) {
            throw new ExamAccessDeniedException("You do not have permission to grade this submission");
        }

        ExamAnswer answer = answerRepository
                .findBySubmissionIdAndQuestionId(submissionId, request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("ExamAnswer for question", request.getQuestionId()));

        ExamQuestion question = answer.getQuestion();
        if (request.getScoreAwarded() > question.getScore()) {
            throw new IllegalStateException(
                    "Score awarded (" + request.getScoreAwarded() + ") cannot exceed question score (" + question.getScore() + ")");
        }

        // บันทึก audit log ก่อนแก้ไข
        ExamScoreAuditLog auditLog = ExamScoreAuditLog.builder()
                .submission(submission)
                .questionId(question.getId())
                .oldScore(answer.getScoreAwarded())
                .newScore(request.getScoreAwarded())
                .changedBy(teacherEmail)
                .reason(request.getReason())
                .build();
        auditLogRepository.save(auditLog);

        // อัปเดต answer
        double scoreDiff = request.getScoreAwarded() - answer.getScoreAwarded();
        answer.setScoreAwarded(request.getScoreAwarded());
        if (request.getIsCorrect() != null) {
            answer.setIsCorrect(request.getIsCorrect());
        }
        answerRepository.save(answer);

        // อัปเดต submission totals
        submission.setObtainedScore(submission.getObtainedScore() + scoreDiff);
        if (request.getIsCorrect() != null && Boolean.TRUE.equals(request.getIsCorrect())) {
            submission.setCorrectCount(submission.getCorrectCount() + 1);
        }
        if (submission.getExam().getPassingScore() != null) {
            submission.setIsPassed(submission.getObtainedScore() >= submission.getExam().getPassingScore());
        }
        submission.setStatus(ExamSubmissionStatus.GRADED);
        submissionRepository.save(submission);

        submission.setAnswers(answerRepository.findBySubmissionId(submissionId));
        return submissionMapper.toResponse(submission);
    }

    // ─── Results ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<ExamResultResponse> getMyResults(String studentEmail) {
        Student student = getStudentByEmail(studentEmail);
        return submissionRepository.findByStudentId(student.getId()).stream()
                .map(submissionMapper::toResultResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResultResponse> getResultsByExam(Long examId, String teacherEmail) {
        Teacher teacher = teacherRepository.findByUserEmail(teacherEmail)
                .orElseThrow(() -> new ExamAccessDeniedException("Current user is not registered as a teacher"));

        Exam exam = findExamById(examId);
        if (!exam.getTeacher().getId().equals(teacher.getId())) {
            throw new ExamAccessDeniedException("You do not have permission to view results of this exam");
        }

        return submissionRepository.findByExamId(examId).stream()
                .map(submissionMapper::toResultResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResultResponse> getResultsByCourse(Long courseId, String teacherEmail) {
        Teacher teacher = teacherRepository.findByUserEmail(teacherEmail)
                .orElseThrow(() -> new ExamAccessDeniedException("Current user is not registered as a teacher"));

        return submissionRepository.findByExamCourseId(courseId).stream()
                .filter(s -> s.getExam().getTeacher().getId().equals(teacher.getId()))
                .map(submissionMapper::toResultResponse)
                .toList();
    }

    // ─── Auto grading ─────────────────────────────────────────────────────────

    private ExamAnswer gradeQuestion(ExamSubmission submission, ExamQuestion question,
                                      SubmitExamAnswerRequest req) {
        ExamAnswer.ExamAnswerBuilder builder = ExamAnswer.builder()
                .submission(submission)
                .question(question)
                .scoreAwarded(0.0);

        if (req == null) {
            return builder.build();
        }

        switch (question.getQuestionType()) {
            case MULTIPLE_CHOICE, TRUE_FALSE -> gradeChoiceQuestion(builder, req, question);
            case CHECKBOX -> gradeCheckboxQuestion(builder, req, question);
            case SHORT_ANSWER, PARAGRAPH -> gradeTextQuestion(builder, req);
        }

        return builder.build();
    }

    private void gradeChoiceQuestion(ExamAnswer.ExamAnswerBuilder builder,
                                      SubmitExamAnswerRequest req, ExamQuestion question) {
        if (req.getSelectedOptionId() == null) return;

        ExamQuestionOption option = optionRepository.findById(req.getSelectedOptionId())
                .orElseThrow(() -> new ResourceNotFoundException("ExamQuestionOption", req.getSelectedOptionId()));

        if (!option.getQuestion().getId().equals(question.getId())) {
            throw new IllegalStateException("Selected option does not belong to this question");
        }

        builder.selectedOption(option);
        if (option.isCorrect()) {
            builder.isCorrect(true).scoreAwarded(question.getScore());
        } else {
            builder.isCorrect(false).scoreAwarded(0.0);
        }
    }

    private void gradeCheckboxQuestion(ExamAnswer.ExamAnswerBuilder builder,
                                        SubmitExamAnswerRequest req, ExamQuestion question) {
        if (req.getSelectedOptionIds() == null || req.getSelectedOptionIds().isEmpty()) return;

        // เก็บ selected IDs เป็น comma-separated ใน studentAnswerText
        String selectedText = req.getSelectedOptionIds().stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
        builder.studentAnswerText(selectedText);

        List<Long> correctIds = optionRepository.findByQuestionIdAndCorrectTrue(question.getId())
                .stream().map(ExamQuestionOption::getId).sorted().toList();
        List<Long> selectedSorted = req.getSelectedOptionIds().stream().sorted().toList();

        boolean allCorrect = correctIds.equals(selectedSorted);
        builder.isCorrect(allCorrect).scoreAwarded(allCorrect ? question.getScore() : 0.0);
    }

    private void gradeTextQuestion(ExamAnswer.ExamAnswerBuilder builder, SubmitExamAnswerRequest req) {
        if (req.getStudentAnswerText() == null || req.getStudentAnswerText().isBlank()) return;
        builder.studentAnswerText(req.getStudentAnswerText());
        // isCorrect = null, scoreAwarded = 0 → รอ manual grading
    }

    private boolean isUnanswered(SubmitExamAnswerRequest req, ExamQuestion question) {
        if (req == null) return true;
        return switch (question.getQuestionType()) {
            case MULTIPLE_CHOICE, TRUE_FALSE -> req.getSelectedOptionId() == null;
            case CHECKBOX -> req.getSelectedOptionIds() == null || req.getSelectedOptionIds().isEmpty();
            case SHORT_ANSWER, PARAGRAPH -> req.getStudentAnswerText() == null || req.getStudentAnswerText().isBlank();
        };
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private Student getStudentByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return studentRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ExamAccessDeniedException("Current user is not registered as a student"));
    }

    private Exam findExamById(Long id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new ExamNotFoundException(id));
    }

    private void validateExamIsOpen(Exam exam) {
        if (exam.getStatus() != ExamStatus.OPEN) {
            throw new ExamNotOpenException(exam.getId());
        }
    }

    private void validateExamTimeWindow(Exam exam) {
        LocalDateTime now = LocalDateTime.now();
        if (exam.getStartTime() != null && now.isBefore(exam.getStartTime())) {
            throw new ExamNotOpenException("Exam has not started yet. Starts at: " + exam.getStartTime());
        }
        if (exam.getEndTime() != null && now.isAfter(exam.getEndTime())) {
            throw new ExamNotOpenException("Exam registration period has ended at: " + exam.getEndTime());
        }
    }
}
