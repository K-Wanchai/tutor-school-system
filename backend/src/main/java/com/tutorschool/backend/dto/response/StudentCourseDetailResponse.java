package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.EnrollmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentCourseDetailResponse {

    private Long enrollmentId;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private EnrollmentStatus enrollmentStatus;
    private LocalDateTime enrolledAt;
    private TutorSummaryResponse tutor;
    private List<CourseLessonSummaryResponse> lessons;
}
