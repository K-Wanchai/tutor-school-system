package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.EvaluationSettingsResponse;
import com.tutorschool.backend.entity.EvaluationSettings;
import org.springframework.stereotype.Component;

@Component
public class EvaluationSettingsMapper {

    public EvaluationSettingsResponse toResponse(EvaluationSettings entity) {
        return EvaluationSettingsResponse.builder()
                .id(entity.getId())
                .teachingLabel(entity.getTeachingLabel())
                .contentLabel(entity.getContentLabel())
                .materialLabel(entity.getMaterialLabel())
                .communicationLabel(entity.getCommunicationLabel())
                .valueLabel(entity.getValueLabel())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
