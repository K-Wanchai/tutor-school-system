package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseLessonSummaryResponse {

    private Long lessonId;
    private String lessonTitle;
    private String lessonDescription;
    private Integer lessonOrder;
}
