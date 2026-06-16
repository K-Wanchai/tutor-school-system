package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.*;
import com.tutorschool.backend.entity.*;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExamMapper {

    public ExamResponse toResponse(Exam exam) {
        return ExamResponse.builder()
                .id(exam.getId())
                .examCode(exam.getExamCode())
                .courseId(exam.getCourse().getId())
                .courseName(exam.getCourse().getCourseName())
                .lessonId(exam.getLesson() != null ? exam.getLesson().getId() : null)
                .lessonTitle(exam.getLesson() != null ? exam.getLesson().getLessonTitle() : null)
                .teacherId(exam.getTeacher().getId())
                .teacherName(exam.getTeacher().getFirstName() + " " + exam.getTeacher().getLastName())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .totalScore(exam.getTotalScore())
                .passingScore(exam.getPassingScore())
                .startTime(exam.getStartTime())
                .endTime(exam.getEndTime())
                .durationMinutes(exam.getDurationMinutes())
                .allowMultipleAttempts(exam.isAllowMultipleAttempts())
                .maxAttempts(exam.getMaxAttempts())
                .shuffleQuestions(exam.isShuffleQuestions())
                .showScoreAfterSubmit(exam.isShowScoreAfterSubmit())
                .showCorrectAnswersAfterSubmit(exam.isShowCorrectAnswersAfterSubmit())
                .status(exam.getStatus())
                .questions(toQuestionResponses(exam.getQuestions(), true))
                .createdAt(exam.getCreatedAt())
                .updatedAt(exam.getUpdatedAt())
                .build();
    }

    // สำหรับ Student ขณะสอบ — ซ่อนเฉลยทั้งหมด
    public StudentExamResponse toStudentResponse(Exam exam, Long submissionId) {
        return StudentExamResponse.builder()
                .id(exam.getId())
                .examCode(exam.getExamCode())
                .submissionId(submissionId)
                .courseId(exam.getCourse().getId())
                .courseName(exam.getCourse().getCourseName())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .totalScore(exam.getTotalScore())
                .passingScore(exam.getPassingScore())
                .startTime(exam.getStartTime())
                .endTime(exam.getEndTime())
                .durationMinutes(exam.getDurationMinutes())
                .status(exam.getStatus())
                .questions(toQuestionResponses(exam.getQuestions(), false))
                .build();
    }

    public List<ExamQuestionResponse> toQuestionResponses(List<ExamQuestion> questions, boolean includeCorrect) {
        if (questions == null) return List.of();
        return questions.stream()
                .map(q -> toQuestionResponse(q, includeCorrect))
                .toList();
    }

    public ExamQuestionResponse toQuestionResponse(ExamQuestion question, boolean includeCorrect) {
        return ExamQuestionResponse.builder()
                .id(question.getId())
                .examId(question.getExam().getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .explanation(includeCorrect ? question.getExplanation() : null)
                .score(question.getScore())
                .isRequired(question.isRequired())
                .questionOrder(question.getQuestionOrder())
                .options(toOptionResponses(question.getOptions(), includeCorrect))
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .build();
    }

    public List<QuestionOptionResponse> toOptionResponses(List<ExamQuestionOption> options, boolean includeCorrect) {
        if (options == null) return List.of();
        return options.stream()
                .map(o -> QuestionOptionResponse.builder()
                        .id(o.getId())
                        .optionText(o.getOptionText())
                        .isCorrect(includeCorrect ? o.isCorrect() : null)
                        .optionOrder(o.getOptionOrder())
                        .createdAt(o.getCreatedAt())
                        .updatedAt(o.getUpdatedAt())
                        .build())
                .toList();
    }
}
