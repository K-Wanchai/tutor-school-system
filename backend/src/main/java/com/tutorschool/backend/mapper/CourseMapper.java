package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.CourseResponse;
import com.tutorschool.backend.entity.Course;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {

    public CourseResponse toResponse(Course course, long enrolledCount) {
        String teacherName = null;
        Long teacherId = null;

        if (course.getTeacher() != null) {
            teacherId = course.getTeacher().getId();
            teacherName = course.getTeacher().getFirstName() + " " + course.getTeacher().getLastName();
        }

        return CourseResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .description(course.getDescription())
                .price(course.getPrice())
                .teacherId(teacherId)
                .teacherName(teacherName)
                .maxStudents(course.getMaxStudents())
                .enrolledCount(enrolledCount)
                .active(course.isActive())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }
}
