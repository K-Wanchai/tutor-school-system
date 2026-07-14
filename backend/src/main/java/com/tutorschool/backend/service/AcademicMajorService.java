package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.SaveAcademicMajorRequest;
import com.tutorschool.backend.dto.response.AcademicMajorResponse;

import java.util.List;

public interface AcademicMajorService {

    List<AcademicMajorResponse> getMajors(Long institutionId, Long facultyId);

    AcademicMajorResponse createMajor(Long institutionId, Long facultyId, SaveAcademicMajorRequest request);

    AcademicMajorResponse updateMajor(Long institutionId, Long facultyId, Long majorId, SaveAcademicMajorRequest request);

    void deleteMajor(Long institutionId, Long facultyId, Long majorId);
}
