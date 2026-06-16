package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.Positive;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateQuestionOptionRequest {

    private String optionText;
    private Boolean correct;

    @Positive(message = "Option order must be a positive number")
    private Integer optionOrder;
}
