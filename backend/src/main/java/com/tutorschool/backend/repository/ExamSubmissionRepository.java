package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ExamSubmission;
import com.tutorschool.backend.entity.ExamSubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSubmissionRepository extends JpaRepository<ExamSubmission, Long> {

    List<ExamSubmission> findByStudentId(Long studentId);

    List<ExamSubmission> findByExamId(Long examId);

    List<ExamSubmission> findByExamIdAndStudentId(Long examId, Long studentId);

    long countByExamIdAndStudentId(Long examId, Long studentId);

    Optional<ExamSubmission> findBySubmissionCode(String submissionCode);

    boolean existsByExamIdAndStudentIdAndStatus(Long examId, Long studentId, ExamSubmissionStatus status);

    List<ExamSubmission> findByEnrollmentId(Long enrollmentId);

    // traverse: ExamSubmission → exam → course
    List<ExamSubmission> findByExamCourseId(Long courseId);

    // รายงานผลสอบ/ผลงานติวเตอร์ — กรองแบบ nullable-param เฉพาะฉบับที่ส่งแล้ว (มี submittedAt)
    // เพราะฉบับที่ยัง IN_PROGRESS ยังไม่มีคะแนนที่เป็นผลสรุปให้นับ
    @Query("SELECT s FROM ExamSubmission s " +
            "WHERE s.submittedAt IS NOT NULL " +
            "AND (:dateFrom IS NULL OR s.submittedAt >= :dateFrom) " +
            "AND (:dateTo IS NULL OR s.submittedAt <= :dateTo) " +
            "AND (:courseId IS NULL OR s.exam.course.id = :courseId) " +
            "AND (:tutorId IS NULL OR s.exam.course.tutor.id = :tutorId) " +
            "ORDER BY s.submittedAt DESC")
    List<ExamSubmission> searchForReport(@Param("dateFrom") LocalDateTime dateFrom,
                                          @Param("dateTo") LocalDateTime dateTo,
                                          @Param("courseId") Long courseId,
                                          @Param("tutorId") Long tutorId);
}
