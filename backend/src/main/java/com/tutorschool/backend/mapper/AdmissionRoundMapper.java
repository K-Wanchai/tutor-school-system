package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.AdmissionRoundResponse;
import com.tutorschool.backend.entity.AdmissionRound;
import org.springframework.stereotype.Component;

@Component
public class AdmissionRoundMapper {

    public AdmissionRoundResponse toResponse(AdmissionRound round) {
        return AdmissionRoundResponse.builder()
                .id(round.getId())
                .examInstitutionId(round.getExamInstitution().getId())
                .name(round.getName())
                .active(round.getActive())
                .createdAt(round.getCreatedAt())
                .updatedAt(round.getUpdatedAt())
                .build();
    }
}
