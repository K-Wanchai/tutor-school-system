package com.tutorschool.backend.service;

import com.tutorschool.backend.dto.request.SaveSchoolTrackRequest;
import com.tutorschool.backend.dto.response.SchoolTrackResponse;
import com.tutorschool.backend.entity.EducationLevel;

import java.util.List;

public interface SchoolTrackService {

    List<SchoolTrackResponse> getTracks(Long institutionId, EducationLevel educationLevel);

    SchoolTrackResponse createTrack(Long institutionId, SaveSchoolTrackRequest request);

    SchoolTrackResponse updateTrack(Long institutionId, Long trackId, SaveSchoolTrackRequest request);

    void deleteTrack(Long institutionId, Long trackId);
}
