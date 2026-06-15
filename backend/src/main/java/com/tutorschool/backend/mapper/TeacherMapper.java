package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.TeacherResponse;
import com.tutorschool.backend.entity.Teacher;
import org.springframework.stereotype.Component;

@Component
public class TeacherMapper {

    public TeacherResponse toResponse(Teacher teacher) {
        return TeacherResponse.builder()
                .id(teacher.getId())
                .userId(teacher.getUser().getId())
                .firstName(teacher.getFirstName())
                .lastName(teacher.getLastName())
                .email(teacher.getUser().getEmail())
                .phoneNumber(teacher.getPhoneNumber())
                .specialization(teacher.getSpecialization())
                .bio(teacher.getBio())
                .createdAt(teacher.getCreatedAt())
                .updatedAt(teacher.getUpdatedAt())
                .build();
    }
}
