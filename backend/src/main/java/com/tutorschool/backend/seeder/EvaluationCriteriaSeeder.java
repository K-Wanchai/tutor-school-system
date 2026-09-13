package com.tutorschool.backend.seeder;

import com.tutorschool.backend.entity.EvaluationCriteria;
import com.tutorschool.backend.repository.EvaluationCriteriaRepository;
import com.tutorschool.backend.repository.EvaluationCriteriaScoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.util.List;
import java.util.Map;

// Seeds the 5 default evaluation criteria (once) and, on the same first run, migrates any
// historical scores from the old fixed teaching/content/material/communication/value_score
// columns on course_evaluations into the new dynamic evaluation_criteria_scores table —
// so evaluations submitted before this feature keep their per-topic scores.
@Slf4j
@Component
@RequiredArgsConstructor
public class EvaluationCriteriaSeeder implements CommandLineRunner {

    private static final String[] DEFAULT_LABELS = {
            "การสอน / เทคนิคการถ่ายทอด",
            "เนื้อหาคอร์ส",
            "เอกสาร / สื่อการสอน",
            "การสื่อสาร / การตอบคำถาม",
            "ความคุ้มค่า",
    };

    private static final String[] LEGACY_COLUMNS = {
            "teaching_score", "content_score", "material_score", "communication_score", "value_score",
    };

    private final EvaluationCriteriaRepository evaluationCriteriaRepository;
    private final EvaluationCriteriaScoreRepository evaluationCriteriaScoreRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        boolean alreadySeeded = evaluationCriteriaRepository.count() > 0;

        List<EvaluationCriteria> criteria;
        if (alreadySeeded) {
            log.info("[Seeder] Evaluation criteria already exist — skipped");
            criteria = evaluationCriteriaRepository.findAllByOrderByDisplayOrderAsc();
        } else {
            criteria = seedDefaultCriteria();
        }

        if (!alreadySeeded) {
            migrateLegacyScores(criteria);
        }
    }

    private List<EvaluationCriteria> seedDefaultCriteria() {
        String[] labels = readLegacyLabelsOrDefault();

        List<EvaluationCriteria> created = new java.util.ArrayList<>();
        for (int i = 0; i < labels.length; i++) {
            created.add(evaluationCriteriaRepository.save(EvaluationCriteria.builder()
                    .label(labels[i])
                    .displayOrder(i + 1)
                    .isActive(true)
                    .build()));
        }
        log.info("[Seeder] Default evaluation criteria created ({} topics)", created.size());
        return created;
    }

    // อ่านชื่อหัวข้อจากตาราง evaluation_settings เดิม (ฟีเจอร์ก่อนหน้านี้) ถ้ามี เพื่อไม่ให้ชื่อที่แอดมิน
    // เคยตั้งไว้หายไปตอนย้ายมาใช้โครงสร้างใหม่ — ถ้าตารางไม่มีหรืออ่านไม่ได้ ใช้ชื่อ default แทน
    private String[] readLegacyLabelsOrDefault() {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT teaching_label, content_label, material_label, communication_label, value_label " +
                            "FROM evaluation_settings LIMIT 1",
                    (ResultSet rs, int rowNum) -> new String[]{
                            rs.getString("teaching_label"),
                            rs.getString("content_label"),
                            rs.getString("material_label"),
                            rs.getString("communication_label"),
                            rs.getString("value_label"),
                    });
        } catch (Exception e) {
            return DEFAULT_LABELS;
        }
    }

    // ย้ายคะแนนรีวิวเก่าจากคอลัมน์ตายตัว 5 คอลัมน์ ไปตาราง evaluation_criteria_scores ทีละแถว
    private void migrateLegacyScores(List<EvaluationCriteria> criteria) {
        if (evaluationCriteriaScoreRepository.count() > 0 || criteria.size() < LEGACY_COLUMNS.length) {
            return;
        }

        List<Map<String, Object>> rows;
        try {
            rows = jdbcTemplate.queryForList(
                    "SELECT id, teaching_score, content_score, material_score, communication_score, value_score " +
                            "FROM course_evaluations");
        } catch (Exception e) {
            log.warn("[Seeder] Could not read legacy evaluation score columns — skipping migration ({})", e.getMessage());
            return;
        }

        if (rows.isEmpty()) {
            return;
        }

        Long[] criteriaIds = criteria.stream().map(EvaluationCriteria::getId).toArray(Long[]::new);
        int migrated = 0;
        for (Map<String, Object> row : rows) {
            Object evaluationId = row.get("id");
            for (int i = 0; i < LEGACY_COLUMNS.length; i++) {
                Object score = row.get(LEGACY_COLUMNS[i]);
                if (score == null) continue;
                jdbcTemplate.update(
                        "INSERT INTO evaluation_criteria_scores (evaluation_id, criteria_id, score) VALUES (?, ?, ?)",
                        evaluationId, criteriaIds[i], ((Number) score).intValue());
                migrated++;
            }
        }
        log.info("[Seeder] Migrated {} legacy evaluation scores across {} evaluations", migrated, rows.size());
    }
}
