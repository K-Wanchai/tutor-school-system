package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CancelCourseScheduleRequest {

    @NotBlank(message = "cancelReason is required")
    private String cancelReason;
}
