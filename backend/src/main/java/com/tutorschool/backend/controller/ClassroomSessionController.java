package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.CreateClassroomSessionRequest;
import com.tutorschool.backend.dto.request.JoinClassroomSessionRequest;
import com.tutorschool.backend.dto.request.LeaveClassroomSessionRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.AttendanceRecordResponse;
import com.tutorschool.backend.dto.response.ClassroomSessionResponse;
import com.tutorschool.backend.dto.response.JoinClassroomSessionResponse;
import com.tutorschool.backend.service.ClassroomSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/classroom-sessions")
@RequiredArgsConstructor
public class ClassroomSessionController {

    private final ClassroomSessionService classroomSessionService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<ClassroomSessionResponse>> createSession(
            @Valid @RequestBody CreateClassroomSessionRequest request,
            Authentication auth) {
        ClassroomSessionResponse response = classroomSessionService.createSession(request, auth);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Classroom session created successfully", response));
    }

    @GetMapping("/tutor/me")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<ApiResponse<List<ClassroomSessionResponse>>> getMySessionsAsTutor(Authentication auth) {
        List<ClassroomSessionResponse> response = classroomSessionService.getMySessionsAsTutor(auth);
        return ResponseEntity.ok(ApiResponse.success("Classroom sessions retrieved successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ClassroomSessionResponse>>> getAllSessions() {
        List<ClassroomSessionResponse> response = classroomSessionService.getAllSessions();
        return ResponseEntity.ok(ApiResponse.success("Classroom sessions retrieved successfully", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<ClassroomSessionResponse>> getSessionById(@PathVariable Long id) {
        ClassroomSessionResponse response = classroomSessionService.getSessionById(id);
        return ResponseEntity.ok(ApiResponse.success("Classroom session retrieved successfully", response));
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<ClassroomSessionResponse>>> getSessionsByCourseId(
            @PathVariable Long courseId) {
        List<ClassroomSessionResponse> response = classroomSessionService.getSessionsByCourseId(courseId);
        return ResponseEntity.ok(ApiResponse.success("Classroom sessions retrieved successfully", response));
    }

    @PatchMapping("/{id}/open")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<ClassroomSessionResponse>> openSession(
            @PathVariable Long id,
            Authentication auth) {
        ClassroomSessionResponse response = classroomSessionService.openSession(id, auth);
        return ResponseEntity.ok(ApiResponse.success("Classroom session opened successfully", response));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<ClassroomSessionResponse>> closeSession(
            @PathVariable Long id,
            Authentication auth) {
        ClassroomSessionResponse response = classroomSessionService.closeSession(id, auth);
        return ResponseEntity.ok(ApiResponse.success("Classroom session closed successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable Long id,
            Authentication auth) {
        classroomSessionService.deleteSession(id, auth);
        return ResponseEntity.ok(ApiResponse.success("Classroom session deleted successfully"));
    }

    @PostMapping("/{id}/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<JoinClassroomSessionResponse>> joinSession(
            @PathVariable Long id,
            @Valid @RequestBody JoinClassroomSessionRequest request,
            Authentication auth) {
        JoinClassroomSessionResponse response = classroomSessionService.joinSession(id, request, auth);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @PatchMapping("/{id}/leave")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<AttendanceRecordResponse>> leaveSession(
            @PathVariable Long id,
            @RequestBody(required = false) LeaveClassroomSessionRequest request,
            Authentication auth) {
        LeaveClassroomSessionRequest req = request != null ? request : new LeaveClassroomSessionRequest();
        AttendanceRecordResponse response = classroomSessionService.leaveSession(id, req, auth);
        return ResponseEntity.ok(ApiResponse.success("Left classroom session successfully", response));
    }
}
