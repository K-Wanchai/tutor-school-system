package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateStudentRequest {

    // ข้อมูล User (สำหรับ login)
    @NotBlank(message = "Username is required")
    @Size(max = 100, message = "Username must not exceed 100 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    // ข้อมูล Student (profile นักเรียน)
    @NotBlank(message = "Student code is required")
    @Size(max = 50, message = "Student code must not exceed 50 characters")
    private String studentCode;

    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;

    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;

    @NotBlank(message = "Full name is required")
    @Size(max = 255, message = "Full name must not exceed 255 characters")
    private String fullName;

    @NotBlank(message = "National ID is required")
    @Size(min = 13, max = 13, message = "National ID must be exactly 13 digits")
    @Pattern(regexp = "^[0-9]{13}$", message = "National ID must contain only digits")
    private String nationalId;

    private String address;

    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    private String phoneNumber;

    private LocalDate birthDate;

    private String guardianPhoneNumber;

    private String bankQrCode;

    private String bankAccountName;

    private String bankAccountNumber;
}
