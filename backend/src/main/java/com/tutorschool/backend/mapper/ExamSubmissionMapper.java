package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.ExamAnswerResponse;
import com.tutorschool.backend.dto.response.ExamResultResponse;
import com.tutorschool.backend.dto.response.ExamSubmissionResponse;
import com.tutorschool.backend.entity.ExamAnswer;
import com.tutorschool.backend.entity.ExamSubmission;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExamSubmissionMapper {

    public ExamSubmissionResponse toResponse(ExamSubmission submission) {
        return ExamSubmissionResponse.builder()
                .id(submission.getId())
                .submissionCode(submission.getSubmissionCode())
                .examId(submission.getExam().getId())
                .examTitle(submission.getExam().getTitle())
                .studentId(submission.getStudent().getId())
                .studentName(submission.getStudent().getFullName())
                .enrollmentId(submission.getEnrollment().getId())
                .attemptNumber(submission.getAttemptNumber())
                .startedAt(submission.getStartedAt())
                .submittedAt(submission.getSubmittedAt())
                .totalScore(submission.getTotalScore())
                .obtainedScore(submission.getObtainedScore())
                .correctCount(submission.getCorrectCount())
                .wrongCount(submission.getWrongCount())
                .unansweredCount(submission.getUnansweredCount())
                .isPassed(submission.getIsPassed())
                .status(submission.getStatus())
                .answers(toAnswerResponses(submission.getAnswers()))
                .createdAt(submission.getCreatedAt())
                .updatedAt(submission.getUpdatedAt())
                .build();
    }

    public ExamResultResponse toResultResponse(ExamSubmission submission) {
        return ExamResultResponse.builder()
                .submissionId(submission.getId())
                .submissionCode(submission.getSubmissionCode())
                .examId(submission.getExam().getId())
                .examTitle(submission.getExam().getTitle())
                .studentId(submission.getStudent().getId())
                .studentName(submission.getStudent().getFullName())
                .studentCode(submission.getStudent().getStudentCode())
                .attemptNumber(submission.getAttemptNumber())
                .totalScore(submission.getTotalScore())
                .obtainedScore(submission.getObtainedScore())
                .correctCount(submission.getCorrectCount())
                .wrongCount(submission.getWrongCount())
                .unansweredCount(submission.getUnansweredCount())
                .isPassed(submission.getIsPassed())
                .status(submission.getStatus())
                .startedAt(submission.getStartedAt())
                .submittedAt(submission.getSubmittedAt())
                .build();
    }

    private List<ExamAnswerResponse> toAnswerResponses(List<ExamAnswer> answers) {
        if (answers == null) return List.of();
        return answers.stream().map(this::toAnswerResponse).toList();
    }

    public ExamAnswerResponse toAnswerResponse(ExamAnswer answer) {
        return ExamAnswerResponse.builder()
                .id(answer.getId())
                .questionId(answer.getQuestion().getId())
                .questionText(answer.getQuestion().getQuestionText())
                .selectedOptionId(answer.getSelectedOption() != null ? answer.getSelectedOption().getId() : null)
                .selectedOptionText(answer.getSelectedOption() != null ? answer.getSelectedOption().getOptionText() : null)
                .studentAnswerText(answer.getStudentAnswerText())
                .isCorrect(answer.getIsCorrect())
                .scoreAwarded(answer.getScoreAwarded())
                .questionScore(answer.getQuestion().getScore())
                .answeredAt(answer.getAnsweredAt())
                .build();
    }
}
