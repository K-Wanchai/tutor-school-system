package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateEvaluationCriteriaRequest {

    @NotBlank(message = "Label must not be blank")
    @Size(max = 100, message = "Label must not exceed 100 characters")
    private String label;
}
