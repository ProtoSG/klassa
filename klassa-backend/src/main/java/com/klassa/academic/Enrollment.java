package com.klassa.academic;

import com.klassa.shared.domain.BaseEntity;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.student.Student;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.LocalDateTime;

@Entity
@Table(name = "enrollments")
@Getter
@Setter
@NoArgsConstructor
public class Enrollment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(nullable = false)
    private LocalDateTime enrolledAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false, columnDefinition = "enrollment_status")
    private EnrollmentStatus status = EnrollmentStatus.ACTIVE;

    public void withdraw() {
        if (status != EnrollmentStatus.ACTIVE)
            throw new BusinessRuleException(ErrorCode.ENROLLMENT_NOT_ACTIVE);
        this.status = EnrollmentStatus.WITHDRAWN;
    }

    public void markTransferred() {
        if (status != EnrollmentStatus.ACTIVE)
            throw new BusinessRuleException(ErrorCode.ENROLLMENT_NOT_ACTIVE_TRANSFER);
        this.status = EnrollmentStatus.TRANSFERRED;
    }

    public boolean canRecordAttendance() {
        return status == EnrollmentStatus.ACTIVE;
    }
}
