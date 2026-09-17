package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.ScheduleType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GenerateCourseScheduleRequest {

    @NotNull(message = "scheduleType is required")
    private ScheduleType scheduleType;

    private String location;

    private String meetingLink;
}
