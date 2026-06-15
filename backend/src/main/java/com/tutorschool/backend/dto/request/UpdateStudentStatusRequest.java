package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStudentStatusRequest {

    @NotNull(message = "Enabled status is required")
    private Boolean enabled;
}
