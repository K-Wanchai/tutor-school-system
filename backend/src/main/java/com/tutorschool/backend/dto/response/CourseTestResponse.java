package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseTestResponse {

    private Long id;
    private String testTitle;
    private String testDescription;
    private Integer testOrder;
    private Integer lessonOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
