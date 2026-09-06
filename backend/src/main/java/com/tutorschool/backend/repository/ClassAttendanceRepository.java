package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ClassAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClassAttendanceRepository extends JpaRepository<ClassAttendance, Long> {

    List<ClassAttendance> findByCourseId(Long courseId);

    Optional<ClassAttendance> findByCourseIdAndStudentIdAndSessionDate(Long courseId, Long studentId, LocalDate sessionDate);
}
