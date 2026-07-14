package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementStudentCardResponse {

    private Long achievementId;
    private Long studentId;
    private String studentName;
    private Integer academicYear;
    private String schoolTrackName;
    private String facultyName;
    private String majorName;
    private String admissionRoundName;
    private String courseSummary;
    private List<String> courseNames;
}
