package com.tutorschool.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * ตารางว่าง/ไม่ว่างของติวเตอร์ในวันที่ระบุ — ใช้ในหน้าสร้าง/แก้ไขคอร์สของแอดมิน เพื่อดูว่าติวเตอร์
 * มีคอร์สอื่นสอนอยู่ช่วงเวลาไหนแล้วบ้างก่อนเลือกตารางสอนของคอร์สใหม่
 * คำนวณจาก course_schedule_days (รูปแบบวันสอนรายสัปดาห์) เท่านั้น
 */
@Getter
@Builder
public class TutorAvailabilityResponse {

    private Long tutorId;
    private LocalDate date;
    private List<TimeSlot> busySlots;
    private List<TimeSlot> freeSlots;

    @Getter
    @Builder
    public static class TimeSlot {
        private LocalTime startTime;
        private LocalTime endTime;
        // null สำหรับ freeSlots
        private String courseTitle;
    }
}
