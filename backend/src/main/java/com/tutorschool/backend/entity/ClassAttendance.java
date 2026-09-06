package com.tutorschool.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * การเช็คชื่อเข้าเรียน (onsite) ที่ติวเตอร์บันทึกเอง — อิงตาม "วันที่เรียนจริง" ของคอร์ส
 * (คำนวณจาก scheduleDays + courseStartDate เหมือนหน้าตารางสอน) โดยไม่ต้องมีแถว CourseSchedule
 * unique (course_id, session_date, student_id) — นักเรียน 1 คนมีสถานะได้ 1 ค่าต่อคาบเรียน 1 วัน
 */
@Entity
@Table(
        name = "class_attendances",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_class_attendance_course_date_student",
                columnNames = {"course_id", "session_date", "student_id"}
        )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AttendanceStatus status;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "recorded_by", length = 150)
    private String recordedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
