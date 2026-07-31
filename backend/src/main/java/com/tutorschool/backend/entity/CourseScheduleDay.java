package com.tutorschool.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * หนึ่งแถว = หนึ่งวันสอนของ Course (normalized จาก Course.scheduleDays ซึ่งเก็บ pattern
 * ทั้งหมดไว้ในสตริงเดียว เช่น "MON:10:00-15:00,WED:15:00-19:00"). ตารางนี้ sync
 * มาจากสตริงนั้นทุกครั้งที่สร้าง/แก้ไขคอร์ส (ดู CourseServiceImpl#addScheduleDayPatterns)
 * เพื่อให้ query วันชนกันของติวเตอร์ทำเป็น SQL WHERE ตรงๆ ได้ แทนที่จะ parse สตริงใน Java.
 */
@Entity
@Table(name = "course_schedule_days")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseScheduleDay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    /** รหัสวัน 3 ตัวอักษร: MON/TUE/WED/THU/FRI/SAT/SUN (ดู ScheduleDaysParser.toDayCode) */
    @Column(name = "day_of_week", nullable = false, length = 3)
    private String dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
