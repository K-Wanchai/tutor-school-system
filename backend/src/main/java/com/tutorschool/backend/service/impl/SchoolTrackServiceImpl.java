package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.SaveSchoolTrackRequest;
import com.tutorschool.backend.dto.response.SchoolTrackResponse;
import com.tutorschool.backend.entity.EducationLevel;
import com.tutorschool.backend.entity.ExamInstitution;
import com.tutorschool.backend.entity.InstitutionType;
import com.tutorschool.backend.entity.SchoolTrack;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.ExamInstitutionNotFoundException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.SchoolTrackMapper;
import com.tutorschool.backend.repository.ExamInstitutionRepository;
import com.tutorschool.backend.repository.SchoolTrackRepository;
import com.tutorschool.backend.service.SchoolTrackService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SchoolTrackServiceImpl implements SchoolTrackService {

    private final SchoolTrackRepository schoolTrackRepository;
    private final ExamInstitutionRepository examInstitutionRepository;
    private final SchoolTrackMapper schoolTrackMapper;

    @Override
    @Transactional(readOnly = true)
    public List<SchoolTrackResponse> getTracks(Long institutionId, EducationLevel educationLevel) {
        findInstitution(institutionId);
        List<SchoolTrack> tracks = educationLevel == null
                ? schoolTrackRepository.findByExamInstitutionIdOrderByNameAsc(institutionId)
                : schoolTrackRepository.findByExamInstitutionIdAndEducationLevelOrderByNameAsc(institutionId, educationLevel);
        return tracks.stream().map(schoolTrackMapper::toResponse).toList();
    }

    @Override
    @Transactional
    public SchoolTrackResponse createTrack(Long institutionId, SaveSchoolTrackRequest request) {
        ExamInstitution institution = findSchool(institutionId);
        validateSchoolLevel(request.getEducationLevel());

        String name = request.getName().trim();
        if (schoolTrackRepository.existsByExamInstitutionIdAndEducationLevelAndNameIgnoreCase(
                institutionId, request.getEducationLevel(), name)) {
            throw new DuplicateResourceException("มีชื่อสายการเรียน/ห้องเรียนนี้อยู่ในระดับชั้นนี้แล้ว: " + name);
        }

        SchoolTrack track = SchoolTrack.builder()
                .examInstitution(institution)
                .educationLevel(request.getEducationLevel())
                .name(name)
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();

        return schoolTrackMapper.toResponse(schoolTrackRepository.save(track));
    }

    @Override
    @Transactional
    public SchoolTrackResponse updateTrack(Long institutionId, Long trackId, SaveSchoolTrackRequest request) {
        findSchool(institutionId);
        validateSchoolLevel(request.getEducationLevel());
        SchoolTrack track = findTrack(institutionId, trackId);

        String newName = request.getName().trim();
        boolean sameNameAndLevel = track.getName().equalsIgnoreCase(newName)
                && track.getEducationLevel() == request.getEducationLevel();
        if (!sameNameAndLevel && schoolTrackRepository.existsByExamInstitutionIdAndEducationLevelAndNameIgnoreCaseAndIdNot(
                institutionId, request.getEducationLevel(), newName, trackId)) {
            throw new DuplicateResourceException("มีชื่อสายการเรียน/ห้องเรียนนี้อยู่ในระดับชั้นนี้แล้ว: " + newName);
        }

        track.setEducationLevel(request.getEducationLevel());
        track.setName(newName);
        if (request.getActive() != null) {
            track.setActive(request.getActive());
        }

        return schoolTrackMapper.toResponse(schoolTrackRepository.save(track));
    }

    @Override
    @Transactional
    public void deleteTrack(Long institutionId, Long trackId) {
        findSchool(institutionId);
        SchoolTrack track = findTrack(institutionId, trackId);
        track.setActive(false);
        schoolTrackRepository.save(track);
    }

    private void validateSchoolLevel(EducationLevel level) {
        if (level != EducationLevel.LOWER_SECONDARY && level != EducationLevel.UPPER_SECONDARY) {
            throw new IllegalStateException("สายการเรียน/ห้องเรียนใช้ได้เฉพาะระดับมัธยมต้นหรือมัธยมปลายเท่านั้น");
        }
    }

    private ExamInstitution findInstitution(Long institutionId) {
        return examInstitutionRepository.findById(institutionId)
                .orElseThrow(() -> new ExamInstitutionNotFoundException("ไม่พบข้อมูลสถาบันที่จัดสอบ รหัส: " + institutionId));
    }

    private ExamInstitution findSchool(Long institutionId) {
        ExamInstitution institution = findInstitution(institutionId);
        if (institution.getInstitutionType() != InstitutionType.SECONDARY) {
            throw new IllegalStateException("สายการเรียน/ห้องเรียนใช้ได้เฉพาะสถาบันประเภทมัธยมเท่านั้น");
        }
        return institution;
    }

    private SchoolTrack findTrack(Long institutionId, Long trackId) {
        SchoolTrack track = schoolTrackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("ไม่พบข้อมูลสายการเรียน/ห้องเรียน รหัส: " + trackId));
        if (!track.getExamInstitution().getId().equals(institutionId)) {
            throw new ResourceNotFoundException("ไม่พบข้อมูลสายการเรียน/ห้องเรียนในสถาบันนี้ รหัส: " + trackId);
        }
        return track;
    }
}
