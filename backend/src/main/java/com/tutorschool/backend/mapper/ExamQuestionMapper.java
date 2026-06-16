package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.ExamQuestionResponse;
import com.tutorschool.backend.dto.response.QuestionOptionResponse;
import com.tutorschool.backend.entity.ExamQuestion;
import com.tutorschool.backend.entity.ExamQuestionOption;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExamQuestionMapper {

    public ExamQuestionResponse toResponse(ExamQuestion question) {
        return ExamQuestionResponse.builder()
                .id(question.getId())
                .examId(question.getExam().getId())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .explanation(question.getExplanation())
                .score(question.getScore())
                .isRequired(question.isRequired())
                .questionOrder(question.getQuestionOrder())
                .options(toOptionResponses(question.getOptions()))
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .build();
    }

    public List<QuestionOptionResponse> toOptionResponses(List<ExamQuestionOption> options) {
        if (options == null) return List.of();
        return options.stream().map(this::toOptionResponse).toList();
    }

    public QuestionOptionResponse toOptionResponse(ExamQuestionOption option) {
        return QuestionOptionResponse.builder()
                .id(option.getId())
                .optionText(option.getOptionText())
                .isCorrect(option.isCorrect())
                .optionOrder(option.getOptionOrder())
                .createdAt(option.getCreatedAt())
                .updatedAt(option.getUpdatedAt())
                .build();
    }
}
