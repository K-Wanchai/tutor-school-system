package com.tutorschool.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.tutorschool.backend.entity.CourseStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {

    private Long id;
    private String courseCode;
    private String courseName;
    private BigDecimal price;
    private String description;
    private Integer totalHours;
    private Integer seatLimit;
    private LocalDate registrationStartDate;
    private LocalDate registrationEndDate;
    private LocalDate courseStartDate;
    private CourseStatus status;
    private Long tutorId;
    private String teacherName;
    private String tutorEmail;
    private String tutorRemark;
    private long enrolledCount;
    private List<CourseLessonResponse> lessons;
    private List<CourseTestResponse> tests;
    private String scheduleDays;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime scheduleStartTime;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime scheduleEndTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
