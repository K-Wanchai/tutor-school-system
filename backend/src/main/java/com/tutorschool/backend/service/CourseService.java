package com.tutorschool.backend.service;

import java.util.List;

import com.tutorschool.backend.dto.request.CreateCourseRequest;
import com.tutorschool.backend.dto.request.TutorCourseResponseRequest;
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

    CourseResponse tutorRespondToCourse(Long courseId, TutorCourseResponseRequest request, Long tutorUserId);

    void deleteCourse(Long id);
}
