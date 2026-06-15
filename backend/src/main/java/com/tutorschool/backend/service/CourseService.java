package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CreateCourseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseRequest;
import com.tutorschool.backend.dto.response.CourseResponse;
import com.tutorschool.backend.dto.response.PageResponse;

public interface CourseService {

    PageResponse<CourseResponse> getAllCourses(int page, int size);

    CourseResponse getCourseById(Long id);

    CourseResponse createCourse(CreateCourseRequest request);

    CourseResponse updateCourse(Long id, UpdateCourseRequest request);

    void deleteCourse(Long id);
}
