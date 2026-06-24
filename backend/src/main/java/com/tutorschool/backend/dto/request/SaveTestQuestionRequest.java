package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SaveTestQuestionRequest {

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    private Integer questionOrder;

    private String explanation;

    private List<TestQuestionOptionRequest> options;
}
