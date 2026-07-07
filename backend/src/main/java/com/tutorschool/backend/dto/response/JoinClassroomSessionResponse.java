package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JoinClassroomSessionResponse {

    private String attendanceCode;
    private String studentName;
    private String courseName;
    private String lessonTitle;

    private LocalDateTime firstJoinAt;
    private Integer lateMinutes;
    private AttendanceStatus status;

    // ลิงก์ห้องเรียนของ session นี้ — ฝั่ง frontend ใช้ redirect ทันทีหลังกดเข้าเรียนสำเร็จ
    private String meetingLink;

    private String message;
    private Boolean isNewRecord;
}
