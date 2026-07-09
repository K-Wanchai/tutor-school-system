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
    private String lowerSecondaryRoomType;
    private String upperSecondaryProgram;
    private String faculty;
    private String major;
    private String admissionRound;
    private String courseSummary;
    private List<String> courseNames;
}
