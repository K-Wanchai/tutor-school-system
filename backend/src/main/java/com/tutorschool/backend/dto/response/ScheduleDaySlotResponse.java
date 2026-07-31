package com.tutorschool.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/** หนึ่งวันสอนในตารางสอนรายสัปดาห์ของคอร์ส — เช่น {dayOfWeek: "MON", startTime: "10:00", endTime: "12:00"} */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleDaySlotResponse {

    private String dayOfWeek;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;
}
