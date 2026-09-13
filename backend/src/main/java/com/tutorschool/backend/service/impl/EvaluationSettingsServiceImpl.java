package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.UpdateEvaluationSettingsRequest;
import com.tutorschool.backend.dto.response.EvaluationSettingsResponse;
import com.tutorschool.backend.entity.EvaluationSettings;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.EvaluationSettingsMapper;
import com.tutorschool.backend.repository.EvaluationSettingsRepository;
import com.tutorschool.backend.service.EvaluationSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EvaluationSettingsServiceImpl implements EvaluationSettingsService {

    private final EvaluationSettingsRepository evaluationSettingsRepository;
    private final EvaluationSettingsMapper evaluationSettingsMapper;

    @Override
    @Transactional(readOnly = true)
    public EvaluationSettingsResponse getEvaluationSettings() {
        EvaluationSettings settings = evaluationSettingsRepository.findFirstBy()
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation settings have not been configured yet"));
        return evaluationSettingsMapper.toResponse(settings);
    }

    @Override
    @Transactional
    public EvaluationSettingsResponse updateEvaluationSettings(UpdateEvaluationSettingsRequest request) {
        EvaluationSettings settings = evaluationSettingsRepository.findFirstBy()
                .orElseThrow(() -> new ResourceNotFoundException("Evaluation settings have not been configured yet"));

        settings.setTeachingLabel(request.getTeachingLabel());
        settings.setContentLabel(request.getContentLabel());
        settings.setMaterialLabel(request.getMaterialLabel());
        settings.setCommunicationLabel(request.getCommunicationLabel());
        settings.setValueLabel(request.getValueLabel());

        return evaluationSettingsMapper.toResponse(evaluationSettingsRepository.save(settings));
    }
}
