package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.SchoolTrackResponse;
import com.tutorschool.backend.entity.SchoolTrack;
import org.springframework.stereotype.Component;

@Component
public class SchoolTrackMapper {

    public SchoolTrackResponse toResponse(SchoolTrack track) {
        return SchoolTrackResponse.builder()
                .id(track.getId())
                .examInstitutionId(track.getExamInstitution().getId())
                .educationLevel(track.getEducationLevel())
                .name(track.getName())
                .active(track.getActive())
                .createdAt(track.getCreatedAt())
                .updatedAt(track.getUpdatedAt())
                .build();
    }
}
