package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateExamQuestionRequest {

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    private String explanation;

    @NotNull(message = "Score is required")
    @Positive(message = "Score must be greater than 0")
    private Double score;

    @Builder.Default
    private boolean required = true;

    @NotNull(message = "Question order is required")
    @Positive(message = "Question order must be a positive number")
    private Integer questionOrder;

    @Valid
    private List<CreateQuestionOptionRequest> options;
}
