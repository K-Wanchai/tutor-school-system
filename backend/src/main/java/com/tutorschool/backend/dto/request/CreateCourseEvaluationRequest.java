package com.tutorschool.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateCourseEvaluationRequest {

    @NotNull(message = "Enrollment ID is required")
    private Long enrollmentId;

    // คะแนนรวม (rating) คำนวณจากค่าเฉลี่ยของ criteriaScores ฝั่ง server เสมอ ไม่รับจาก client
    @NotEmpty(message = "At least one criteria score is required")
    @Valid
    private List<CriteriaScoreRequest> criteriaScores;

    private String comment;

    private Boolean isAnonymous = false;
}
