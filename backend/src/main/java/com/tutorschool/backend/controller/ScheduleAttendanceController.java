package com.tutorschool.backend.controller;

import com.tutorschool.backend.dto.request.SaveScheduleAttendanceRequest;
import com.tutorschool.backend.dto.response.ApiResponse;
import com.tutorschool.backend.dto.response.ScheduleAttendanceResponse;
import com.tutorschool.backend.service.ScheduleAttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * การเข้าเรียนที่ติวเตอร์บันทึกเองอิงตามคาบเรียนจริงในตารางสอน — ใช้ในหน้า "การเข้าเรียน" ฝั่งติวเตอร์
 */
@RestController
@RequestMapping("/api/v1/schedule-attendance")
@RequiredArgsConstructor
public class ScheduleAttendanceController {

    private final ScheduleAttendanceService scheduleAttendanceService;

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ScheduleAttendanceResponse>>> getCourseAttendance(
            @PathVariable Long courseId,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Attendance retrieved",
                scheduleAttendanceService.getCourseAttendance(courseId, principal.getName())));
    }

    @PutMapping
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ScheduleAttendanceResponse>> saveAttendance(
            @Valid @RequestBody SaveScheduleAttendanceRequest request,
            Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("Attendance saved",
                scheduleAttendanceService.saveAttendance(request, principal.getName())));
    }

    @DeleteMapping("/schedule/{scheduleId}/student/{studentId}")
    @PreAuthorize("hasRole('TUTOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAttendance(
            @PathVariable Long scheduleId,
            @PathVariable Long studentId,
            Principal principal) {
        scheduleAttendanceService.deleteAttendance(scheduleId, studentId, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Attendance deleted"));
    }
}
