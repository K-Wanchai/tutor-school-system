package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.AcademicFacultyResponse;
import com.tutorschool.backend.entity.AcademicFaculty;
import org.springframework.stereotype.Component;

@Component
public class AcademicFacultyMapper {

    public AcademicFacultyResponse toResponse(AcademicFaculty faculty) {
        return AcademicFacultyResponse.builder()
                .id(faculty.getId())
                .examInstitutionId(faculty.getExamInstitution().getId())
                .name(faculty.getName())
                .active(faculty.getActive())
                .createdAt(faculty.getCreatedAt())
                .updatedAt(faculty.getUpdatedAt())
                .build();
    }
}
