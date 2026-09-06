package com.tutorschool.backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamManualScoreResponse {

    private Long id;
    private Long examId;
    private Long studentId;
    private String studentName;
    private String studentCode;
    private Double score;
    private String note;
    private String gradedBy;
    private LocalDateTime updatedAt;
}
