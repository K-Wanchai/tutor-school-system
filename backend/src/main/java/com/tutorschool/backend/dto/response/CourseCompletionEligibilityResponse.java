package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * บอกว่าคอร์สที่กำลังเรียนอยู่ (ONGOING) พร้อมปิดจบการสอนหรือยัง — พร้อมได้ก็ต่อเมื่อเช็คชื่อและ
 * กรอกคะแนนสอบครบทุกช่องแล้วเท่านั้น (ดู CourseServiceImpl#getCourseCompletionEligibility)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseCompletionEligibilityResponse {

    private boolean canComplete;
    private boolean attendanceComplete;
    private boolean examScoresComplete;
}
