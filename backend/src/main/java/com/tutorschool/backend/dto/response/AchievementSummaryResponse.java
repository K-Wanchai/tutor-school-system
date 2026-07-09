package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementSummaryResponse {

    private long total;
    private long lowerSecondaryCount;
    private long upperSecondaryCount;
    private long bachelorCount;
}
