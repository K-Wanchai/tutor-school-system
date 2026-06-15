package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private Long teacherId;
    private String teacherName;
    private Integer maxStudents;
    private long enrolledCount;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
