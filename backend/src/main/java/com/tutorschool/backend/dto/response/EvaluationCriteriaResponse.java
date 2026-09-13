package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationCriteriaResponse {

    private Long id;
    private String label;
    private Integer displayOrder;
    private Boolean isActive;
}
