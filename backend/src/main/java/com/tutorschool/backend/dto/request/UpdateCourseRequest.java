package com.tutorschool.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCourseRequest {

    @NotBlank(message = "Course name is required")
    @Size(max = 200, message = "Course name must not exceed 200 characters")
    private String courseName;

    @DecimalMin(value = "0.0", inclusive = true, message = "Price must not be negative")
    private BigDecimal price;

    private String description;

    @NotNull(message = "Total hours is required")
    @Min(value = 1, message = "Total hours must be at least 1")
    private Integer totalHours;

    @NotNull(message = "Seat limit is required")
    @Min(value = 1, message = "Seat limit must be at least 1")
    private Integer seatLimit;

    private LocalDate registrationStartDate;

    private LocalDate registrationEndDate;

    @NotNull(message = "Course start date is required")
    private LocalDate courseStartDate;

    @NotNull(message = "Tutor ID is required")
    private Long tutorId;

    @Valid
    private List<CourseLessonRequest> lessons;

    @Valid
    private List<CourseTestRequest> tests;

    private String scheduleDays;
    private LocalTime scheduleStartTime;
    private LocalTime scheduleEndTime;
}
