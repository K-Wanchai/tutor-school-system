package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.EvaluationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateEvaluationStatusRequest {

    @NotNull(message = "Status is required")
    private EvaluationStatus status;
}
