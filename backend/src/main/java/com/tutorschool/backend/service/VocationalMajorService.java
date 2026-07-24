package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.SaveVocationalMajorRequest;
import com.tutorschool.backend.dto.response.VocationalMajorResponse;

import java.util.List;

public interface VocationalMajorService {

    List<VocationalMajorResponse> getMajors(Long institutionId);

    VocationalMajorResponse createMajor(Long institutionId, SaveVocationalMajorRequest request);

    VocationalMajorResponse updateMajor(Long institutionId, Long majorId, SaveVocationalMajorRequest request);

    void deleteMajor(Long institutionId, Long majorId);
}
