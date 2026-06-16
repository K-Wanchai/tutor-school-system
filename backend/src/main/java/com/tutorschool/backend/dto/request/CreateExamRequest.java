package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateExamRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    private Long lessonId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Passing score is required")
    @DecimalMin(value = "0", message = "Passing score must be 0 or greater")
    private Double passingScore;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Positive(message = "Duration must be a positive number")
    private Integer durationMinutes;

    @Builder.Default
    private boolean allowMultipleAttempts = false;

    @Positive(message = "Max attempts must be a positive number")
    private Integer maxAttempts;

    @Builder.Default
    private boolean shuffleQuestions = false;

    @Builder.Default
    private boolean showScoreAfterSubmit = true;

    @Builder.Default
    private boolean showCorrectAnswersAfterSubmit = false;
}
