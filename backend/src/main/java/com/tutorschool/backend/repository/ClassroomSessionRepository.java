package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.ClassroomSession;
import com.tutorschool.backend.entity.ClassroomSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClassroomSessionRepository extends JpaRepository<ClassroomSession, Long> {

    Optional<ClassroomSession> findBySessionCode(String sessionCode);

    boolean existsBySessionCode(String sessionCode);

    List<ClassroomSession> findByCourseId(Long courseId);

    List<ClassroomSession> findByTutorId(Long tutorId);

    List<ClassroomSession> findByStatus(ClassroomSessionStatus status);
}
