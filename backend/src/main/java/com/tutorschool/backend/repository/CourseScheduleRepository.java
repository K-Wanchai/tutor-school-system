package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.CourseSchedule;
import com.tutorschool.backend.entity.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseScheduleRepository extends JpaRepository<CourseSchedule, Long> {

    boolean existsByScheduleCode(String scheduleCode);

    Optional<CourseSchedule> findByScheduleCode(String scheduleCode);

    List<CourseSchedule> findByCourseIdOrderByScheduleDateAscStartTimeAsc(Long courseId);

    boolean existsByCourseId(Long courseId);

    List<CourseSchedule> findByTutorIdOrderByScheduleDateAscStartTimeAsc(Long tutorId);

    List<CourseSchedule> findByCourseIdAndStatus(Long courseId, ScheduleStatus status);

    void deleteByCourseId(Long courseId);

    // ดึง busy slots ของ Tutor ในวันที่ระบุ (ยกเว้น CANCELLED)
    @Query("""
            SELECT cs FROM CourseSchedule cs
            WHERE cs.tutor.id = :tutorId
              AND cs.scheduleDate = :date
              AND cs.status != 'CANCELLED'
            ORDER BY cs.startTime ASC
            """)
    List<CourseSchedule> findBusySlotsByTutorAndDate(
            @Param("tutorId") Long tutorId,
            @Param("date") LocalDate date
    );

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
