package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.AttendanceAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttendanceAuditLogRepository extends JpaRepository<AttendanceAuditLog, Long> {

    List<AttendanceAuditLog> findByAttendanceRecordId(Long attendanceRecordId);
}
