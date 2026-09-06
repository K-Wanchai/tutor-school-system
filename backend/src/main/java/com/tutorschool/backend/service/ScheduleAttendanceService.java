package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.SaveScheduleAttendanceRequest;
import com.tutorschool.backend.dto.response.ScheduleAttendanceResponse;

import java.util.List;

public interface ScheduleAttendanceService {

    List<ScheduleAttendanceResponse> getCourseAttendance(Long courseId, String tutorEmail);

    ScheduleAttendanceResponse saveAttendance(SaveScheduleAttendanceRequest request, String tutorEmail);

    void deleteAttendance(Long scheduleId, Long studentId, String tutorEmail);
}
