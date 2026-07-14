package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.SaveAdmissionRoundRequest;
import com.tutorschool.backend.dto.response.AdmissionRoundResponse;

import java.util.List;

public interface AdmissionRoundService {

    List<AdmissionRoundResponse> getRounds(Long institutionId);

    AdmissionRoundResponse createRound(Long institutionId, SaveAdmissionRoundRequest request);

    AdmissionRoundResponse updateRound(Long institutionId, Long roundId, SaveAdmissionRoundRequest request);

    void deleteRound(Long institutionId, Long roundId);
}
