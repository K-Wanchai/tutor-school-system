package com.tutorschool.backend.util;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.Map;

/**
 * Parses Course.scheduleDays, which packs per-day time ranges as
 * "MON:10:00-15:00,WED:15:00-19:00" (the admin UI always writes times here —
 * Course.scheduleStartTime/scheduleEndTime are legacy columns left null).
 * Legacy entries with no time range (bare "MON") are skipped since there's
 * nothing to compare/schedule against.
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
