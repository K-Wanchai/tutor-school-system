package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.CourseScheduleResponse;
import com.tutorschool.backend.entity.CourseSchedule;
import org.springframework.stereotype.Component;

@Component
public class CourseScheduleMapper {

    public CourseScheduleResponse toResponse(CourseSchedule schedule) {
        return CourseScheduleResponse.builder()
                .id(schedule.getId())
                .scheduleCode(schedule.getScheduleCode())
                .courseId(schedule.getCourse().getId())
                .courseName(schedule.getCourse().getCourseName())
                .lessonId(schedule.getLesson() != null ? schedule.getLesson().getId() : null)
                .lessonTitle(schedule.getLesson() != null ? schedule.getLesson().getLessonTitle() : null)
                .tutorId(schedule.getTutor().getId())
                .teacherName(schedule.getTutor().getFirstName() + " " + schedule.getTutor().getLastName())
                .title(schedule.getTitle())
                .description(schedule.getDescription())
                .scheduleDate(schedule.getScheduleDate())
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .location(schedule.getLocation())
                .meetingLink(schedule.getMeetingLink())
                .scheduleType(schedule.getScheduleType())
                .status(schedule.getStatus())
                .cancelReason(schedule.getCancelReason())
                .cancelledAt(schedule.getCancelledAt())
                .cancelledBy(schedule.getCancelledBy())
                .createdAt(schedule.getCreatedAt())
                .updatedAt(schedule.getUpdatedAt())
                .build();
    }
}
