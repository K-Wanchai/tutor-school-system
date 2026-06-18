package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.CourseEvaluationResponse;
import com.tutorschool.backend.entity.CourseEvaluation;
import com.tutorschool.backend.entity.Tutor;
import org.springframework.stereotype.Component;

@Component
public class CourseEvaluationMapper {

    public CourseEvaluationResponse toResponse(CourseEvaluation evaluation) {
        boolean anonymous = Boolean.TRUE.equals(evaluation.getIsAnonymous());

        String studentName = anonymous ? "Anonymous" : evaluation.getStudent().getFullName();
        Long studentId = anonymous ? null : evaluation.getStudent().getId();

        Tutor Tutor = evaluation.getTutor();
        String teacherName = Tutor.getFirstName() + " " + Tutor.getLastName();

        return CourseEvaluationResponse.builder()
                .id(evaluation.getId())
                .evaluationCode(evaluation.getEvaluationCode())
                .studentName(studentName)
                .studentId(studentId)
                .courseId(evaluation.getCourse().getId())
                .courseName(evaluation.getCourse().getCourseName())
                .enrollmentId(evaluation.getEnrollment().getId())
                .tutorId(Tutor.getId())
                .teacherName(teacherName)
                .rating(evaluation.getRating())
                .teachingScore(evaluation.getTeachingScore())
                .contentScore(evaluation.getContentScore())
                .materialScore(evaluation.getMaterialScore())
                .communicationScore(evaluation.getCommunicationScore())
                .valueScore(evaluation.getValueScore())
                .comment(evaluation.getComment())
                .suggestion(evaluation.getSuggestion())
                .isAnonymous(evaluation.getIsAnonymous())
                .status(evaluation.getStatus())
                .submittedAt(evaluation.getSubmittedAt())
                .createdAt(evaluation.getCreatedAt())
                .updatedAt(evaluation.getUpdatedAt())
                .build();
    }

    // สำหรับ Tutor — ซ่อน studentId เสมอถ้า anonymous
    public CourseEvaluationResponse toResponseForTeacher(CourseEvaluation evaluation) {
        return toResponse(evaluation);
    }

    // สำหรับ Admin — เห็นข้อมูล student เสมอ
    public CourseEvaluationResponse toResponseForAdmin(CourseEvaluation evaluation) {
        Tutor Tutor = evaluation.getTutor();
        String teacherName = Tutor.getFirstName() + " " + Tutor.getLastName();

        return CourseEvaluationResponse.builder()
                .id(evaluation.getId())
                .evaluationCode(evaluation.getEvaluationCode())
                .studentName(evaluation.getStudent().getFullName())
                .studentId(evaluation.getStudent().getId())
                .courseId(evaluation.getCourse().getId())
                .courseName(evaluation.getCourse().getCourseName())
                .enrollmentId(evaluation.getEnrollment().getId())
                .tutorId(Tutor.getId())
                .teacherName(teacherName)
                .rating(evaluation.getRating())
                .teachingScore(evaluation.getTeachingScore())
                .contentScore(evaluation.getContentScore())
                .materialScore(evaluation.getMaterialScore())
                .communicationScore(evaluation.getCommunicationScore())
                .valueScore(evaluation.getValueScore())
                .comment(evaluation.getComment())
                .suggestion(evaluation.getSuggestion())
                .isAnonymous(evaluation.getIsAnonymous())
                .status(evaluation.getStatus())
                .submittedAt(evaluation.getSubmittedAt())
                .createdAt(evaluation.getCreatedAt())
                .updatedAt(evaluation.getUpdatedAt())
                .build();
    }
}
