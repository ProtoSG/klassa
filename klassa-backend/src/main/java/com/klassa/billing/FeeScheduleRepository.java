package com.klassa.billing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeeScheduleRepository extends JpaRepository<FeeSchedule, Long> {

    List<FeeSchedule> findAllByAcademicYearId(Long academicYearId);

    List<FeeSchedule> findAllByAcademicYearIdAndActiveTrue(Long academicYearId);
}
