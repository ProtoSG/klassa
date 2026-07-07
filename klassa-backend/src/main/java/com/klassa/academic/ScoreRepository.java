package com.klassa.academic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ScoreRepository extends JpaRepository<Score, Long> {

    List<Score> findAllByEnrollmentId(Long enrollmentId);

    List<Score> findAllByEnrollmentIdAndPeriod(Long enrollmentId, Integer period);

    Optional<Score> findByEnrollmentIdAndSubjectIdAndPeriod(Long enrollmentId, Long subjectId, Integer period);

    @Query("SELECT AVG(s.score) FROM Score s WHERE s.enrollment.id = :enrollmentId")
    Optional<BigDecimal> findAverageByEnrollmentId(Long enrollmentId);

    @Query("SELECT AVG(s.score) FROM Score s WHERE s.enrollment.id = :enrollmentId AND s.period = :period")
    Optional<BigDecimal> findAverageByEnrollmentIdAndPeriod(Long enrollmentId, Integer period);
}
