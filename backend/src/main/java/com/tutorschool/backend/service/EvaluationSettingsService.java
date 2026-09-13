package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.UpdateEvaluationSettingsRequest;
import com.tutorschool.backend.dto.response.EvaluationSettingsResponse;

public interface EvaluationSettingsService {

    EvaluationSettingsResponse getEvaluationSettings();

    EvaluationSettingsResponse updateEvaluationSettings(UpdateEvaluationSettingsRequest request);
}
