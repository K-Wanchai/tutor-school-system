package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseTestRequest {

    @NotBlank(message = "Test title is required")
    @Size(max = 300, message = "Test title must not exceed 300 characters")
    private String testTitle;

    private String testDescription;

    @NotNull(message = "Test order is required")
    @Min(value = 1, message = "Test order must be at least 1")
    private Integer testOrder;
}
