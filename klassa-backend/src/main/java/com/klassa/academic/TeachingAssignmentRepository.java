package com.klassa.academic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TeachingAssignmentRepository extends JpaRepository<TeachingAssignment, Long> {

    List<TeachingAssignment> findAllBySectionId(Long sectionId);

    Optional<TeachingAssignment> findBySectionIdAndSubjectId(Long sectionId, Long subjectId);

    boolean existsBySectionIdAndSubjectIdAndTeacherId(Long sectionId, Long subjectId, Long teacherId);

    // Ad-hoc JPQL join: TeachingAssignment and Enrollment are siblings under Section (no direct
    // association), so this joins them on section id equality. Runs as a single SQL query — safe
    // to call from @PreAuthorize SpEL, same as the existing existsBy* derived-query checks.
    @Query("""
            SELECT CASE WHEN COUNT(ta) > 0 THEN true ELSE false END FROM TeachingAssignment ta
            JOIN Enrollment e ON e.section.id = ta.section.id
            WHERE e.id = :enrollmentId AND ta.teacher.id = :teacherId
            """)
    boolean existsByEnrollmentSectionAndTeacherId(Long enrollmentId, Long teacherId);
}
