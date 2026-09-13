package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationSettingsResponse {

    private Long id;
    private String teachingLabel;
    private String contentLabel;
    private String materialLabel;
    private String communicationLabel;
    private String valueLabel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
