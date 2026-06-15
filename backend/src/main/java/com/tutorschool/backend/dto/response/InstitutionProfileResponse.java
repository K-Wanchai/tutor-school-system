package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionProfileResponse {

    private Long id;
    private String institutionCode;
    private String institutionName;
    private String address;
    private String phoneNumber;
    private String email;
    private String logoUrl;
    private String bankName;
    private String bankAccountName;
    private String bankAccountNumber;
    private String bankQrCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
