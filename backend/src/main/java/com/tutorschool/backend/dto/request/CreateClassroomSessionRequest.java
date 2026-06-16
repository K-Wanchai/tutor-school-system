package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateClassroomSessionRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    private Long lessonId;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @Min(value = 0, message = "Late threshold minutes must be 0 or greater")
    private Integer lateThresholdMinutes = 15;

    @NotBlank(message = "Join code is required")
    @Size(max = 100, message = "Join code must not exceed 100 characters")
    private String joinCode;

    private Boolean isCameraRequired = false;
}
