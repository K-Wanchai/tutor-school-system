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

    // รายงานการเข้าเรียน — กรองแบบ nullable-param (พารามิเตอร์ไหนไม่ส่งมาก็ไม่ถูกใช้กรอง)
    @Query("SELECT a FROM AttendanceRecord a " +
            "WHERE (:dateFrom IS NULL OR a.checkInTime >= :dateFrom) " +
            "AND (:dateTo IS NULL OR a.checkInTime <= :dateTo) " +
            "AND (:courseId IS NULL OR a.course.id = :courseId) " +
            "AND (:studentId IS NULL OR a.student.id = :studentId) " +
            "AND (:status IS NULL OR a.status = :status) " +
            "ORDER BY a.checkInTime DESC")
    List<AttendanceRecord> searchForReport(@Param("dateFrom") LocalDateTime dateFrom,
                                            @Param("dateTo") LocalDateTime dateTo,
                                            @Param("courseId") Long courseId,
                                            @Param("studentId") Long studentId,
                                            @Param("status") AttendanceStatus status);
}
