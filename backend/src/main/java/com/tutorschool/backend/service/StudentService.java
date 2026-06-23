package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CreateStudentRequest;
import com.tutorschool.backend.dto.request.UpdateStudentRequest;
import com.tutorschool.backend.dto.request.UpdateStudentStatusRequest;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.dto.response.StudentResponse;

public interface StudentService {

    PageResponse<StudentResponse> getAllStudents(int page, int size, String keyword);

    StudentResponse getStudentById(Long id);

    StudentResponse getStudentByCode(String studentCode);

    StudentResponse createStudent(CreateStudentRequest request);

    StudentResponse updateStudent(Long id, UpdateStudentRequest request);

    StudentResponse updateStudentStatus(Long id, UpdateStudentStatusRequest request);

    void deleteStudent(Long id);
}
