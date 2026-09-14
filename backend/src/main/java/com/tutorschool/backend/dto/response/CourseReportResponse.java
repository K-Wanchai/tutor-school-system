package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * รายงานข้อมูลคอร์สเรียน — กรองตามช่วงวันที่สร้างคอร์ส, คอร์สรายตัว
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseReportResponse {

    private long totalCount;

    private List<CourseResponse> items;
}
