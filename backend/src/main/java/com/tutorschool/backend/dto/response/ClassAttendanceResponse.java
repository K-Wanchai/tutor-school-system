package com.tutorschool.backend.dto.response;

import com.tutorschool.backend.entity.AttendanceStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassAttendanceResponse {

    private Long id;
    private Long courseId;
    private Long studentId;
    private String studentName;
    private String studentCode;
    private LocalDate sessionDate;
    private AttendanceStatus status;
    private String note;
    private String recordedBy;
    private LocalDateTime updatedAt;
}
