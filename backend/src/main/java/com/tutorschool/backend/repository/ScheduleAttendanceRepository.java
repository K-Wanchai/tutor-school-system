package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ScheduleAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScheduleAttendanceRepository extends JpaRepository<ScheduleAttendance, Long> {

    // traverse: ScheduleAttendance → schedule → course
    List<ScheduleAttendance> findByScheduleCourseId(Long courseId);

    Optional<ScheduleAttendance> findByScheduleIdAndStudentId(Long scheduleId, Long studentId);
}
