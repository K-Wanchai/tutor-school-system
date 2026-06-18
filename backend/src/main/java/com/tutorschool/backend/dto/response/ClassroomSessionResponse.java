package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.ClassroomSessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomSessionResponse {

    private Long id;
    private String sessionCode;

    private Long courseId;
    private String courseName;

    private Long lessonId;
    private String lessonTitle;

    private Long tutorId;
    private String teacherName;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer lateThresholdMinutes;
    private String joinCode;
    private Boolean isCameraRequired;

    private ClassroomSessionStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
