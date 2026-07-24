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
public class InstitutionAchievementOverviewResponse {

    private ExamInstitutionResponse institution;
    private AchievementSummaryResponse summary;
    private List<AchievementStudentCardResponse> lowerSecondary;
    private List<AchievementStudentCardResponse> upperSecondary;
    private List<AchievementStudentCardResponse> vocationalDiploma;
    private List<AchievementStudentCardResponse> bachelor;
}
