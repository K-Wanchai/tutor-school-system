package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.QuestionType;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExamQuestionRequest {

    private String questionText;
    private QuestionType questionType;
    private String explanation;

    @Positive(message = "Score must be greater than 0")
    private Double score;

    private Boolean required;

    @Positive(message = "Question order must be a positive number")
    private Integer questionOrder;
}
