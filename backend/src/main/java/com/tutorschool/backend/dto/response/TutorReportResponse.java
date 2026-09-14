package com.tutorschool.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * รายงานข้อมูลติวเตอร์ — กรองตามช่วงวันที่สมัคร, ติวเตอร์รายคน
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TutorReportResponse {

    private long totalCount;

    private List<TutorResponse> items;
}
