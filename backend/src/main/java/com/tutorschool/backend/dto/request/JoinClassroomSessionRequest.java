package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinClassroomSessionRequest {

    @NotBlank(message = "Join code is required")
    private String joinCode;
}
