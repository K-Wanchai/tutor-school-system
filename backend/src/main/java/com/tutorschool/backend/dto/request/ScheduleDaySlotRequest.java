package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/** หนึ่งวันสอนในตารางสอนรายสัปดาห์ของคอร์ส — เช่น {dayOfWeek: "MON", startTime: "10:00", endTime: "12:00"} */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleDaySlotRequest {

    @NotBlank(message = "Day of week is required")
    private String dayOfWeek;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;
}
