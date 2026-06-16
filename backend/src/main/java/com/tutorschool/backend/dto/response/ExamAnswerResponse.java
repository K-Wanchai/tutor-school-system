package com.tutorschool.backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamAnswerResponse {

    private Long id;
    private Long questionId;
    private String questionText;
    private Long selectedOptionId;
    private String selectedOptionText;
    private String studentAnswerText;
    private Boolean isCorrect;
    private Double scoreAwarded;
    private Double questionScore;
    private LocalDateTime answeredAt;
}
