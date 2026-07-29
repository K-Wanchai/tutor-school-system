package com.tutorschool.backend.scheduler;

import com.tutorschool.backend.service.CourseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CourseScheduler {

    private final CourseService courseService;

    @Scheduled(fixedDelay = 60000)
    public void runAutoTransition() {
        try {
            courseService.autoTransitionCourses();
        } catch (Exception e) {
            log.error("Course auto-transition run failed: {}", e.getMessage(), e);
        }
    }
}
