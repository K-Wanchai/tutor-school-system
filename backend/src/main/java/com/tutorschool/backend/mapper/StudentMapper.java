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
                .username(student.getUser().getUsername())
                .email(student.getUser().getEmail())
                .enabled(student.getUser().isEnabled())
                .studentCode(student.getStudentCode())
                .fullName(student.getFullName())
                .nationalId(student.getNationalId())
                .address(student.getAddress())
                .phoneNumber(student.getPhoneNumber())
                .birthDate(student.getBirthDate())
                .guardianPhoneNumber(student.getGuardianPhoneNumber())
                .bankQrCode(student.getBankQrCode())
                .bankAccountName(student.getBankAccountName())
                .bankAccountNumber(student.getBankAccountNumber())
                .createdAt(student.getCreatedAt())
                .updatedAt(student.getUpdatedAt())
                .build();
    }
}
