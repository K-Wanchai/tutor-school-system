package com.tutorschool.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CourseEvaluationSummaryResponse {

    private Long courseId;
    private String courseName;

    private Long tutorId;
    private String teacherName;

    private long totalEvaluations;

    private Double averageRating;
    private List<CriteriaAverageResponse> criteriaAverages;
}
