package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateQuestionOptionRequest {

    @NotBlank(message = "Option text is required")
    private String optionText;

    @Builder.Default
    private boolean correct = false;

    @NotNull(message = "Option order is required")
    @Positive(message = "Option order must be a positive number")
    private Integer optionOrder;
}
