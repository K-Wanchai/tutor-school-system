package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.Exam;
import com.tutorschool.backend.entity.ExamStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    List<Exam> findByCourseId(Long courseId);

    boolean existsByCourseId(Long courseId);

    List<Exam> findByCourseIdAndStatus(Long courseId, ExamStatus status);

    List<Exam> findByLessonId(Long lessonId);

    List<Exam> findByTutorId(Long tutorId);

    Optional<Exam> findByExamCode(String examCode);

    boolean existsByExamCode(String examCode);

    List<Exam> findByCourseIdIn(List<Long> courseIds);

    // ใช้โดย ExamScheduler — หา DRAFT ที่ถึงเวลาเปิดแล้ว / OPEN ที่ถึงเวลาปิดแล้ว
    List<Exam> findByStatusAndStartTimeLessThanEqual(ExamStatus status, LocalDateTime time);

    List<Exam> findByStatusAndEndTimeLessThanEqual(ExamStatus status, LocalDateTime time);
}
