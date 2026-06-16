package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.ExamSubmissionStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResultResponse {

    private Long submissionId;
    private String submissionCode;
    private Long examId;
    private String examTitle;
    private Long studentId;
    private String studentName;
    private String studentCode;
    private int attemptNumber;
    private Double totalScore;
    private Double obtainedScore;
    private int correctCount;
    private int wrongCount;
    private int unansweredCount;
    private Boolean isPassed;
    private ExamSubmissionStatus status;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
}
