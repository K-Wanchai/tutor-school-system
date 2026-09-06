package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class SaveExamScoreRequest {

    @NotNull(message = "examId is required")
    private Long examId;

    @NotNull(message = "studentId is required")
    private Long studentId;

    @NotNull(message = "score is required")
    @PositiveOrZero(message = "score must be zero or greater")
    private Double score;

    private String note;
}
