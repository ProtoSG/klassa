package com.klassa.tenant;

import com.klassa.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.Map;

@Entity
@Table(name = "plans", schema = "platform")
@Getter
@Setter
@NoArgsConstructor
public class Plan extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private Integer maxStudents;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal priceMonthly;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> features;

    @Column(nullable = false)
    private Boolean active = true;
}
