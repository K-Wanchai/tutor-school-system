package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CreateStudentRequest;
import com.tutorschool.backend.dto.request.UpdateStudentRequest;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.dto.response.StudentResponse;

public interface StudentService {

    PageResponse<StudentResponse> getAllStudents(int page, int size);

    StudentResponse getStudentById(Long id);

    StudentResponse createStudent(CreateStudentRequest request);

    StudentResponse updateStudent(Long id, UpdateStudentRequest request);

    void deleteStudent(Long id);
}
