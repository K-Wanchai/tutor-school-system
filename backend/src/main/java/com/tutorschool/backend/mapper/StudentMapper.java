package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.StudentResponse;
import com.tutorschool.backend.entity.Student;
import org.springframework.stereotype.Component;

@Component
public class StudentMapper {

    public StudentResponse toResponse(Student student) {
        boolean enabled = student.getUser().isEnabled();
        return StudentResponse.builder()
                .id(student.getId())
                .userId(student.getUser().getId())
                .username(student.getUser().getLoginUsername())
                .email(student.getUser().getEmail())
                .enabled(enabled)
                .status(enabled ? "ACTIVE" : "INACTIVE")
                .studentCode(student.getStudentCode())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .fullName(student.getFullName())
                .nationalId(student.getNationalId())
                .address(student.getAddress())
                .phoneNumber(student.getPhoneNumber())
                .birthDate(student.getBirthDate())
                .guardianPhoneNumber(student.getGuardianPhoneNumber())
                .bankName(student.getBankName())
                .bankQrCode(student.getBankQrCode())
                .bankAccountName(student.getBankAccountName())
                .bankAccountNumber(student.getBankAccountNumber())
                .createdAt(student.getCreatedAt())
                .updatedAt(student.getUpdatedAt())
                .build();
    }
}
