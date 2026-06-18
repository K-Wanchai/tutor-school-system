package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CreateCourseEvaluationRequest;
import com.tutorschool.backend.dto.request.UpdateCourseEvaluationRequest;
import com.tutorschool.backend.dto.request.UpdateEvaluationStatusRequest;
import com.tutorschool.backend.dto.response.CourseEvaluationResponse;
import com.tutorschool.backend.dto.response.CourseEvaluationSummaryResponse;

import java.util.List;

public interface CourseEvaluationService {

    CourseEvaluationResponse createEvaluation(CreateCourseEvaluationRequest request, String username);

    List<CourseEvaluationResponse> getAllEvaluations();

    CourseEvaluationResponse getEvaluationById(Long id, String username);

    List<CourseEvaluationResponse> getEvaluationsByCourseId(Long courseId, String username);

    List<CourseEvaluationResponse> getEvaluationsBytutorId(Long tutorId, String username);

    List<CourseEvaluationResponse> getMyEvaluations(String username);

    CourseEvaluationResponse updateEvaluation(Long id, UpdateCourseEvaluationRequest request, String username);

    CourseEvaluationResponse updateEvaluationStatus(Long id, UpdateEvaluationStatusRequest request);

    void deleteEvaluation(Long id);

    CourseEvaluationSummaryResponse getCourseSummary(Long courseId);
}
