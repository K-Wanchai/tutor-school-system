package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.ExamInstitutionResponse;
import com.tutorschool.backend.entity.ExamInstitution;
import com.tutorschool.backend.entity.InstitutionType;
import org.springframework.stereotype.Component;

@Component
public class ExamInstitutionMapper {

    public ExamInstitutionResponse toResponse(ExamInstitution institution) {
        return ExamInstitutionResponse.builder()
                .id(institution.getId())
                .institutionCode(institution.getInstitutionCode())
                .institutionName(institution.getInstitutionName())
                .institutionType(institution.getInstitutionType())
                .institutionTypeLabel(toLabel(institution.getInstitutionType()))
                .province(institution.getProvince())
                .district(institution.getDistrict())
                .address(institution.getAddress())
                .websiteUrl(institution.getWebsiteUrl())
                .description(institution.getDescription())
                .active(institution.getActive())
                .createdAt(institution.getCreatedAt())
                .updatedAt(institution.getUpdatedAt())
                .build();
    }

    public static String toLabel(InstitutionType type) {
        if (type == null) {
            return "-";
        }
        return switch (type) {
            case LOWER_SECONDARY -> "มัธยมต้น";
            case UPPER_SECONDARY -> "มัธยมปลาย";
            case UNIVERSITY -> "มหาวิทยาลัย / ปริญญาตรี";
            case OTHER -> "อื่น ๆ";
        };
    }
}
