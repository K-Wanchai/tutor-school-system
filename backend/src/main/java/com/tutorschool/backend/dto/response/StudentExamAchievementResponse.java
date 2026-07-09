package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.EducationLevel;
import com.tutorschool.backend.entity.InstitutionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamAchievementResponse {

    private Long id;
    private Long studentId;
    private String studentName;
    private String studentCode;
    private String studentEmail;
    private String studentPhone;
    private Long examInstitutionId;
    private String institutionCode;
    private String institutionName;
    private InstitutionType institutionType;
    private EducationLevel educationLevel;
    private String educationLevelLabel;
    private String lowerSecondaryRoomType;
    private String upperSecondaryProgram;
    private String faculty;
    private String major;
    private String admissionRound;
    private Integer academicYear;
    private LocalDate resultDate;
    private String note;
    private Boolean active;
    private List<AchievementCourseTagResponse> taggedCourses;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
