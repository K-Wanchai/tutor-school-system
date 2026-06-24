package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.QuestionType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TestQuestionResponse {
    private Long id;
    private Long courseTestId;
    private String questionText;
    private QuestionType questionType;
    private Integer questionOrder;
    private String explanation;
    private List<TestQuestionOptionResponse> options;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
