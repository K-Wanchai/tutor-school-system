package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.EvaluationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

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
    private Integer teachingScore;
    private Integer contentScore;
    private Integer materialScore;
    private Integer communicationScore;
    private Integer valueScore;

    private String comment;
    private String suggestion;

    private Boolean isAnonymous;
    private EvaluationStatus status;

    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
