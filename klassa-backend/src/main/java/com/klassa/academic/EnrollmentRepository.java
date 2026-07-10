package com.klassa.academic;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findAllBySectionId(Long sectionId);

    List<Enrollment> findAllByStudentId(Long studentId);

    Optional<Enrollment> findByStudentIdAndSectionId(Long studentId, Long sectionId);

    List<Enrollment> findAllBySectionIdAndStatus(Long sectionId, EnrollmentStatus status);

    boolean existsByIdAndSectionHomeroomTeacherId(Long id, Long teacherId);

    boolean existsByIdAndStudentFamilyGuardianUserId(Long id, Long userId);

    @Query("""
            SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM Enrollment e
            LEFT JOIN e.section sec
            LEFT JOIN sec.homeroomTeacher tutor
            WHERE e.student.id = :studentId AND e.status = 'ACTIVE'
              AND (tutor.id = :teacherId
                   OR EXISTS (SELECT 1 FROM TeachingAssignment ta WHERE ta.section.id = sec.id AND ta.teacher.id = :teacherId))
            """)
    boolean existsActiveEnrollmentForStudentAndTeacher(Long studentId, Long teacherId);

    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.section.id = :sectionId AND e.status = 'ACTIVE'")
    long countActiveBySectionId(Long sectionId);

    @Query("SELECT e FROM Enrollment e JOIN FETCH e.student JOIN FETCH e.section s " +
           "JOIN FETCH s.academicYear WHERE s.academicYear.id = :academicYearId AND e.status = :status")
    List<Enrollment> findAllByAcademicYearIdAndStatus(Long academicYearId, EnrollmentStatus status);
}
