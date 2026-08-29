package com.klassa.student;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FamilyRepository extends JpaRepository<Family, Long> {

    boolean existsByIdAndGuardianUserId(Long id, Long userId);

    Optional<Family> findByGuardianUserId(Long guardianUserId);
}
