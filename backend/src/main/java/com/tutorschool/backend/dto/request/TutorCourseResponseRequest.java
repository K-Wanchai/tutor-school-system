package com.tutorschool.backend.dto.request;

import jakarta.validation.Valid;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TutorCourseResponseRequest {

    private boolean accepted;

    private String remark;

    @Valid
    private List<CourseLessonRequest> lessons;

    @Valid
    private List<CourseTestRequest> tests;
}
