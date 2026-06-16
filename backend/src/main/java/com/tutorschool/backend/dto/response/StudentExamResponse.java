package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.ExamStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

// Response สำหรับนักเรียนขณะสอบ — ไม่มีเฉลย (isCorrect = null ในทุก option)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamResponse {

    private Long id;
    private String examCode;
    private Long submissionId;
    private Long courseId;
    private String courseName;
    private String title;
    private String description;
    private Double totalScore;
    private Double passingScore;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private ExamStatus status;
    private List<ExamQuestionResponse> questions;
}
