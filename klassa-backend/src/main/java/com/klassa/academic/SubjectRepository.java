package com.klassa.academic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Long> {

    @Query("SELECT s FROM Subject s JOIN FETCH s.gradeLevel WHERE s.active = true ORDER BY s.name")
    List<Subject> findAllByActiveTrue();

    @Query("SELECT s FROM Subject s JOIN FETCH s.gradeLevel WHERE s.gradeLevel.id = :gradeLevelId ORDER BY s.name")
    List<Subject> findAllByGradeLevelId(@Param("gradeLevelId") Long gradeLevelId);

    @Query("SELECT s FROM Subject s JOIN FETCH s.gradeLevel WHERE s.id = :id")
    Optional<Subject> findByIdWithGradeLevel(@Param("id") Long id);
}
