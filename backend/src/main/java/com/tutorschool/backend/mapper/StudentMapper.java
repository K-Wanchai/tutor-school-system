package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.StudentResponse;
import com.tutorschool.backend.entity.Student;
import org.springframework.stereotype.Component;

@Component
public class StudentMapper {

    public StudentResponse toResponse(Student student) {
        return StudentResponse.builder()
                .id(student.getId())
                .userId(student.getUser().getId())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .email(student.getUser().getEmail())
                .phoneNumber(student.getPhoneNumber())
                .createdAt(student.getCreatedAt())
                .updatedAt(student.getUpdatedAt())
                .build();
    }
}
