package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.ScheduleStatus;
import com.tutorschool.backend.entity.ScheduleType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
public class CourseScheduleResponse {

    private Long id;
    private String scheduleCode;

    private Long courseId;
    private String courseName;

    private Long lessonId;
    private String lessonTitle;

    private Long tutorId;
    private String teacherName;

    private String title;
    private String description;

    private LocalDate scheduleDate;
    private LocalTime startTime;
    private LocalTime endTime;

    private String location;
    private String meetingLink;

    private ScheduleType scheduleType;
    private ScheduleStatus status;

    private String cancelReason;
    private LocalDateTime cancelledAt;
    private String cancelledBy;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
