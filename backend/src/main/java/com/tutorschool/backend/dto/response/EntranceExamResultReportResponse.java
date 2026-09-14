package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * รายงานข้อมูลผลการสอบเข้า — สร้างจาก StudentExamAchievement (เฉพาะรายการที่ active)
 * byInstitution/byEducationLevel ใช้วาดกราฟฝั่ง frontend, items ใช้แสดงตารางรายละเอียด
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntranceExamResultReportResponse {

    private long totalCount;

    private List<InstitutionCount> byInstitution;
    private List<EducationLevelCount> byEducationLevel;

    private List<EntranceExamResultItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstitutionCount {
        private Long institutionId;
        private String institutionName;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EducationLevelCount {
        private String educationLevel;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntranceExamResultItem {
        private Long studentId;
        private String studentName;
        private String studentCode;
        private Long institutionId;
        private String institutionName;
        private String institutionCode;
        private String educationLevel;
        private String programName;
        private String admissionRoundName;
        private Integer academicYear;
        private LocalDate resultDate;
        private String note;
    }
}
