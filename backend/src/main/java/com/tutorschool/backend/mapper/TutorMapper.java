package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.TutorResponse;
import com.tutorschool.backend.entity.Tutor;
import org.springframework.stereotype.Component;

@Component
public class TutorMapper {

    public TutorResponse toResponse(Tutor Tutor) {
        return TutorResponse.builder()
                .id(Tutor.getId())
                .userId(Tutor.getUser().getId())
                .tutorCode(Tutor.getTutorCode())
                .username(Tutor.getUser().getLoginUsername())
                .firstName(Tutor.getFirstName())
                .lastName(Tutor.getLastName())
                .email(Tutor.getUser().getEmail())
                .phoneNumber(Tutor.getPhoneNumber())
                .specialization(Tutor.getSpecialization())
                .bio(Tutor.getBio())
                .enabled(Tutor.getUser().isEnabled())
                .createdAt(Tutor.getCreatedAt())
                .updatedAt(Tutor.getUpdatedAt())
                .build();
    }
}
