package com.tutorschool.backend.util;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ตัวช่วยสร้างไฟล์ CSV แบบง่าย — ใช้สำหรับ export รายงานฝั่งแอดมิน
 * ใส่ UTF-8 BOM นำหน้าเสมอ เพื่อให้ Excel เปิดข้อความภาษาไทยได้ถูกต้อง ไม่เพี้ยนเป็นตัวอักษรมั่ว
 */
public final class CsvWriter {

    private CsvWriter() {
    }

    public static String write(List<String> headers, List<List<String>> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append('﻿');
        sb.append(toLine(headers));
        for (List<String> row : rows) {
            sb.append(toLine(row));
        }
        return sb.toString();
    }

    private static String toLine(List<String> cells) {
        return cells.stream().map(CsvWriter::escape).collect(Collectors.joining(",")) + "\r\n";
    }

    private static String escape(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
