package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.ScheduleDaySlotResponse;
import com.tutorschool.backend.entity.CourseScheduleDay;

import java.util.Comparator;
import java.util.List;

/** ใช้ร่วมกันโดย CourseMapper และ EnrollmentMapper ในการแปลง course_schedule_days เป็น DTO เรียงลำดับ จ-อา */
public final class CourseScheduleDayMapper {

    private static final List<String> WEEK_ORDER = List.of("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN");

    private CourseScheduleDayMapper() {
    }

    public static List<ScheduleDaySlotResponse> toResponseList(List<CourseScheduleDay> patterns) {
        return patterns.stream()
                .sorted(Comparator.comparingInt(p -> WEEK_ORDER.indexOf(p.getDayOfWeek())))
                .map(p -> ScheduleDaySlotResponse.builder()
                        .dayOfWeek(p.getDayOfWeek())
                        .startTime(p.getStartTime())
                        .endTime(p.getEndTime())
                        .build())
                .toList();
    }
}
