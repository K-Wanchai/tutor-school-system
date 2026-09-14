package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * รายงานข้อมูลประเมินความพึงพอใจของคอร์สเรียน — สรุปคะแนนเฉลี่ยต่อ 1 แถว (1 คอร์ส) จากข้อมูลดิบ
 * CourseEvaluation ในช่วงวันที่ที่กรอง (นับทุกสถานะ ไม่ใช่แค่ PUBLISHED)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationReportResponse {

    private long totalCount;
    private double overallAverageRating;

    private List<EvaluationReportItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluationReportItem {
        private Long courseId;
        private String courseName;
        private String courseCode;
        private String tutorName;
        private long evaluationCount;
        private double averageRating;
    }
}
