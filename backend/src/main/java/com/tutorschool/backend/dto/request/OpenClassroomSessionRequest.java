package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenClassroomSessionRequest {

    @NotBlank(message = "meetingLink is required to open a classroom session")
    @Size(max = 500, message = "meetingLink must not exceed 500 characters")
    private String meetingLink;
}
