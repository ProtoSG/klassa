package com.klassa.academic;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {

    Optional<AcademicYear> findByActiveTrue();

    List<AcademicYear> findAllByOrderByStartDateDesc();
}
