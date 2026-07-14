package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.dto.request.SaveAdmissionRoundRequest;
import com.tutorschool.backend.dto.response.AdmissionRoundResponse;
import com.tutorschool.backend.entity.AdmissionRound;
import com.tutorschool.backend.entity.ExamInstitution;
import com.tutorschool.backend.exception.DuplicateResourceException;
import com.tutorschool.backend.exception.ExamInstitutionNotFoundException;
import com.tutorschool.backend.exception.ResourceNotFoundException;
import com.tutorschool.backend.mapper.AdmissionRoundMapper;
import com.tutorschool.backend.repository.AdmissionRoundRepository;
import com.tutorschool.backend.repository.ExamInstitutionRepository;
import com.tutorschool.backend.service.AdmissionRoundService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdmissionRoundServiceImpl implements AdmissionRoundService {

    private final AdmissionRoundRepository admissionRoundRepository;
    private final ExamInstitutionRepository examInstitutionRepository;
    private final AdmissionRoundMapper admissionRoundMapper;

    @Override
    @Transactional(readOnly = true)
    public List<AdmissionRoundResponse> getRounds(Long institutionId) {
        findInstitution(institutionId);
        return admissionRoundRepository.findByExamInstitutionIdOrderByNameAsc(institutionId).stream()
                .map(admissionRoundMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AdmissionRoundResponse createRound(Long institutionId, SaveAdmissionRoundRequest request) {
        ExamInstitution institution = findInstitution(institutionId);

        String name = request.getName().trim();
        if (admissionRoundRepository.existsByExamInstitutionIdAndNameIgnoreCase(institutionId, name)) {
            throw new DuplicateResourceException("มีชื่อรอบที่สอบติดนี้อยู่ในสถาบันแล้ว: " + name);
        }

        AdmissionRound round = AdmissionRound.builder()
                .examInstitution(institution)
                .name(name)
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();

        return admissionRoundMapper.toResponse(admissionRoundRepository.save(round));
    }

    @Override
    @Transactional
    public AdmissionRoundResponse updateRound(Long institutionId, Long roundId, SaveAdmissionRoundRequest request) {
        findInstitution(institutionId);
        AdmissionRound round = findRound(institutionId, roundId);

        String newName = request.getName().trim();
        if (!round.getName().equalsIgnoreCase(newName)
                && admissionRoundRepository.existsByExamInstitutionIdAndNameIgnoreCaseAndIdNot(institutionId, newName, roundId)) {
            throw new DuplicateResourceException("มีชื่อรอบที่สอบติดนี้อยู่ในสถาบันแล้ว: " + newName);
        }

        round.setName(newName);
        if (request.getActive() != null) {
            round.setActive(request.getActive());
        }

        return admissionRoundMapper.toResponse(admissionRoundRepository.save(round));
    }

    @Override
    @Transactional
    public void deleteRound(Long institutionId, Long roundId) {
        findInstitution(institutionId);
        AdmissionRound round = findRound(institutionId, roundId);
        round.setActive(false);
        admissionRoundRepository.save(round);
    }

    private ExamInstitution findInstitution(Long institutionId) {
        return examInstitutionRepository.findById(institutionId)
                .orElseThrow(() -> new ExamInstitutionNotFoundException("ไม่พบข้อมูลสถาบันที่จัดสอบ รหัส: " + institutionId));
    }

    private AdmissionRound findRound(Long institutionId, Long roundId) {
        AdmissionRound round = admissionRoundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("ไม่พบข้อมูลรอบที่สอบติด รหัส: " + roundId));
        if (!round.getExamInstitution().getId().equals(institutionId)) {
            throw new ResourceNotFoundException("ไม่พบข้อมูลรอบที่สอบติดในสถาบันนี้ รหัส: " + roundId);
        }
        return round;
    }
}
