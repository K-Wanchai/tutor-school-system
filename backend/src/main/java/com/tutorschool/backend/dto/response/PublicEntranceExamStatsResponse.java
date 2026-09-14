package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * สถิติผลสอบเข้าแบบสาธารณะ สำหรับแสดงบนหน้าแลนดิ้งเพจ (ไม่ต้องล็อกอิน) — มีแค่ตัวเลขรวมและชื่อสถาบัน
 * ไม่มีชื่อ/ข้อมูลส่วนตัวของนักเรียนรายบุคคลเลย (ต่างจาก EntranceExamResultReportResponse ที่ admin ใช้
 * ซึ่งมี items ระบุตัวนักเรียนด้วย)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicEntranceExamStatsResponse {

    private long totalCount;
    private int totalInstitutions;
    private List<EntranceExamResultReportResponse.InstitutionCount> topInstitutions;
    private List<EntranceExamResultReportResponse.EducationLevelCount> byEducationLevel;
}
