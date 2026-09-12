package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.ExamResponse;
import com.tutorschool.backend.entity.Exam;
import org.springframework.stereotype.Component;

@Component
public class ExamMapper {

    public ExamResponse toResponse(Exam exam) {
        return ExamResponse.builder()
                .id(exam.getId())
                .examCode(exam.getExamCode())
                .courseId(exam.getCourse().getId())
                .courseName(exam.getCourse().getCourseName())
                .courseCode(exam.getCourse().getCourseCode())
                .tutorId(exam.getTutor().getId())
                .teacherName(exam.getTutor().getFirstName() + " " + exam.getTutor().getLastName())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .examLink(exam.getExamLink())
                .totalScore(exam.getTotalScore())
                .startTime(exam.getStartTime())
                .endTime(exam.getEndTime())
                .durationMinutes(exam.getDurationMinutes())
                .allowMultipleAttempts(exam.isAllowMultipleAttempts())
                .maxAttempts(exam.getMaxAttempts())
                .shuffleQuestions(exam.isShuffleQuestions())
                .showScoreAfterSubmit(exam.isShowScoreAfterSubmit())
                .showCorrectAnswersAfterSubmit(exam.isShowCorrectAnswersAfterSubmit())
                .status(exam.getStatus())
                .createdAt(exam.getCreatedAt())
                .updatedAt(exam.getUpdatedAt())
                .build();
    }

    // สำหรับหน้า "ตารางสอบ" (ทั้งฝั่งนักเรียนและติวเตอร์) — แสดงแค่ วัน/เวลา/สถานะ ไม่ส่งเนื้อหาข้อสอบ/เฉลยมาด้วย
    public ExamResponse toScheduleResponse(Exam exam) {
        return ExamResponse.builder()
                .id(exam.getId())
                .examCode(exam.getExamCode())
                .courseId(exam.getCourse().getId())
                .courseName(exam.getCourse().getCourseName())
                .courseCode(exam.getCourse().getCourseCode())
                .tutorId(exam.getTutor().getId())
                .teacherName(exam.getTutor().getFirstName() + " " + exam.getTutor().getLastName())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .examLink(exam.getExamLink())
                .totalScore(exam.getTotalScore())
                .startTime(exam.getStartTime())
                .endTime(exam.getEndTime())
                .durationMinutes(exam.getDurationMinutes())
                .status(exam.getStatus())
                .createdAt(exam.getCreatedAt())
                .updatedAt(exam.getUpdatedAt())
                .build();
    }
}
