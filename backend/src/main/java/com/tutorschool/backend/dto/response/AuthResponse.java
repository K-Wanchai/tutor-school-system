package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long userId;
    private String username;
    private String email;
    private String role;

    // เฉพาะการล็อกอินผู้ปกครอง — ข้อมูลบุตรหลานที่ผูกกับบัญชีนี้
    private Long studentId;
    private String studentName;
    private String studentCode;
}
