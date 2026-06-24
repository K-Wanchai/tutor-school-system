package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseLessonRequest {

    @NotBlank(message = "Lesson title is required")
    @Size(max = 300, message = "Lesson title must not exceed 300 characters")
    private String lessonTitle;

    private String lessonContent;

    @NotNull(message = "Lesson order is required")
    @Min(value = 1, message = "Lesson order must be at least 1")
    private Integer lessonOrder;

    private List<CourseTestRequest> tests;
}
