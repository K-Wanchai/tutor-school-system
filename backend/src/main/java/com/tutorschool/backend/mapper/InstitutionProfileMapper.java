package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.InstitutionProfileResponse;
import com.tutorschool.backend.entity.InstitutionProfile;
import org.springframework.stereotype.Component;

@Component
public class InstitutionProfileMapper {

    public InstitutionProfileResponse toResponse(InstitutionProfile entity) {
        return InstitutionProfileResponse.builder()
                .id(entity.getId())
                .institutionCode(entity.getInstitutionCode())
                .institutionName(entity.getInstitutionName())
                .address(entity.getAddress())
                .phoneNumber(entity.getPhoneNumber())
                .email(entity.getEmail())
                .logoUrl(entity.getLogoUrl())
                .bankName(entity.getBankName())
                .bankAccountName(entity.getBankAccountName())
                .bankAccountNumber(entity.getBankAccountNumber())
                .bankQrCode(entity.getBankQrCode())
                .promptPayId(entity.getPromptPayId())
                .enrollmentPaymentDeadlineMinutes(entity.getEnrollmentPaymentDeadlineMinutes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
