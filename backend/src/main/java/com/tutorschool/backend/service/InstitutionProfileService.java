package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.UpdateInstitutionProfileRequest;
import com.tutorschool.backend.dto.response.InstitutionProfileResponse;

public interface InstitutionProfileService {

    InstitutionProfileResponse getInstitutionProfile();

    InstitutionProfileResponse updateInstitutionProfile(UpdateInstitutionProfileRequest request);
}
