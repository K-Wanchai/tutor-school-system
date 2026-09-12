package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.CourseResponse;
import com.tutorschool.backend.entity.Course;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {

    public CourseResponse toResponse(Course course, long enrolledCount) {
        String teacherName = null;
        String tutorEmail = null;
        Long tutorId = null;

        if (course.getTutor() != null) {
            tutorId = course.getTutor().getId();
            teacherName = course.getTutor().getFirstName() + " " + course.getTutor().getLastName();
            if (course.getTutor().getUser() != null) {
                tutorEmail = course.getTutor().getUser().getEmail();
            }
        }

        return CourseResponse.builder()
                .id(course.getId())
                .courseCode(course.getCourseCode())
                .courseName(course.getCourseName())
                .price(course.getPrice())
                .description(course.getDescription())
                .totalHours(course.getTotalHours())
                .seatLimit(course.getSeatLimit())
                .registrationStartDate(course.getRegistrationStartDate())
                .registrationEndDate(course.getRegistrationEndDate())
                .courseStartDate(course.getCourseStartDate())
                .status(course.getStatus())
                .tutorId(tutorId)
                .teacherName(teacherName)
                .tutorEmail(tutorEmail)
                .tutorRemark(course.getTutorRemark())
                .tutorViewed(course.isTutorViewed())
                .enrolledCount(enrolledCount)
                .scheduleDays(CourseScheduleDayMapper.toResponseList(course.getScheduleDayPatterns()))
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}
