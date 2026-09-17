package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.ScheduleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class CreateCourseScheduleRequest {

    @NotNull(message = "courseId is required")
    private Long courseId;

    private Long lessonId;

    @NotBlank(message = "title is required")
    private String title;

    private String description;

    @NotNull(message = "scheduleDate is required")
    private LocalDate scheduleDate;

    @NotNull(message = "startTime is required")
    private LocalTime startTime;

    @NotNull(message = "endTime is required")
    private LocalTime endTime;

    private String location;

    private String meetingLink;

    @NotNull(message = "scheduleType is required")
    private ScheduleType scheduleType;
}
