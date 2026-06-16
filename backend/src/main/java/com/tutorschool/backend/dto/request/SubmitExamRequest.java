package com.tutorschool.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitExamRequest {

    @NotNull(message = "Answers list is required")
    @Valid
    private List<SubmitExamAnswerRequest> answers;
}
