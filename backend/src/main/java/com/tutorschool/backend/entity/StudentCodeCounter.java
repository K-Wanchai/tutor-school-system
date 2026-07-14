package com.tutorschool.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "student_code_counters")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentCodeCounter {

    @Id
    @Column(name = "year_be")
    private Integer yearBe;

    @Column(name = "last_number", nullable = false)
    private Integer lastNumber;
}
