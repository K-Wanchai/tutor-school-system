package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.UpdateAttendanceStatusRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.AttendanceRecordResponse;
import com.tutorschool.backend.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/attendance-records")
@RequiredArgsConstructor
public class AttendanceRecordController {

    private final AttendanceService attendanceService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceRecordResponse>>> getAllAttendanceRecords() {
        List<AttendanceRecordResponse> response = attendanceService.getAllAttendanceRecords();
        return ResponseEntity.ok(ApiResponse.success("Attendance records retrieved successfully", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'Tutor', 'STUDENT')")
    public ResponseEntity<ApiResponse<AttendanceRecordResponse>> getAttendanceRecordById(
            @PathVariable Long id,
            Authentication auth) {
        AttendanceRecordResponse response = attendanceService.getAttendanceRecordById(id, auth);
        return ResponseEntity.ok(ApiResponse.success("Attendance record retrieved successfully", response));
    }

    @GetMapping("/session/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'Tutor')")
    public ResponseEntity<ApiResponse<List<AttendanceRecordResponse>>> getAttendanceRecordsBySessionId(
            @PathVariable Long sessionId,
            Authentication auth) {
        List<AttendanceRecordResponse> response = attendanceService.getAttendanceRecordsBySessionId(sessionId, auth);
        return ResponseEntity.ok(ApiResponse.success("Attendance records retrieved successfully", response));
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'Tutor')")
    public ResponseEntity<ApiResponse<List<AttendanceRecordResponse>>> getAttendanceRecordsByCourseId(
            @PathVariable Long courseId,
            Authentication auth) {
        List<AttendanceRecordResponse> response = attendanceService.getAttendanceRecordsByCourseId(courseId, auth);
        return ResponseEntity.ok(ApiResponse.success("Attendance records retrieved successfully", response));
    }

    @GetMapping("/student/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<AttendanceRecordResponse>>> getMyAttendanceRecords(Authentication auth) {
        List<AttendanceRecordResponse> response = attendanceService.getMyAttendanceRecords(auth);
        return ResponseEntity.ok(ApiResponse.success("Your attendance records retrieved successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<ApiResponse<AttendanceRecordResponse>> updateAttendanceStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAttendanceStatusRequest request,
            Authentication auth) {
        AttendanceRecordResponse response = attendanceService.updateAttendanceStatus(id, request, auth);
        return ResponseEntity.ok(ApiResponse.success("Attendance status updated successfully", response));
    }
}
