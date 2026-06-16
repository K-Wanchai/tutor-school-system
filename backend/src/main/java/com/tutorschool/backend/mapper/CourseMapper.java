package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.CourseLessonResponse;
import com.tutorschool.backend.dto.response.CourseResponse;
import com.tutorschool.backend.dto.response.CourseTestResponse;
import com.tutorschool.backend.entity.Course;
import com.tutorschool.backend.entity.CourseLesson;
import com.tutorschool.backend.entity.CourseTest;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class CourseMapper {

    public CourseResponse toSummaryResponse(Course course, long enrolledCount) {
        return buildResponse(course, enrolledCount, Collections.emptyList(), Collections.emptyList());
    }

    public CourseResponse toDetailResponse(Course course, long enrolledCount) {
        List<CourseLessonResponse> lessons = course.getLessons().stream()
                .map(this::toLessonResponse)
                .toList();

        List<CourseTestResponse> tests = course.getTests().stream()
                .map(this::toTestResponse)
                .toList();

        return buildResponse(course, enrolledCount, lessons, tests);
    }

    private CourseResponse buildResponse(Course course, long enrolledCount,
                                         List<CourseLessonResponse> lessons,
                                         List<CourseTestResponse> tests) {
        String teacherName = null;
        Long teacherId = null;

        if (course.getTutor() != null) {
            teacherId = course.getTutor().getId();
            teacherName = course.getTutor().getFirstName() + " " + course.getTutor().getLastName();
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
                .teacherId(teacherId)
                .teacherName(teacherName)
                .enrolledCount(enrolledCount)
                .lessons(lessons)
                .tests(tests)
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .build();
    }

    public CourseLessonResponse toLessonResponse(CourseLesson lesson) {
        return CourseLessonResponse.builder()
                .id(lesson.getId())
                .lessonTitle(lesson.getLessonTitle())
                .lessonContent(lesson.getLessonContent())
                .lessonOrder(lesson.getLessonOrder())
                .createdAt(lesson.getCreatedAt())
                .updatedAt(lesson.getUpdatedAt())
                .build();
    }

    public CourseTestResponse toTestResponse(CourseTest test) {
        return CourseTestResponse.builder()
                .id(test.getId())
                .testTitle(test.getTestTitle())
                .testDescription(test.getTestDescription())
                .testOrder(test.getTestOrder())
                .createdAt(test.getCreatedAt())
                .updatedAt(test.getUpdatedAt())
                .build();
    }
}
