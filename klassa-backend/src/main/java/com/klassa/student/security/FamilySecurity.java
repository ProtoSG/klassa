package com.klassa.student.security;

import com.klassa.academic.EnrollmentRepository;
import com.klassa.billing.InvoiceRepository;
import com.klassa.student.FamilyRepository;
import com.klassa.student.StudentRepository;
import org.springframework.stereotype.Component;

@Component("familySecurity")
public class FamilySecurity {

    private final FamilyRepository familyRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final InvoiceRepository invoiceRepository;

    public FamilySecurity(FamilyRepository familyRepository, StudentRepository studentRepository,
                          EnrollmentRepository enrollmentRepository, InvoiceRepository invoiceRepository) {
        this.familyRepository = familyRepository;
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public boolean ownsFamily(Long familyId, Long userId) {
        return familyRepository.existsByIdAndGuardianUserId(familyId, userId);
    }

    public boolean ownsStudent(Long studentId, Long userId) {
        return studentRepository.existsByIdAndFamilyGuardianUserId(studentId, userId);
    }

    public boolean ownsEnrollment(Long enrollmentId, Long userId) {
        return enrollmentRepository.existsByIdAndStudentFamilyGuardianUserId(enrollmentId, userId);
    }

    public boolean ownsInvoice(Long invoiceId, Long userId) {
        return invoiceRepository.existsByIdAndStudentFamilyGuardianUserId(invoiceId, userId);
    }
}
