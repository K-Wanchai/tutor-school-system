package com.tutorschool.backend.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionOptionResponse {

    private Long id;
    private String optionText;

    // null เมื่อซ่อนเฉลยจากนักเรียน (ก่อน submit)
    // Boolean object → Lombok สร้าง getIsCorrect() → JSON key "isCorrect"
    private Boolean isCorrect;

    private Integer optionOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
