package com.tutorschool.backend.seeder;

import com.tutorschool.backend.entity.InstitutionProfile;
import com.tutorschool.backend.repository.InstitutionProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InstitutionProfileSeeder implements CommandLineRunner {

    private static final String DEFAULT_CODE  = "INST-001";
    private static final String DEFAULT_NAME  = "TutorSchool";
    private static final String DEFAULT_PHONE = "020000000";
    private static final String DEFAULT_EMAIL = "contact@tutorschool.com";
    private static final int DEFAULT_ENROLLMENT_PAYMENT_DEADLINE_MINUTES = 15;

    private final InstitutionProfileRepository institutionProfileRepository;

    @Override
    public void run(String... args) {
        if (institutionProfileRepository.findFirstBy().isPresent()) {
            log.info("[Seeder] Institution profile already exists — skipped");
            return;
        }

        InstitutionProfile profile = InstitutionProfile.builder()
                .institutionCode(DEFAULT_CODE)
                .institutionName(DEFAULT_NAME)
                .phoneNumber(DEFAULT_PHONE)
                .email(DEFAULT_EMAIL)
                .enrollmentPaymentDeadlineMinutes(DEFAULT_ENROLLMENT_PAYMENT_DEADLINE_MINUTES)
                .build();

        institutionProfileRepository.save(profile);
        log.info("[Seeder] Default institution profile created — code: '{}'", DEFAULT_CODE);
    }
}
