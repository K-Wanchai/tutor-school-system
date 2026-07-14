package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.SaveAcademicFacultyRequest;
import com.tutorschool.backend.dto.response.AcademicFacultyResponse;

import java.util.List;

public interface AcademicFacultyService {

    List<AcademicFacultyResponse> getFaculties(Long institutionId);

    AcademicFacultyResponse createFaculty(Long institutionId, SaveAcademicFacultyRequest request);

    AcademicFacultyResponse updateFaculty(Long institutionId, Long facultyId, SaveAcademicFacultyRequest request);

    void deleteFaculty(Long institutionId, Long facultyId);
}
