package com.tutorschool.backend.dto.request;

import com.tutorschool.backend.entity.EducationLevel;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentExamAchievementRequest {

    @NotNull(message = "กรุณาเลือกนักเรียน")
    private Long studentId;

    @NotNull(message = "กรุณาเลือกสถาบันที่สอบติด")
    private Long examInstitutionId;

    /** รหัส Enrollment ของคอร์สที่นักเรียนคนนี้ลงทะเบียนแล้วและเกี่ยวข้องกับผลสอบติดนี้ (ไม่บังคับ) */
    private List<Long> enrollmentIds;

    @NotNull(message = "กรุณาเลือกระดับที่สอบติด")
    private EducationLevel educationLevel;

    @Size(max = 100, message = "ห้องเรียนต้องไม่เกิน 100 ตัวอักษร")
    private String lowerSecondaryRoomType;

    @Size(max = 100, message = "สายการเรียนต้องไม่เกิน 100 ตัวอักษร")
    private String upperSecondaryProgram;

    @Size(max = 200, message = "คณะต้องไม่เกิน 200 ตัวอักษร")
    private String faculty;

    @Size(max = 200, message = "สาขาต้องไม่เกิน 200 ตัวอักษร")
    private String major;

    @Size(max = 100, message = "รอบที่สอบติดต้องไม่เกิน 100 ตัวอักษร")
    private String admissionRound;

    @NotNull(message = "กรุณากรอกปีการศึกษา")
    private Integer academicYear;

    private LocalDate resultDate;

    private String note;

    private Boolean active;
}
