package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ExamManualScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamManualScoreRepository extends JpaRepository<ExamManualScore, Long> {

    // traverse: ExamManualScore → exam → course
    List<ExamManualScore> findByExamCourseId(Long courseId);

    List<ExamManualScore> findByStudentId(Long studentId);

    boolean existsByExamId(Long examId);

    Optional<ExamManualScore> findByExamIdAndStudentId(Long examId, Long studentId);

    void deleteByExamIdAndStudentId(Long examId, Long studentId);

    // รายงานข้อมูลผลการสอบ — กรองแบบ nullable-param เหมือน searchForReport ของ Student/Tutor/Course
    // กรองตามวันที่เริ่มสอบ (exam.startTime) — ลำดับจริงที่แสดงผล (กลุ่มตามคอร์สที่สอบจบก่อน แล้วเรียง
    // นักเรียนตามรหัส) คำนวณที่ service layer เพราะต้องหาว่าคอร์สไหน "จบก่อน" จากค่า MAX(endTime) ของ
    // ทุกข้อสอบในคอร์สนั้น ซึ่งทำใน JPQL ORDER BY ตรงๆ ไม่ได้ — query นี้แค่ดึงข้อมูลแบบมี order คร่าวๆ ไว้ก่อน
    @Query("SELECT s FROM ExamManualScore s " +
            "WHERE s.exam.startTime >= COALESCE(:dateFrom, s.exam.startTime) " +
            "AND s.exam.startTime <= COALESCE(:dateTo, s.exam.startTime) " +
            "AND s.exam.course.id = COALESCE(:courseId, s.exam.course.id) " +
            "AND s.student.id = COALESCE(:studentId, s.student.id) " +
            "ORDER BY s.id ASC")
    List<ExamManualScore> searchForReport(@Param("dateFrom") LocalDateTime dateFrom,
                                           @Param("dateTo") LocalDateTime dateTo,
                                           @Param("courseId") Long courseId,
                                           @Param("studentId") Long studentId);
}
