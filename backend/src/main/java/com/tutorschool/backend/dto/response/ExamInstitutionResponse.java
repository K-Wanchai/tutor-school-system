package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.InstitutionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamInstitutionResponse {

    private Long id;
    private String institutionCode;
    private String institutionName;
    private InstitutionType institutionType;
    private String institutionTypeLabel;
    private String province;
    private String district;
    private String address;
    private String websiteUrl;
    private String description;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
