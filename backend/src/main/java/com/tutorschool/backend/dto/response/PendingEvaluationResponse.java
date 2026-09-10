package com.tutorschool.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

/**
 * คอร์สที่นักเรียนเรียนจบแล้ว (ติวเตอร์ปิดจบการสอนแล้ว) และยังไม่เคยประเมิน
 * ใช้เป็นรายการ "รอประเมิน" ในเมนูประเมินคอร์สฝั่งนักเรียน
 */
@Getter
@Builder
public class PendingEvaluationResponse {

    private Long enrollmentId;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private Long tutorId;
    private String tutorName;
    private LocalDate courseStartDate;
}
