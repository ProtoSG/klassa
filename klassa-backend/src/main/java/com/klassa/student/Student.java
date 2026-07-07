package com.klassa.student;

import com.klassa.shared.domain.BaseEntity;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.time.LocalDate;

@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
public class Student extends BaseEntity {

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false, columnDefinition = "student_gender")
    private Gender gender;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false, columnDefinition = "student_status")
    private StudentStatus status = StudentStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_id")
    private Family family;

    @Column(length = 500)
    private String photoUrl;

    public String fullName() {
        return firstName + " " + lastName;
    }

    public boolean isActive() {
        return status == StudentStatus.ACTIVE;
    }

    public void deactivate() {
        if (status == StudentStatus.INACTIVE)
            throw new BusinessRuleException(ErrorCode.STUDENT_ALREADY_INACTIVE);
        this.status = StudentStatus.INACTIVE;
    }

    public void activate() {
        if (status == StudentStatus.ACTIVE)
            throw new BusinessRuleException(ErrorCode.STUDENT_ALREADY_ACTIVE);
        this.status = StudentStatus.ACTIVE;
    }

    public void transfer() {
        this.status = StudentStatus.TRANSFERRED;
    }
}
