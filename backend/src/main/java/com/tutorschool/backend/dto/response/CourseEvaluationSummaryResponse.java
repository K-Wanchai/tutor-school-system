package com.tutorschool.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CourseEvaluationSummaryResponse {

    private Long courseId;
    private String courseName;
    
    private Long tutorId;
    private String teacherName;

    private long totalEvaluations;

    private Double averageRating;
    private Double averageTeachingScore;
    private Double averageContentScore;
    private Double averageMaterialScore;
    private Double averageCommunicationScore;
    private Double averageValueScore;
}
