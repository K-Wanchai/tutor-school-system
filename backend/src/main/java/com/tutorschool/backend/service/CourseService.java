package com.tutorschool.backend.service;

import java.util.List;

import com.tutorschool.backend.dto.request.CourseLessonRequest;
import com.tutorschool.backend.dto.request.CourseTestRequest;
import com.tutorschool.backend.dto.request.CreateCourseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseStatusRequest;
import com.tutorschool.backend.dto.response.CourseResponse;
import com.tutorschool.backend.dto.response.PageResponse;

public interface CourseService {

    PageResponse<CourseResponse> getAllCourses(int page, int size);

    CourseResponse getCourseById(Long id);

    CourseResponse getCourseByCode(String courseCode);

    List<CourseResponse> getCoursesByTutorId(Long tutorId);

    List<CourseResponse> getCoursesByTutorUserId(Long userId);

    CourseResponse createCourse(CreateCourseRequest request);

    CourseResponse updateCourse(Long id, UpdateCourseRequest request);

    CourseResponse updateCourseStatus(Long id, UpdateCourseStatusRequest request);

    CourseResponse addLesson(Long courseId, CourseLessonRequest request, Long tutorUserId);

    CourseResponse updateLesson(Long courseId, Long lessonId, CourseLessonRequest request, Long tutorUserId);

    void deleteLesson(Long courseId, Long lessonId, Long tutorUserId);

    CourseResponse addTest(Long courseId, CourseTestRequest request, Long tutorUserId);

    void markCourseViewed(Long courseId, Long tutorUserId);

    void deleteCourse(Long id);
}
