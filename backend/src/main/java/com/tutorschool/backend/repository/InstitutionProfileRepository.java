package com.tutorschool.backend.repository;

import com.tutorschool.backend.entity.InstitutionProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InstitutionProfileRepository extends JpaRepository<InstitutionProfile, Long> {

    Optional<InstitutionProfile> findFirstBy();
}
