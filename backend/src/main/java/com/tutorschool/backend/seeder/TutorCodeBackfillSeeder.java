package com.tutorschool.backend.seeder;

import com.tutorschool.backend.entity.Tutor;
import com.tutorschool.backend.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TutorCodeBackfillSeeder implements CommandLineRunner {

    private final TutorRepository tutorRepository;

    @Override
    public void run(String... args) {
        List<Tutor> tutorsWithoutCode = tutorRepository.findAll().stream()
                .filter(tutor -> tutor.getTutorCode() == null || tutor.getTutorCode().isBlank())
                .toList();

        if (tutorsWithoutCode.isEmpty()) {
            log.info("[Seeder] All tutors already have a tutor code — skipped");
            return;
        }

        for (Tutor tutor : tutorsWithoutCode) {
            tutor.setTutorCode("TUT-" + String.format("%04d", tutor.getId()));
        }

        tutorRepository.saveAll(tutorsWithoutCode);
        log.info("[Seeder] Backfilled tutor_code for {} existing tutor(s)", tutorsWithoutCode.size());
    }
}
