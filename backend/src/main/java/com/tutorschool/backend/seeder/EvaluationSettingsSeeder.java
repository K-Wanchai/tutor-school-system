package com.tutorschool.backend.seeder;

import com.tutorschool.backend.entity.EvaluationSettings;
import com.tutorschool.backend.repository.EvaluationSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EvaluationSettingsSeeder implements CommandLineRunner {

    private static final String DEFAULT_TEACHING_LABEL = "การสอน / เทคนิคการถ่ายทอด";
    private static final String DEFAULT_CONTENT_LABEL = "เนื้อหาคอร์ส";
    private static final String DEFAULT_MATERIAL_LABEL = "เอกสาร / สื่อการสอน";
    private static final String DEFAULT_COMMUNICATION_LABEL = "การสื่อสาร / การตอบคำถาม";
    private static final String DEFAULT_VALUE_LABEL = "ความคุ้มค่า";

    private final EvaluationSettingsRepository evaluationSettingsRepository;

    @Override
    public void run(String... args) {
        if (evaluationSettingsRepository.findFirstBy().isPresent()) {
            log.info("[Seeder] Evaluation settings already exist — skipped");
            return;
        }

        EvaluationSettings settings = EvaluationSettings.builder()
                .teachingLabel(DEFAULT_TEACHING_LABEL)
                .contentLabel(DEFAULT_CONTENT_LABEL)
                .materialLabel(DEFAULT_MATERIAL_LABEL)
                .communicationLabel(DEFAULT_COMMUNICATION_LABEL)
                .valueLabel(DEFAULT_VALUE_LABEL)
                .build();

        evaluationSettingsRepository.save(settings);
        log.info("[Seeder] Default evaluation settings created");
    }
}
