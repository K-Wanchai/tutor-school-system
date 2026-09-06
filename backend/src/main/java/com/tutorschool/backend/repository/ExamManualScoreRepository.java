package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ExamManualScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamManualScoreRepository extends JpaRepository<ExamManualScore, Long> {

    // traverse: ExamManualScore → exam → course
    List<ExamManualScore> findByExamCourseId(Long courseId);

    Optional<ExamManualScore> findByExamIdAndStudentId(Long examId, Long studentId);

    void deleteByExamIdAndStudentId(Long examId, Long studentId);
}
