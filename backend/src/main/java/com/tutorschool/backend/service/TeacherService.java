package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CreateTeacherRequest;
import com.tutorschool.backend.dto.request.UpdateTeacherRequest;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.dto.response.TeacherResponse;

public interface TeacherService {

    PageResponse<TeacherResponse> getAllTeachers(int page, int size);

    TeacherResponse getTeacherById(Long id);

    TeacherResponse createTeacher(CreateTeacherRequest request);

    TeacherResponse updateTeacher(Long id, UpdateTeacherRequest request);

    void deleteTeacher(Long id);
}
