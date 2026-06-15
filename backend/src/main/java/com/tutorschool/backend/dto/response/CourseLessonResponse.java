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
public class CourseLessonResponse {

    private Long id;
    private String lessonTitle;
    private String lessonContent;
    private Integer lessonOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
