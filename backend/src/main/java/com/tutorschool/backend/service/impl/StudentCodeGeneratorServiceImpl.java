package com.tutorschool.backend.service.impl;

import com.tutorschool.backend.repository.StudentCodeCounterRepository;
import com.tutorschool.backend.service.StudentCodeGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class StudentCodeGeneratorServiceImpl implements StudentCodeGeneratorService {

    private final StudentCodeCounterRepository studentCodeCounterRepository;

    @Override
    @Transactional
    public String generateNextCode() {
        int yearBe = LocalDate.now().getYear() + 543;
        int nextNumber = studentCodeCounterRepository.incrementAndGet(yearBe);
        return String.format("%02d%05d", yearBe % 100, nextNumber);
    }
}
