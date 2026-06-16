package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.QuestionType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestionResponse {

    private Long id;
    private Long examId;
    private String questionText;
    private QuestionType questionType;

    // null เมื่อซ่อนจากนักเรียน (ก่อน submit)
    private String explanation;

    private Double score;

    // Boolean object → JSON key "isRequired"
    private Boolean isRequired;

    private Integer questionOrder;
    private List<QuestionOptionResponse> options;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
