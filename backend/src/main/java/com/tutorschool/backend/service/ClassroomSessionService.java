package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CreateClassroomSessionRequest;
import com.tutorschool.backend.dto.request.JoinClassroomSessionRequest;
import com.tutorschool.backend.dto.request.LeaveClassroomSessionRequest;
import com.tutorschool.backend.dto.response.AttendanceRecordResponse;
import com.tutorschool.backend.dto.response.ClassroomSessionResponse;
import com.tutorschool.backend.dto.response.JoinClassroomSessionResponse;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface ClassroomSessionService {

    ClassroomSessionResponse createSession(CreateClassroomSessionRequest request, Authentication auth);

    List<ClassroomSessionResponse> getAllSessions();

    List<ClassroomSessionResponse> getMySessionsAsTutor(Authentication auth);

    ClassroomSessionResponse getSessionById(Long id);

    List<ClassroomSessionResponse> getSessionsByCourseId(Long courseId);

    ClassroomSessionResponse openSession(Long id, Authentication auth);

    ClassroomSessionResponse closeSession(Long id, Authentication auth);

    void deleteSession(Long id, Authentication auth);

    JoinClassroomSessionResponse joinSession(Long sessionId, JoinClassroomSessionRequest request, Authentication auth);

    AttendanceRecordResponse leaveSession(Long sessionId, LeaveClassroomSessionRequest request, Authentication auth);
}
