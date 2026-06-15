package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.CourseStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCourseStatusRequest {

    @NotNull(message = "Status is required")
    private CourseStatus status;
}
