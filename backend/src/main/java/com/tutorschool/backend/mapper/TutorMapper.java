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
                .firstName(Tutor.getFirstName())
                .lastName(Tutor.getLastName())
                .email(Tutor.getUser().getEmail())
                .phoneNumber(Tutor.getPhoneNumber())
                .specialization(Tutor.getSpecialization())
                .bio(Tutor.getBio())
                .createdAt(Tutor.getCreatedAt())
                .updatedAt(Tutor.getUpdatedAt())
                .build();
    }
}
