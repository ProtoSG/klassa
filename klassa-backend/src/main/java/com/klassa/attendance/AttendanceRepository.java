package com.klassa.attendance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findAllByEnrollmentId(Long enrollmentId);

    List<AttendanceRecord> findAllByEnrollmentIdAndDateBetween(Long enrollmentId,
                                                                LocalDate start, LocalDate end);

    Optional<AttendanceRecord> findByEnrollmentIdAndDate(Long enrollmentId, LocalDate date);

    @Query("SELECT a FROM AttendanceRecord a WHERE a.enrollment.section.id = :sectionId AND a.date = :date")
    List<AttendanceRecord> findBySectionAndDate(Long sectionId, LocalDate date);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a " +
           "WHERE a.enrollment.id = :enrollmentId " +
           "AND a.date BETWEEN :start AND :end " +
           "AND a.status IN ('PRESENT', 'LATE')")
    long countAttendedDays(Long enrollmentId, LocalDate start, LocalDate end);

    @Query("SELECT COUNT(a) FROM AttendanceRecord a " +
           "WHERE a.enrollment.id = :enrollmentId " +
           "AND a.date BETWEEN :start AND :end")
    long countTotalDays(Long enrollmentId, LocalDate start, LocalDate end);
}
