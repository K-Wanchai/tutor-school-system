package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.StudentCodeCounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StudentCodeCounterRepository extends JpaRepository<StudentCodeCounter, Integer> {

    @Query(value = "INSERT INTO student_code_counters (year_be, last_number) VALUES (:yearBe, 1) " +
                    "ON CONFLICT (year_be) DO UPDATE SET last_number = student_code_counters.last_number + 1 " +
                    "RETURNING last_number", nativeQuery = true)
    Integer incrementAndGet(@Param("yearBe") int yearBe);
}
