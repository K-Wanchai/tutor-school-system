package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.CancelCourseScheduleRequest;
import com.tutorschool.backend.dto.request.CreateCourseScheduleRequest;
import com.tutorschool.backend.dto.request.UpdateCourseScheduleRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.CourseScheduleResponse;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.service.CourseScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/course-schedules")
@RequiredArgsConstructor
public class CourseScheduleController {

    private final CourseScheduleService courseScheduleService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<CourseScheduleResponse>> createSchedule(
            @Valid @RequestBody CreateCourseScheduleRequest request,
            @AuthenticationPrincipal User currentUser) {
        CourseScheduleResponse response = courseScheduleService.createSchedule(request, currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Course schedule created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<CourseScheduleResponse>>> getAllSchedules() {
        List<CourseScheduleResponse> schedules = courseScheduleService.getAllSchedules();
        return ResponseEntity.ok(ApiResponse.success("Schedules retrieved successfully", schedules));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<CourseScheduleResponse>> getScheduleById(@PathVariable Long id) {
        CourseScheduleResponse response = courseScheduleService.getScheduleById(id);
        return ResponseEntity.ok(ApiResponse.success("Schedule retrieved successfully", response));
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<CourseScheduleResponse>>> getSchedulesByCourse(
            @PathVariable Long courseId) {
        List<CourseScheduleResponse> schedules = courseScheduleService.getSchedulesByCourseId(courseId);
        return ResponseEntity.ok(ApiResponse.success("Schedules retrieved successfully", schedules));
    }

    @GetMapping("/student/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<CourseScheduleResponse>>> getMySchedulesAsStudent(
            @AuthenticationPrincipal User currentUser) {
        List<CourseScheduleResponse> schedules = courseScheduleService.getMySchedulesAsStudent(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("My schedules retrieved successfully", schedules));
    }

    @GetMapping("/tutor/me")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<ApiResponse<List<CourseScheduleResponse>>> getMySchedulesAsTeacher(
            @AuthenticationPrincipal User currentUser) {
        List<CourseScheduleResponse> schedules = courseScheduleService.getMySchedulesAsTeacher(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("My schedules retrieved successfully", schedules));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<CourseScheduleResponse>> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCourseScheduleRequest request,
            @AuthenticationPrincipal User currentUser) {
        CourseScheduleResponse response = courseScheduleService.updateSchedule(id, request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Schedule updated successfully", response));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<CourseScheduleResponse>> cancelSchedule(
            @PathVariable Long id,
            @Valid @RequestBody CancelCourseScheduleRequest request,
            @AuthenticationPrincipal User currentUser) {
        CourseScheduleResponse response = courseScheduleService.cancelSchedule(id, request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Schedule cancelled successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        courseScheduleService.deleteSchedule(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Schedule deleted successfully", null));
    }
}

