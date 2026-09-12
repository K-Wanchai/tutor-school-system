package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.AttendanceRecord;
import com.tutorschool.backend.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    Optional<AttendanceRecord> findByAttendanceCode(String attendanceCode);

    List<AttendanceRecord> findBySessionId(Long sessionId);

    List<AttendanceRecord> findByCourseId(Long courseId);

    boolean existsByCourseId(Long courseId);

    List<AttendanceRecord> findByStudentId(Long studentId);

    Optional<AttendanceRecord> findByStudentIdAndSessionId(Long studentId, Long sessionId);

    boolean existsByStudentIdAndSessionId(Long studentId, Long sessionId);

    void deleteByCourseId(Long courseId);

    // รายงานการเข้าเรียน — กรองแบบ nullable-param (พารามิเตอร์ไหนไม่ส่งมาก็ไม่ถูกใช้กรอง) — ใช้
    // COALESCE(:param, field) แทน "(:param IS NULL OR field = :param)" เพราะแบบหลัง PostgreSQL
    // หาชนิดข้อมูลของพารามิเตอร์ที่เป็น null ไม่ได้ (error 42P18) เมื่อไม่ส่ง filter มาเลย
    @Query("SELECT a FROM AttendanceRecord a " +
            "WHERE a.checkInTime >= COALESCE(:dateFrom, a.checkInTime) " +
            "AND a.checkInTime <= COALESCE(:dateTo, a.checkInTime) " +
            "AND a.course.id = COALESCE(:courseId, a.course.id) " +
            "AND a.student.id = COALESCE(:studentId, a.student.id) " +
            "AND a.status = COALESCE(:status, a.status) " +
            "ORDER BY a.checkInTime DESC")
    List<AttendanceRecord> searchForReport(@Param("dateFrom") LocalDateTime dateFrom,
                                            @Param("dateTo") LocalDateTime dateTo,
                                            @Param("courseId") Long courseId,
                                            @Param("studentId") Long studentId,
                                            @Param("status") AttendanceStatus status);
}
