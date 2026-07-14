package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
