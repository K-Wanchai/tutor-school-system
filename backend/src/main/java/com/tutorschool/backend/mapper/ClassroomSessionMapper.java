package com.tutorschool.backend.mapper;

import com.tutorschool.backend.dto.response.ClassroomSessionResponse;
import com.tutorschool.backend.entity.ClassroomSession;
import org.springframework.stereotype.Component;

@Component
public class ClassroomSessionMapper {

    public ClassroomSessionResponse toResponse(ClassroomSession session) {
        String teacherName = session.getTeacher().getFirstName() + " " + session.getTeacher().getLastName();

        Long lessonId = session.getLesson() != null ? session.getLesson().getId() : null;
        String lessonTitle = session.getLesson() != null ? session.getLesson().getLessonTitle() : null;

        return ClassroomSessionResponse.builder()
                .id(session.getId())
                .sessionCode(session.getSessionCode())
                .courseId(session.getCourse().getId())
                .courseName(session.getCourse().getCourseName())
                .lessonId(lessonId)
                .lessonTitle(lessonTitle)
                .teacherId(session.getTeacher().getId())
                .teacherName(teacherName)
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .lateThresholdMinutes(session.getLateThresholdMinutes())
                .joinCode(session.getJoinCode())
                .isCameraRequired(session.getIsCameraRequired())
                .status(session.getStatus())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }
}
