package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * รายงานข้อมูลนักเรียน — กรองตามช่วงวันที่สมัคร, นักเรียนรายคน
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentReportResponse {

    private long totalCount;

    private List<StudentResponse> items;
}
