package com.tutorschool.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Builder
public class TutorAvailabilityResponse {

    private Long tutorId;
    private LocalDate date;
    private List<TimeSlot> busySlots;
    private List<TimeSlot> freeSlots;

    @Getter
    @Builder
    public static class TimeSlot {
        private LocalTime startTime;
        private LocalTime endTime;
        // null สำหรับ freeSlots
        private String courseTitle;
        private String scheduleCode;
    }
}
