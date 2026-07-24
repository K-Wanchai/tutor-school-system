package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.VocationalMajorResponse;
import com.tutorschool.backend.entity.VocationalMajor;
import org.springframework.stereotype.Component;

@Component
public class VocationalMajorMapper {

    public VocationalMajorResponse toResponse(VocationalMajor major) {
        return VocationalMajorResponse.builder()
                .id(major.getId())
                .examInstitutionId(major.getExamInstitution().getId())
                .name(major.getName())
                .active(major.getActive())
                .createdAt(major.getCreatedAt())
                .updatedAt(major.getUpdatedAt())
                .build();
    }
}
