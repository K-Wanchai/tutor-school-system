package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CancelCourseScheduleRequest;
import com.tutorschool.backend.dto.request.CreateCourseScheduleRequest;
import com.tutorschool.backend.dto.request.GenerateCourseScheduleRequest;
import com.tutorschool.backend.dto.request.UpdateCourseScheduleRequest;
import com.tutorschool.backend.dto.response.CourseScheduleResponse;
import com.tutorschool.backend.dto.response.TutorAvailabilityResponse;

import java.time.LocalDate;
import java.util.List;

public interface CourseScheduleService {

    CourseScheduleResponse createSchedule(CreateCourseScheduleRequest request, Long currentUserId);

    List<CourseScheduleResponse> generateSchedulesFromCoursePattern(
            Long courseId, GenerateCourseScheduleRequest request, Long currentUserId);

    List<CourseScheduleResponse> getAllSchedules();

    CourseScheduleResponse getScheduleById(Long id);

    List<CourseScheduleResponse> getSchedulesByCourseId(Long courseId);

    List<CourseScheduleResponse> getMySchedulesAsStudent(Long studentUserId);

    List<CourseScheduleResponse> getMySchedulesAsTeacher(Long teacherUserId);

    CourseScheduleResponse updateSchedule(Long id, UpdateCourseScheduleRequest request, Long currentUserId);

    CourseScheduleResponse cancelSchedule(Long id, CancelCourseScheduleRequest request, Long currentUserId);

    void deleteSchedule(Long id, Long currentUserId);

    TutorAvailabilityResponse getTutorAvailability(Long tutorId, LocalDate date);
}
