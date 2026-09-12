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
    // เพราะฉบับที่ยัง IN_PROGRESS ยังไม่มีคะแนนที่เป็นผลสรุปให้นับ — ใช้ COALESCE(:param, field) แทน
    // "(:param IS NULL OR field = :param)" เพราะแบบหลัง PostgreSQL หาชนิดข้อมูลของพารามิเตอร์ที่เป็น
    // null ไม่ได้ (error 42P18) เมื่อไม่ส่ง filter มาเลย
    @Query("SELECT s FROM ExamSubmission s " +
            "WHERE s.submittedAt IS NOT NULL " +
            "AND s.submittedAt >= COALESCE(:dateFrom, s.submittedAt) " +
            "AND s.submittedAt <= COALESCE(:dateTo, s.submittedAt) " +
            "AND s.exam.course.id = COALESCE(:courseId, s.exam.course.id) " +
            "AND s.exam.course.tutor.id = COALESCE(:tutorId, s.exam.course.tutor.id) " +
            "ORDER BY s.submittedAt DESC")
    List<ExamSubmission> searchForReport(@Param("dateFrom") LocalDateTime dateFrom,
                                          @Param("dateTo") LocalDateTime dateTo,
                                          @Param("courseId") Long courseId,
                                          @Param("tutorId") Long tutorId);
}
