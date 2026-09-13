package com.tutorschool.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class ReorderEvaluationCriteriaRequest {

    // ลำดับ id ของหัวข้อทั้งหมด เรียงตามที่ต้องการแสดงผล (index แรก = display order น้อยที่สุด)
    @NotEmpty(message = "orderedIds must not be empty")
    private List<Long> orderedIds;
}
