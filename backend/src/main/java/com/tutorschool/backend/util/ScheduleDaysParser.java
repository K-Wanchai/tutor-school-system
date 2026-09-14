package com.tutorschool.backend.util;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Parses InstitutionProfile.allowedTimeSlots, which packs per-day time ranges as
 * "MON:10:00-15:00,WED:15:00-19:00" — the one remaining place in the system that stores a
 * weekly pattern as a single string (course schedules were migrated off this format to the
 * normalized course_schedule_days table, see CourseScheduleDay).
 * Entries with no time range (bare "MON") are skipped since there's nothing to compare/schedule against.
 */
public final class ScheduleDaysParser {

    private ScheduleDaysParser() {
    }

    public static Map<String, LocalTime[]> parseSlots(String scheduleDays) {
        Map<String, LocalTime[]> slots = new HashMap<>();

        if (scheduleDays == null || scheduleDays.isBlank()) {
            return slots;
        }

        for (String part : scheduleDays.split(",")) {
            String trimmed = part.trim();
            if (trimmed.isEmpty()) {
                continue;
            }

            int colonIdx = trimmed.indexOf(':');
            if (colonIdx <= 0 || colonIdx >= trimmed.length() - 1) {
                continue;
            }

            String day = trimmed.substring(0, colonIdx).toUpperCase();
            String timeRange = trimmed.substring(colonIdx + 1);
            int dashIdx = timeRange.lastIndexOf('-');
            if (dashIdx <= 0) {
                continue;
            }

            try {
                LocalTime start = LocalTime.parse(timeRange.substring(0, dashIdx));
                LocalTime end = LocalTime.parse(timeRange.substring(dashIdx + 1));
                slots.put(day, new LocalTime[]{start, end});
            } catch (DateTimeParseException ex) {
                // malformed time value — skip this slot
            }
        }

        return slots;
    }

    // จำลองวันเรียนจริงของคอร์สทั้งหมด (คาบเรียนที่ตรงกับ pattern รายสัปดาห์) ไล่ไปทีละวันตั้งแต่วันเริ่มเรียน
    // จนสะสมชั่วโมงครบ totalHours — ใช้ร่วมกันทั้งหน้าตารางสอน (ClassAttendanceService) และตอนเช็คว่า
    // ปิดจบการสอนได้หรือยัง (CourseService) เพื่อให้จำนวนคาบเรียนที่ทั้งสองฝั่งอ้างอิงตรงกันเสมอ
    private static final int SESSION_SCAN_LIMIT_DAYS = 3650; // 10 ปี — กันลูปไม่รู้จบถ้า pattern ไม่ตรงวันไหนเลย

    public static List<LocalDate> computeSessionDates(LocalDate startDate, int totalHours, Map<String, LocalTime[]> daySlots) {
        List<LocalDate> dates = new ArrayList<>();
        if (startDate == null || daySlots.isEmpty()) {
            return dates;
        }

        LocalDate cursor = startDate;
        long targetMinutes = totalHours * 60L;
        long cumulativeMinutes = 0;
        int scanned = 0;

        while (cumulativeMinutes < targetMinutes && scanned < SESSION_SCAN_LIMIT_DAYS) {
            LocalTime[] slot = daySlots.get(toDayCode(cursor.getDayOfWeek()));
            if (slot != null) {
                dates.add(cursor);
                cumulativeMinutes += Duration.between(slot[0], slot[1]).toMinutes();
            }
            cursor = cursor.plusDays(1);
            scanned++;
        }

        return dates;
    }

    public static String toDayCode(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> "MON";
            case TUESDAY -> "TUE";
            case WEDNESDAY -> "WED";
            case THURSDAY -> "THU";
            case FRIDAY -> "FRI";
            case SATURDAY -> "SAT";
            case SUNDAY -> "SUN";
        };
    }
}
