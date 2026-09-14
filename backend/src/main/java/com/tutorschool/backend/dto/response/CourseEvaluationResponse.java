package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.EvaluationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class CourseEvaluationResponse {

    private Long id;
    private String evaluationCode;

    // แสดง "Anonymous" ถ้า isAnonymous = true
    private String studentName;
    private Long studentId;

    private Long courseId;
    private String courseName;

    private Long enrollmentId;

    private Long tutorId;
    private String teacherName;

    private Integer rating;
    private List<CriteriaScoreResponse> criteriaScores;

    private String comment;

    private Boolean isAnonymous;
    private EvaluationStatus status;

    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
