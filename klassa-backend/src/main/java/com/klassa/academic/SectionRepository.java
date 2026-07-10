package com.klassa.academic;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SectionRepository extends JpaRepository<Section, Long> {

    List<Section> findAllByAcademicYearId(Long academicYearId);

    List<Section> findAllByGradeLevelIdAndAcademicYearId(Long gradeLevelId, Long academicYearId);

    List<Section> findAllByHomeroomTeacherId(Long teacherId);

    List<Section> findAllByAcademicYearIdAndHomeroomTeacherId(Long academicYearId, Long teacherId);

    boolean existsByIdAndHomeroomTeacherId(Long id, Long teacherId);

    /**
     * Locks the section row so concurrent enrollments serialise on it, making the
     * capacity check-then-insert atomic.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Section s where s.id = :id")
    Optional<Section> findByIdForUpdate(@Param("id") Long id);
}
