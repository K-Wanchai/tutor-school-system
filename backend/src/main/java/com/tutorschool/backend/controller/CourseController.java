package com.tutorschool.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tutorschool.backend.dto.request.CreateCourseRequest;
import com.tutorschool.backend.dto.request.TutorCourseResponseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseRequest;
import com.tutorschool.backend.dto.request.UpdateCourseStatusRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.CourseResponse;
import com.tutorschool.backend.dto.response.PageResponse;
import com.tutorschool.backend.entity.User;
import com.tutorschool.backend.service.CourseService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getAllCourses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<CourseResponse> response = courseService.getAllCourses(page, size);
        return ResponseEntity.ok(ApiResponse.success("Courses retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(@PathVariable Long id) {
        CourseResponse response = courseService.getCourseById(id);
        return ResponseEntity.ok(ApiResponse.success("Course retrieved successfully", response));
    }

    @GetMapping("/code/{courseCode}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseByCode(@PathVariable String courseCode) {
        CourseResponse response = courseService.getCourseByCode(courseCode);
        return ResponseEntity.ok(ApiResponse.success("Course retrieved successfully", response));
    }

    @GetMapping("/tutor/{tutorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getCoursesByTutorId(@PathVariable Long tutorId) {
        List<CourseResponse> response = courseService.getCoursesByTutorId(tutorId);
        return ResponseEntity.ok(ApiResponse.success("Courses retrieved successfully", response));
    }

    @GetMapping("/my-courses")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getMyCourses(
            @AuthenticationPrincipal User currentUser) {
        List<CourseResponse> response = courseService.getCoursesByTutorUserId(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("My courses retrieved successfully", response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CreateCourseRequest request) {
        CourseResponse response = courseService.createCourse(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Course created successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCourseRequest request) {
        CourseResponse response = courseService.updateCourse(id, request);
        return ResponseEntity.ok(ApiResponse.success("Course updated successfully", response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourseStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCourseStatusRequest request) {
        CourseResponse response = courseService.updateCourseStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Course status updated successfully", response));
    }

    @PatchMapping("/{id}/tutor-response")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<ApiResponse<CourseResponse>> tutorRespondToCourse(
            @PathVariable Long id,
            @RequestBody TutorCourseResponseRequest request,
            @AuthenticationPrincipal User currentUser) {
        CourseResponse response = courseService.tutorRespondToCourse(id, request, currentUser.getId());
        String msg = request.isAccepted() ? "ตอบรับคอร์สสำเร็จ" : "ปฏิเสธคอร์สสำเร็จ";
        return ResponseEntity.ok(ApiResponse.success(msg, response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.success("Course deleted successfully"));
    }
}
