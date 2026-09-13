package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.CreateEvaluationCriteriaRequest;
import com.tutorschool.backend.dto.request.ReorderEvaluationCriteriaRequest;
import com.tutorschool.backend.dto.request.UpdateEvaluationCriteriaRequest;
import com.tutorschool.backend.dto.response.EvaluationCriteriaResponse;

import java.util.List;

public interface EvaluationCriteriaService {

    // ทุกหัวข้อ เรียงตามลำดับ (สำหรับหน้าแอดมินจัดการ)
    List<EvaluationCriteriaResponse> getAllCriteria();

    // เฉพาะหัวข้อที่เปิดใช้งาน (สำหรับฟอร์มประเมินของนักเรียน)
    List<EvaluationCriteriaResponse> getActiveCriteria();

    EvaluationCriteriaResponse createCriteria(CreateEvaluationCriteriaRequest request);

    EvaluationCriteriaResponse updateCriteria(Long id, UpdateEvaluationCriteriaRequest request);

    void deleteCriteria(Long id);

    List<EvaluationCriteriaResponse> reorderCriteria(ReorderEvaluationCriteriaRequest request);
}
