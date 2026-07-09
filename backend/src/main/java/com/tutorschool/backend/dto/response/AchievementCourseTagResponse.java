package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementCourseTagResponse {

    private Long enrollmentId;
    private Long courseId;
    private String courseCode;
    private String courseName;
}
