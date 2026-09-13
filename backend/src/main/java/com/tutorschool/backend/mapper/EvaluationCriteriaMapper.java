package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.EvaluationCriteriaResponse;
import com.tutorschool.backend.entity.EvaluationCriteria;
import org.springframework.stereotype.Component;

@Component
public class EvaluationCriteriaMapper {

    public EvaluationCriteriaResponse toResponse(EvaluationCriteria entity) {
        return EvaluationCriteriaResponse.builder()
                .id(entity.getId())
                .label(entity.getLabel())
                .displayOrder(entity.getDisplayOrder())
                .isActive(entity.getIsActive())
                .build();
    }
}
