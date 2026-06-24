package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CreateTutorRequest;
import com.tutorschool.backend.dto.request.UpdateTutorRequest;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.dto.response.TutorResponse;

public interface TutorService {

    PageResponse<TutorResponse> getAllTeachers(int page, int size);

    TutorResponse getTeacherById(Long id);

    TutorResponse createTeacher(CreateTutorRequest request);

    TutorResponse updateTeacher(Long id, UpdateTutorRequest request);

    void deleteTeacher(Long id);

    TutorResponse toggleStatus(Long id, boolean enabled);
}
