package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.ExamSubmissionStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamSubmissionResponse {

    private Long id;
    private String submissionCode;
    private Long examId;
    private String examTitle;
    private Long studentId;
    private String studentName;
    private Long enrollmentId;
    private int attemptNumber;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Double totalScore;
    private Double obtainedScore;
    private int correctCount;
    private int wrongCount;
    private int unansweredCount;
    private Boolean isPassed;
    private ExamSubmissionStatus status;
    private List<ExamAnswerResponse> answers;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
