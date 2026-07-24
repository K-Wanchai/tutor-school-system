package com.tutorschool.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ไม่บังคับ nullable ตอน insert เพราะ code ถูก generate จาก id หลัง save ครั้งแรก (ดู CourseServiceImpl#createCourse)
    @Column(name = "course_code", unique = true, length = 50)
    private String courseCode;

    @Column(name = "course_name", nullable = false, length = 200)
    private String courseName;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "total_hours", nullable = false)
    private Integer totalHours;

    @Column(name = "seat_limit", nullable = false)
    private Integer seatLimit;

    @Column(name = "registration_start_date")
    private LocalDate registrationStartDate;

    @Column(name = "registration_end_date")
    private LocalDate registrationEndDate;

    @Column(name = "course_start_date", nullable = false)
    private LocalDate courseStartDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private CourseStatus status = CourseStatus.CLOSED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    private Tutor tutor;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("lessonOrder ASC")
    @Builder.Default
    private List<CourseLesson> lessons = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("testOrder ASC")
    @Builder.Default
    private List<CourseTest> tests = new ArrayList<>();

    @Column(name = "tutor_remark", columnDefinition = "TEXT")
    private String tutorRemark;

    /** true เมื่อติวเตอร์เปิดดูคอร์สนี้แล้ว (ใช้ตัดสิน badge แจ้งเตือนคอร์สใหม่ที่เมนู "คอร์สของฉัน") */
    @Column(name = "tutor_viewed", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean tutorViewed = false;

    /** วันสอนในสัปดาห์ เก็บเป็น comma-separated เช่น "MON,WED,FRI" */
    @Column(name = "schedule_days", length = 100)
    private String scheduleDays;

    @Column(name = "schedule_start_time")
    private LocalTime scheduleStartTime;

    @Column(name = "schedule_end_time")
    private LocalTime scheduleEndTime;

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
