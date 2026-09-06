package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.SaveClassAttendanceRequest;
import com.tutorschool.backend.dto.response.ClassAttendanceResponse;

import java.time.LocalDate;
import java.util.List;

public interface ClassAttendanceService {

    List<ClassAttendanceResponse> getCourseAttendance(Long courseId, String tutorEmail);

    ClassAttendanceResponse saveAttendance(SaveClassAttendanceRequest request, String tutorEmail);

    void deleteAttendance(Long courseId, Long studentId, LocalDate sessionDate, String tutorEmail);
}
