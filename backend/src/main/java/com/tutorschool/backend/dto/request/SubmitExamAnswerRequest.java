package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitExamAnswerRequest {

    @NotNull(message = "Question ID is required")
    private Long questionId;

    // สำหรับ MULTIPLE_CHOICE และ TRUE_FALSE
    private Long selectedOptionId;

    // สำหรับ CHECKBOX (หลายตัวเลือก)
    private List<Long> selectedOptionIds;

    // สำหรับ SHORT_ANSWER และ PARAGRAPH
    private String studentAnswerText;
}
