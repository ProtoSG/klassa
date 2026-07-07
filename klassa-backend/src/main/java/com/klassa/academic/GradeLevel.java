package com.klassa.academic;

import com.klassa.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

@Entity
@Table(name = "grade_levels")
@Getter
@Setter
@NoArgsConstructor
public class GradeLevel extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(nullable = false, columnDefinition = "grade_level_type")
    private GradeLevelType level;

    @Column(nullable = false)
    private Integer sortOrder = 0;
}
