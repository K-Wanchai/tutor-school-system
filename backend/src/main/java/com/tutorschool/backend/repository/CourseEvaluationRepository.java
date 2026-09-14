package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.CourseEvaluation;
import com.tutorschool.backend.entity.EvaluationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CourseEvaluationRepository extends JpaRepository<CourseEvaluation, Long> {

    List<CourseEvaluation> findByCourseId(Long courseId);

    boolean existsByCourseId(Long courseId);

    List<CourseEvaluation> findByTutorId(Long tutorId);

    List<CourseEvaluation> findByStudentId(Long studentId);

    Optional<CourseEvaluation> findByStudentIdAndCourseId(Long studentId, Long courseId);

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    boolean existsByEnrollmentId(Long enrollmentId);

    List<CourseEvaluation> findByCourseIdAndStatus(Long courseId, EvaluationStatus status);

    @Query("SELECT AVG(e.rating) FROM CourseEvaluation e WHERE e.course.id = :courseId AND e.status = 'PUBLISHED'")
    Double findAverageRatingByCourseId(@Param("courseId") Long courseId);

    long countByCourseIdAndStatus(Long courseId, EvaluationStatus status);

    void deleteByCourseId(Long courseId);

    @Query("SELECT DISTINCT e.course.id FROM CourseEvaluation e")
    List<Long> findDistinctCourseIds();

    // รายงานข้อมูลประเมินความพึงพอใจ — กรองแบบ nullable-param เหมือน searchForReport ของ Student/Tutor/Course
    // กรองตามวันที่ส่งประเมิน (submittedAt) — นับทุกสถานะ (ไม่กรองเฉพาะ PUBLISHED) เพื่อให้แอดมินเห็นภาพรวมจริง
    @Query("SELECT e FROM CourseEvaluation e " +
            "WHERE e.submittedAt >= COALESCE(:dateFrom, e.submittedAt) " +
            "AND e.submittedAt <= COALESCE(:dateTo, e.submittedAt) " +
            "AND e.course.id = COALESCE(:courseId, e.course.id) " +
            "ORDER BY e.submittedAt ASC")
    List<CourseEvaluation> searchForReport(@Param("dateFrom") LocalDateTime dateFrom,
                                            @Param("dateTo") LocalDateTime dateTo,
                                            @Param("courseId") Long courseId);
}
