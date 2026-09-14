package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * รายงานข้อมูลการเข้าเรียน — สรุปอัตราการเข้าเรียนต่อ 1 แถว (1 นักเรียน/1 คอร์ส) จากข้อมูลดิบ
 * ClassAttendance ในช่วงวันที่ที่กรอง — attendanceRate = (เข้าเรียน + มาสาย) / จำนวนครั้งทั้งหมด
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceReportResponse {

    private long totalCount;

    private List<AttendanceReportItem> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceReportItem {
        private Long studentId;
        private String studentName;
        private String studentCode;
        private Long courseId;
        private String courseName;
        private String courseCode;
        private long totalSessions;
        private long presentCount;
        private long lateCount;
        private long absentCount;
        private long leaveCount;
        private long excusedCount;
        private double attendanceRate;
    }
}
