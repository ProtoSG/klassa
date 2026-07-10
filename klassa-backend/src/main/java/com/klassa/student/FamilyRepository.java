package com.klassa.student;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilyRepository extends JpaRepository<Family, Long> {

    boolean existsByIdAndGuardianUserId(Long id, Long userId);
}
