package com.tutorschool.backend.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * หนึ่งคาบเรียนที่คำนวณจาก course_schedule_days + courseStartDate + totalHours (ไม่ใช่แถวที่เก็บจริงในตาราง
 * ใดๆ — ระบบไม่มีตารางเก็บคาบเรียนรายวันแล้วหลังลบ course_schedules ออก) ใช้เป็นคอลัมน์ของตารางเช็คชื่อ
 * ฝั่งแอดมิน/ติวเตอร์ ดู ClassAttendanceServiceImpl#getCourseSessions
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseSessionResponse {

    private LocalDate scheduleDate;
    private LocalTime startTime;
    private LocalTime endTime;
}
