package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.AcademicMajorResponse;
import com.tutorschool.backend.entity.AcademicMajor;
import org.springframework.stereotype.Component;

@Component
public class AcademicMajorMapper {

    public AcademicMajorResponse toResponse(AcademicMajor major) {
        return AcademicMajorResponse.builder()
                .id(major.getId())
                .facultyId(major.getFaculty().getId())
                .name(major.getName())
                .active(major.getActive())
                .createdAt(major.getCreatedAt())
                .updatedAt(major.getUpdatedAt())
                .build();
    }
}
