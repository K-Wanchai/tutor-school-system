package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.UpdateInstitutionProfileRequest;
import com.tutorschool.backend.dto.response.InstitutionProfileResponse;
import com.tutorschool.backend.entity.InstitutionProfile;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.InstitutionProfileMapper;
import com.tutorschool.backend.repository.InstitutionProfileRepository;
import com.tutorschool.backend.service.InstitutionProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InstitutionProfileServiceImpl implements InstitutionProfileService {

    private final InstitutionProfileRepository institutionProfileRepository;
    private final InstitutionProfileMapper institutionProfileMapper;

    @Override
    @Transactional(readOnly = true)
    public InstitutionProfileResponse getInstitutionProfile() {
        InstitutionProfile profile = institutionProfileRepository.findFirstBy()
                .orElseThrow(() -> new ResourceNotFoundException("Institution profile has not been configured yet"));
        return institutionProfileMapper.toResponse(profile);
    }

    @Override
    @Transactional
    public InstitutionProfileResponse updateInstitutionProfile(UpdateInstitutionProfileRequest request) {
        InstitutionProfile profile = institutionProfileRepository.findFirstBy()
                .orElseThrow(() -> new ResourceNotFoundException("Institution profile has not been configured yet"));

        profile.setInstitutionName(request.getInstitutionName());
        profile.setAddress(request.getAddress());
        profile.setPhoneNumber(request.getPhoneNumber());
        profile.setEmail(request.getEmail());
        profile.setLogoUrl(request.getLogoUrl());
        profile.setBankName(request.getBankName());
        profile.setBankAccountName(request.getBankAccountName());
        profile.setBankAccountNumber(request.getBankAccountNumber());
        profile.setBankQrCode(request.getBankQrCode());
        profile.setPromptPayId(request.getPromptPayId());
        profile.setEnrollmentPaymentDeadlineMinutes(request.getEnrollmentPaymentDeadlineMinutes());

        return institutionProfileMapper.toResponse(institutionProfileRepository.save(profile));
    }
}
