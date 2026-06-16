package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.CourseSchedule;
import com.tutorschool.backend.entity.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseScheduleRepository extends JpaRepository<CourseSchedule, Long> {

    boolean existsByScheduleCode(String scheduleCode);

    Optional<CourseSchedule> findByScheduleCode(String scheduleCode);

    List<CourseSchedule> findByCourseIdOrderByScheduleDateAscStartTimeAsc(Long courseId);

    List<CourseSchedule> findByTutorIdOrderByScheduleDateAscStartTimeAsc(Long tutorId);

    List<CourseSchedule> findByCourseIdAndStatus(Long courseId, ScheduleStatus status);

    // ดึง schedules ของ course ที่ student คนนี้ enrollment อยู่
    @Query("""
            SELECT cs FROM CourseSchedule cs
            WHERE cs.course.id IN (
                SELECT e.course.id FROM Enrollment e
                WHERE e.student.id = :studentId
                AND e.status IN ('APPROVED', 'COMPLETED')
            )
            ORDER BY cs.scheduleDate ASC, cs.startTime ASC
            """)
    List<CourseSchedule> findByStudentEnrollment(@Param("studentId") Long studentId);
}
