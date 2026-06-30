package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.CourseEvaluation;
import com.tutorschool.backend.entity.EvaluationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseEvaluationRepository extends JpaRepository<CourseEvaluation, Long> {

    List<CourseEvaluation> findByCourseId(Long courseId);

    List<CourseEvaluation> findByTutorId(Long tutorId);

    List<CourseEvaluation> findByStudentId(Long studentId);

    Optional<CourseEvaluation> findByStudentIdAndCourseId(Long studentId, Long courseId);

    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    boolean existsByEnrollmentId(Long enrollmentId);

    List<CourseEvaluation> findByCourseIdAndStatus(Long courseId, EvaluationStatus status);

    @Query("SELECT AVG(e.rating) FROM CourseEvaluation e WHERE e.course.id = :courseId AND e.status = 'PUBLISHED'")
    Double findAverageRatingByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT AVG(e.teachingScore) FROM CourseEvaluation e WHERE e.course.id = :courseId AND e.status = 'PUBLISHED'")
    Double findAverageTeachingScoreByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT AVG(e.contentScore) FROM CourseEvaluation e WHERE e.course.id = :courseId AND e.status = 'PUBLISHED'")
    Double findAverageContentScoreByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT AVG(e.materialScore) FROM CourseEvaluation e WHERE e.course.id = :courseId AND e.status = 'PUBLISHED'")
    Double findAverageMaterialScoreByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT AVG(e.communicationScore) FROM CourseEvaluation e WHERE e.course.id = :courseId AND e.status = 'PUBLISHED'")
    Double findAverageCommunicationScoreByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT AVG(e.valueScore) FROM CourseEvaluation e WHERE e.course.id = :courseId AND e.status = 'PUBLISHED'")
    Double findAverageValueScoreByCourseId(@Param("courseId") Long courseId);

    long countByCourseIdAndStatus(Long courseId, EvaluationStatus status);

    void deleteByCourseId(Long courseId);
}
