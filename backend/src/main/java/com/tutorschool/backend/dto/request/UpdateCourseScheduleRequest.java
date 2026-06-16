package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCourseScheduleRequest {

    @NotBlank(message = "title is required")
    private String title;

    private String description;

    private String location;

    private String meetingLink;
}
