package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCourseEvaluationRequest {

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    @NotNull(message = "Teaching score is required")
    @Min(value = 1, message = "Teaching score must be at least 1")
    @Max(value = 5, message = "Teaching score must be at most 5")
    private Integer teachingScore;

    @NotNull(message = "Content score is required")
    @Min(value = 1, message = "Content score must be at least 1")
    @Max(value = 5, message = "Content score must be at most 5")
    private Integer contentScore;

    @NotNull(message = "Material score is required")
    @Min(value = 1, message = "Material score must be at least 1")
    @Max(value = 5, message = "Material score must be at most 5")
    private Integer materialScore;

    @NotNull(message = "Communication score is required")
    @Min(value = 1, message = "Communication score must be at least 1")
    @Max(value = 5, message = "Communication score must be at most 5")
    private Integer communicationScore;

    @NotNull(message = "Value score is required")
    @Min(value = 1, message = "Value score must be at least 1")
    @Max(value = 5, message = "Value score must be at most 5")
    private Integer valueScore;

    private String comment;

    private String suggestion;

    private Boolean isAnonymous;
}
