package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * รายงานผลสอบ/ผลงานติวเตอร์ — สรุปเป็นรายคอร์ส (แต่ละคอร์สมีติวเตอร์ผู้สอนคนเดียว)
 * กรองตามช่วงวันที่สอบ, คอร์ส, ติวเตอร์
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamPerformanceReportResponse {

    private List<ExamPerformanceReportItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExamPerformanceReportItem {
        private Long courseId;
        private String courseName;
        private String courseCode;
        private Long tutorId;
        private String tutorName;
        private long examCount;
        private long submissionCount;
        private long studentCount;
        private Double averageScorePercent;
        private Double passRate;
    }
}
