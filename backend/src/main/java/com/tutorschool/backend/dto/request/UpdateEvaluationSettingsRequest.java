package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateEvaluationSettingsRequest {

    @NotBlank(message = "Teaching label must not be blank")
    @Size(max = 100, message = "Teaching label must not exceed 100 characters")
    private String teachingLabel;

    @NotBlank(message = "Content label must not be blank")
    @Size(max = 100, message = "Content label must not exceed 100 characters")
    private String contentLabel;

    @NotBlank(message = "Material label must not be blank")
    @Size(max = 100, message = "Material label must not exceed 100 characters")
    private String materialLabel;

    @NotBlank(message = "Communication label must not be blank")
    @Size(max = 100, message = "Communication label must not exceed 100 characters")
    private String communicationLabel;

    @NotBlank(message = "Value label must not be blank")
    @Size(max = 100, message = "Value label must not exceed 100 characters")
    private String valueLabel;
}
