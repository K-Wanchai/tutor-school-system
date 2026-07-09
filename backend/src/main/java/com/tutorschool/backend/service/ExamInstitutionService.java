package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.ExamInstitutionRequest;
import com.tutorschool.backend.dto.response.ExamInstitutionResponse;
import com.tutorschool.backend.dto.response.InstitutionAchievementOverviewResponse;
import com.tutorschool.backend.entity.InstitutionType;

import java.util.List;

public interface ExamInstitutionService {

    ExamInstitutionResponse createExamInstitution(ExamInstitutionRequest request);

    List<ExamInstitutionResponse> getAllExamInstitutions();

    ExamInstitutionResponse getExamInstitutionById(Long id);

    ExamInstitutionResponse updateExamInstitution(Long id, ExamInstitutionRequest request);

    void deleteExamInstitution(Long id);

    List<ExamInstitutionResponse> searchExamInstitutions(String keyword, InstitutionType type, Boolean active);

    InstitutionAchievementOverviewResponse getInstitutionAchievements(Long institutionId);
}
