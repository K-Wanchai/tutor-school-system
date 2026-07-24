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
    private Long schoolTrackId;
    private String schoolTrackName;
    private Long academicFacultyId;
    private String facultyName;
    private Long academicMajorId;
    private String majorName;
    private Long vocationalMajorId;
    private String vocationalMajorName;
    private Long admissionRoundId;
    private String admissionRoundName;
    private Integer academicYear;
    private LocalDate resultDate;
    private String note;
    private Boolean active;
    private List<AchievementCourseTagResponse> taggedCourses;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
