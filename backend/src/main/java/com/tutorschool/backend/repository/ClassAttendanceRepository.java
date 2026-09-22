package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ClassAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClassAttendanceRepository extends JpaRepository<ClassAttendance, Long> {

    List<ClassAttendance> findByCourseId(Long courseId);

    List<ClassAttendance> findByStudentId(Long studentId);

    boolean existsByStudentId(Long studentId);

    Optional<ClassAttendance> findByCourseIdAndStudentIdAndSessionDate(Long courseId, Long studentId, LocalDate sessionDate);

    // รายงานข้อมูลการเข้าเรียน — กรองแบบ nullable-param เหมือน searchForReport ของ Student/Tutor/Course
    // กรองตามวันที่เรียนจริง (sessionDate) — ผลลัพธ์ดิบเอาไปสรุปเป็นรายนักเรียน/คอร์สต่อที่ service layer
    @Query("SELECT a FROM ClassAttendance a " +
            "WHERE a.sessionDate >= COALESCE(:dateFrom, a.sessionDate) " +
            "AND a.sessionDate <= COALESCE(:dateTo, a.sessionDate) " +
            "AND a.course.id = COALESCE(:courseId, a.course.id) " +
            "AND a.student.id = COALESCE(:studentId, a.student.id) " +
            "ORDER BY a.sessionDate ASC")
    List<ClassAttendance> searchForReport(@Param("dateFrom") LocalDate dateFrom,
                                           @Param("dateTo") LocalDate dateTo,
                                           @Param("courseId") Long courseId,
                                           @Param("studentId") Long studentId);
}
