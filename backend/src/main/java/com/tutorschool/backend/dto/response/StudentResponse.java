package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {

    private Long id;
    private Long userId;

    // ข้อมูล User
    private String username;
    private String email;
    private boolean enabled;

    // ข้อมูล Student
    private String studentCode;
    private String firstName;
    private String lastName;
    private String fullName;
    private String nationalId;
    private String address;
    private String phoneNumber;
    private LocalDate birthDate;
    private String guardianPhoneNumber;
    private String bankName;
    private String bankQrCode;
    private String bankAccountName;
    private String bankAccountNumber;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Computed from enabled for frontend convenience
    private String status;
}
