package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * รายงานข้อมูลผลการสอบ — สร้างจาก ExamManualScore (คะแนนที่ติวเตอร์กรอกเองสำหรับข้อสอบลิงก์ภายนอก)
 * กรองตามวันที่เริ่มสอบ (Exam.startTime) — averagePercentage คำนวณเฉพาะรายการที่ totalScore > 0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResultReportResponse {

    private long totalCount;
    private double averagePercentage;

    private List<ExamResultReportItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExamResultReportItem {
        private Long examId;
        private String examCode;
        private String examTitle;
        private Long courseId;
        private String courseName;
        private String courseCode;
        private Long studentId;
        private String studentName;
        private String studentCode;
        private Double score;
        private Double totalScore;
        private Double percentage;
        private String gradedBy;
        private LocalDateTime examStartTime;
        private String note;
    }
}
