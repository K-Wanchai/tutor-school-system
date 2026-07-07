package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ClassroomSession;
import com.tutorschool.backend.entity.ClassroomSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClassroomSessionRepository extends JpaRepository<ClassroomSession, Long> {

    Optional<ClassroomSession> findBySessionCode(String sessionCode);

    boolean existsBySessionCode(String sessionCode);

    List<ClassroomSession> findByCourseId(Long courseId);

    List<ClassroomSession> findByTutorId(Long tutorId);

    List<ClassroomSession> findByStatus(ClassroomSessionStatus status);

    void deleteByCourseId(Long courseId);

    // ดึง session ของ course ที่ student คนนี้ enrollment อยู่ (APPROVED/COMPLETED)
    @Query("""
            SELECT cs FROM ClassroomSession cs
            WHERE cs.course.id IN (
                SELECT e.course.id FROM Enrollment e
                WHERE e.student.id = :studentId
                AND e.status IN ('APPROVED', 'COMPLETED')
            )
            ORDER BY cs.startTime DESC
            """)
    List<ClassroomSession> findByStudentEnrollment(@Param("studentId") Long studentId);
}
