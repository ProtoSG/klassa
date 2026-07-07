package com.klassa.student;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByCode(String code);

    boolean existsByCode(String code);

    // Fetch family in the same query — mapper reads family.guardianName per row (avoids N+1).
    @EntityGraph(attributePaths = "family")
    Page<Student> findAllByStatus(StudentStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "family")
    List<Student> findAllByFamilyId(Long familyId);

    @EntityGraph(attributePaths = "family")
    Page<Student> findAll(Pageable pageable);
}
