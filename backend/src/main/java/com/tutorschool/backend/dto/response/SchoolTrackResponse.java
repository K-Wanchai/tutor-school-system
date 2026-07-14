package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.EducationLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchoolTrackResponse {

    private Long id;
    private Long examInstitutionId;
    private EducationLevel educationLevel;
    private String name;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
