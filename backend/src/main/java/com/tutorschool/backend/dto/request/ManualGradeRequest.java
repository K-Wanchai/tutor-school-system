package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualGradeRequest {

    @NotNull(message = "Question ID is required")
    private Long questionId;

    @NotNull(message = "Score awarded is required")
    @DecimalMin(value = "0", message = "Score must be 0 or greater")
    private Double scoreAwarded;

    private Boolean isCorrect;

    @NotBlank(message = "Reason for grading change is required")
    private String reason;
}
