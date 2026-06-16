package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateExamRequest {

    private String title;
    private String description;

    @DecimalMin(value = "0", message = "Passing score must be 0 or greater")
    private Double passingScore;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Positive(message = "Duration must be a positive number")
    private Integer durationMinutes;

    private Boolean allowMultipleAttempts;

    @Positive(message = "Max attempts must be a positive number")
    private Integer maxAttempts;

    private Boolean shuffleQuestions;
    private Boolean showScoreAfterSubmit;
    private Boolean showCorrectAnswersAfterSubmit;
}
