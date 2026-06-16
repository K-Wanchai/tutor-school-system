package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.ExamStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResponse {

    private Long id;
    private String examCode;
    private Long courseId;
    private String courseName;
    private Long lessonId;
    private String lessonTitle;
    private Long teacherId;
    private String teacherName;
    private String title;
    private String description;
    private Double totalScore;
    private Double passingScore;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private Boolean allowMultipleAttempts;
    private Integer maxAttempts;
    private Boolean shuffleQuestions;
    private Boolean showScoreAfterSubmit;
    private Boolean showCorrectAnswersAfterSubmit;
    private ExamStatus status;
    private List<ExamQuestionResponse> questions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
