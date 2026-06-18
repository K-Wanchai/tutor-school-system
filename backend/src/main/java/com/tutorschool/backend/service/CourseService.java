package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CreateCourseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseStatusRequest;
import com.tutorschool.backend.dto.response.CourseResponse;
import com.tutorschool.backend.dto.response.PageResponse;

import java.util.List;

public interface CourseService {

    PageResponse<CourseResponse> getAllCourses(int page, int size);

    CourseResponse getCourseById(Long id);

    CourseResponse getCourseByCode(String courseCode);

    List<CourseResponse> getCoursesBytutorId(Long tutorId);

    CourseResponse createCourse(CreateCourseRequest request);

    CourseResponse updateCourse(Long id, UpdateCourseRequest request);

    CourseResponse updateCourseStatus(Long id, UpdateCourseStatusRequest request);

    void deleteCourse(Long id);
}
