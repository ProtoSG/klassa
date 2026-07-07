package com.klassa.academic;

import com.klassa.shared.domain.BaseEntity;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sections")
@Getter
@Setter
@NoArgsConstructor
public class Section extends BaseEntity {

    @Column(nullable = false, length = 50)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grade_level_id", nullable = false)
    private GradeLevel gradeLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "academic_year_id", nullable = false)
    private AcademicYear academicYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "homeroom_teacher_id")
    private User homeroomTeacher;

    public static final int DEFAULT_MAX_CAPACITY = 30;

    @Column(nullable = false)
    private Integer maxCapacity = DEFAULT_MAX_CAPACITY;

    public void assertHasCapacity(int currentEnrollments) {
        if (currentEnrollments >= this.maxCapacity)
            throw new BusinessRuleException(ErrorCode.SECTION_AT_CAPACITY, name, maxCapacity);
    }
}
