package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.CreateEvaluationCriteriaRequest;
import com.tutorschool.backend.dto.request.ReorderEvaluationCriteriaRequest;
import com.tutorschool.backend.dto.request.UpdateEvaluationCriteriaRequest;
import com.tutorschool.backend.dto.response.EvaluationCriteriaResponse;
import com.tutorschool.backend.entity.EvaluationCriteria;
import com.tutorschool.backend.exception.ResourceInUseException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.EvaluationCriteriaMapper;
import com.tutorschool.backend.repository.EvaluationCriteriaRepository;
import com.tutorschool.backend.repository.EvaluationCriteriaScoreRepository;
import com.tutorschool.backend.service.EvaluationCriteriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EvaluationCriteriaServiceImpl implements EvaluationCriteriaService {

    private final EvaluationCriteriaRepository criteriaRepository;
    private final EvaluationCriteriaScoreRepository criteriaScoreRepository;
    private final EvaluationCriteriaMapper criteriaMapper;

    @Override
    @Transactional(readOnly = true)
    public List<EvaluationCriteriaResponse> getAllCriteria() {
        return criteriaRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(criteriaMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EvaluationCriteriaResponse> getActiveCriteria() {
        return criteriaRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(criteriaMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public EvaluationCriteriaResponse createCriteria(CreateEvaluationCriteriaRequest request) {
        int nextOrder = criteriaRepository.findTopByOrderByDisplayOrderDesc()
                .map(c -> c.getDisplayOrder() + 1)
                .orElse(1);

        EvaluationCriteria criteria = EvaluationCriteria.builder()
                .label(request.getLabel().trim())
                .displayOrder(nextOrder)
                .isActive(true)
                .build();

        return criteriaMapper.toResponse(criteriaRepository.save(criteria));
    }

    @Override
    @Transactional
    public EvaluationCriteriaResponse updateCriteria(Long id, UpdateEvaluationCriteriaRequest request) {
        EvaluationCriteria criteria = findById(id);
        criteria.setLabel(request.getLabel().trim());
        criteria.setIsActive(request.getIsActive());
        return criteriaMapper.toResponse(criteriaRepository.save(criteria));
    }

    @Override
    @Transactional
    public void deleteCriteria(Long id) {
        EvaluationCriteria criteria = findById(id);
        if (criteriaScoreRepository.existsByCriteriaId(id)) {
            throw new ResourceInUseException(
                    "ไม่สามารถลบหัวข้อ \"" + criteria.getLabel() + "\" ได้ เนื่องจากมีการประเมินที่ใช้หัวข้อนี้ไปแล้ว กรุณาปิดใช้งานแทน");
        }
        criteriaRepository.delete(criteria);
    }

    @Override
    @Transactional
    public List<EvaluationCriteriaResponse> reorderCriteria(ReorderEvaluationCriteriaRequest request) {
        List<EvaluationCriteria> all = criteriaRepository.findAllById(request.getOrderedIds());
        if (all.size() != request.getOrderedIds().size() || all.size() != criteriaRepository.count()) {
            throw new IllegalArgumentException("orderedIds must include every existing evaluation criteria exactly once");
        }

        Map<Long, EvaluationCriteria> byId = new HashMap<>();
        for (EvaluationCriteria criteria : all) {
            byId.put(criteria.getId(), criteria);
        }

        int order = 1;
        for (Long id : request.getOrderedIds()) {
            byId.get(id).setDisplayOrder(order++);
        }
        criteriaRepository.saveAll(all);

        return getAllCriteria();
    }

    private EvaluationCriteria findById(Long id) {
        return criteriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation criteria", id));
    }
}
