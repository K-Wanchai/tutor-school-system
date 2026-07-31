package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.CourseScheduleDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalTime;
import java.util.List;

public interface CourseScheduleDayRepository extends JpaRepository<CourseScheduleDay, Long> {

    List<CourseScheduleDay> findByCourseId(Long courseId);

    void deleteByCourseId(Long courseId);

    // วันสอนทั้งหมดของ Tutor คนนี้ (ทุกคอร์ส) ในวันที่ระบุ — ใช้แสดง busy slot ใน panel เลือกตาราง
    List<CourseScheduleDay> findByCourse_Tutor_IdAndDayOfWeek(Long tutorId, String dayOfWeek);

    // เช็ควัน-เวลาชนกันของ Tutor คนเดียวกันตรงๆ ด้วย SQL แทนการ parse สตริงใน Java
    // (excludeCourseId = null หมายถึงไม่ต้อง exclude คอร์สไหน — ใช้ตอนสร้างคอร์สใหม่)
    @Query("""
            SELECT csd FROM CourseScheduleDay csd
            WHERE csd.course.tutor.id = :tutorId
              AND csd.dayOfWeek = :dayOfWeek
              AND csd.startTime < :endTime
              AND :startTime < csd.endTime
              AND (:excludeCourseId IS NULL OR csd.course.id <> :excludeCourseId)
            """)
    List<CourseScheduleDay> findOverlapping(
            @Param("tutorId") Long tutorId,
            @Param("dayOfWeek") String dayOfWeek,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeCourseId") Long excludeCourseId
    );
}
