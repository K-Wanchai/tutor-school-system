package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.Exam;
import com.tutorschool.backend.entity.ExamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    List<Exam> findByCourseId(Long courseId);

    List<Exam> findByCourseIdAndStatus(Long courseId, ExamStatus status);

    List<Exam> findByLessonId(Long lessonId);

    List<Exam> findByTeacherId(Long teacherId);

    Optional<Exam> findByExamCode(String examCode);

    boolean existsByExamCode(String examCode);
}
