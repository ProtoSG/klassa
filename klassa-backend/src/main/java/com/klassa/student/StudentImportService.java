package com.klassa.student;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Persists a single imported row in its own physical transaction.
 *
 * <p>This lives on a separate bean from {@link StudentService} on purpose. {@code
 * importRow} must go through {@code REQUIRES_NEW} on a <em>different</em> bean's Spring proxy to
 * get its own transaction — a self-invocation (e.g. {@code this.importRow(...)} as a private
 * method or same-bean call on {@code StudentService}) would bypass the proxy and silently share
 * the caller's transaction. That would mean one bad row rolling back every row already committed
 * in the same import request. Calling through this separate bean means a failure on row 5 rolls
 * back only row 5 — rows 1-4 already committed stay committed.
 */
@Service
class StudentImportService {

    private final StudentRepository studentRepository;
    private final StudentCodeGenerator studentCodeGenerator;

    StudentImportService(StudentRepository studentRepository, StudentCodeGenerator studentCodeGenerator) {
        this.studentRepository = studentRepository;
        this.studentCodeGenerator = studentCodeGenerator;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importRow(StudentImportRowParser.ParsedRow row) {
        Student student = new Student();
        student.setFirstName(row.firstName());
        student.setLastName(row.lastName());
        student.setBirthDate(row.birthDate());
        student.setGender(row.gender());
        student.setCode(studentCodeGenerator.nextCode());
        studentRepository.save(student);
    }
}
