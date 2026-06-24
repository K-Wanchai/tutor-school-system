package com.tutorschool.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TestQuestionOptionResponse {
    private Long id;
    private String optionText;
    private boolean correct;
    private Integer optionOrder;
}
