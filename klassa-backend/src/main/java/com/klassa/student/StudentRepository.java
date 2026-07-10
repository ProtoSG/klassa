package com.klassa.student;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByIdAndFamilyGuardianUserId(Long id, Long userId);

    @EntityGraph(attributePaths = "family")
    List<Student> findAllByFamilyId(Long familyId);

    // status/search/teacherId are each optional (pass null to skip that filter). teacherId scopes
    // results to students with an active enrollment in a section where that teacher is either the
    // homeroom tutor or has a teaching assignment — used for TEACHER's roster view.
    @EntityGraph(attributePaths = "family")
    @Query(value = """
            SELECT DISTINCT s FROM Student s
            LEFT JOIN Enrollment e ON e.student.id = s.id AND e.status = 'ACTIVE'
            LEFT JOIN e.section sec
            LEFT JOIN sec.homeroomTeacher tutor
            WHERE (CAST(:status AS string) IS NULL OR s.status = :status)
              AND (CAST(:search AS string) IS NULL
                   OR LOWER(s.firstName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                   OR LOWER(s.lastName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                   OR LOWER(s.code) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
              AND (CAST(:teacherId AS string) IS NULL OR tutor.id = :teacherId
                   OR EXISTS (SELECT 1 FROM TeachingAssignment ta WHERE ta.section.id = sec.id AND ta.teacher.id = :teacherId))
            """,
            countQuery = """
            SELECT COUNT(DISTINCT s) FROM Student s
            LEFT JOIN Enrollment e ON e.student.id = s.id AND e.status = 'ACTIVE'
            LEFT JOIN e.section sec
            LEFT JOIN sec.homeroomTeacher tutor
            WHERE (CAST(:status AS string) IS NULL OR s.status = :status)
              AND (CAST(:search AS string) IS NULL
                   OR LOWER(s.firstName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                   OR LOWER(s.lastName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
                   OR LOWER(s.code) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
              AND (CAST(:teacherId AS string) IS NULL OR tutor.id = :teacherId
                   OR EXISTS (SELECT 1 FROM TeachingAssignment ta WHERE ta.section.id = sec.id AND ta.teacher.id = :teacherId))
            """)
    Page<Student> search(@Param("status") StudentStatus status, @Param("search") String search,
                          @Param("teacherId") Long teacherId, Pageable pageable);
}
