package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.UpdateAttendanceStatusRequest;
import com.tutorschool.backend.dto.response.AttendanceRecordResponse;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface AttendanceService {

    List<AttendanceRecordResponse> getAllAttendanceRecords();

    AttendanceRecordResponse getAttendanceRecordById(Long id, Authentication auth);

    List<AttendanceRecordResponse> getAttendanceRecordsBySessionId(Long sessionId, Authentication auth);

    List<AttendanceRecordResponse> getAttendanceRecordsByCourseId(Long courseId, Authentication auth);

    List<AttendanceRecordResponse> getMyAttendanceRecords(Authentication auth);

    AttendanceRecordResponse updateAttendanceStatus(Long id, UpdateAttendanceStatusRequest request, Authentication auth);
}
