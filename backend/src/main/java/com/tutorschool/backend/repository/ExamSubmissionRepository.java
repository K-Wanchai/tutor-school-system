package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ExamSubmission;
import com.tutorschool.backend.entity.ExamSubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
