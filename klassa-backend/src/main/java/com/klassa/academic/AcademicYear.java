package com.klassa.academic;

import com.klassa.shared.domain.BaseEntity;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "academic_years")
@Getter
@Setter
@NoArgsConstructor
public class AcademicYear extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private Boolean active = false;

    public void activate() {
        this.active = true;
    }

    public void assertCanClose() {
        if (!Boolean.TRUE.equals(this.active))
            throw new BusinessRuleException(ErrorCode.ACADEMIC_YEAR_ALREADY_CLOSED);
    }
}
