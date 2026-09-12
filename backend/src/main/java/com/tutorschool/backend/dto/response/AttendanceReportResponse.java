package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * รายงานการเข้าเรียน — กรองตามช่วงวันที่, คอร์ส, นักเรียน, สถานะ
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceReportResponse {

    private long totalCount;
    private long presentCount;
    private long lateCount;
    private long absentCount;
    private long leaveCount;
    private double attendanceRate;

    private List<AttendanceReportItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceReportItem {
        private Long attendanceId;
        private String attendanceCode;
        private LocalDateTime checkInTime;
        private String studentName;
        private String studentCode;
        private Long courseId;
        private String courseName;
        private String courseCode;
        private String lessonTitle;
        private String status;
        private Integer lateMinutes;
    }
}
