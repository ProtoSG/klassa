package com.klassa.billing;

import com.klassa.academic.AcademicYear;
import com.klassa.shared.domain.BaseEntity;
import com.klassa.shared.domain.vo.DueDay;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "fee_schedules")
@Getter
@Setter
@NoArgsConstructor
public class FeeSchedule extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String concept;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private DueDay dueDay;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id", nullable = false)
    private AcademicYear academicYear;

    @Column(nullable = false)
    private Boolean active = true;
}
