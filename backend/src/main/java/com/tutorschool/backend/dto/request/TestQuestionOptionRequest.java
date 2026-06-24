package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TestQuestionOptionRequest {

    @NotBlank(message = "Option text is required")
    private String optionText;

    private boolean correct;

    private Integer optionOrder;
}
