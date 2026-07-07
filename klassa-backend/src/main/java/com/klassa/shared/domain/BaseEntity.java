package com.klassa.shared.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreatedBy
    @Column(name = "user_created", updatable = false, nullable = false, length = 100)
    private String userCreated;

    @CreatedDate
    @Column(name = "date_created", updatable = false, nullable = false)
    private LocalDateTime dateCreated;

    @LastModifiedBy
    @Column(name = "user_updated", length = 100)
    private String userUpdated;

    @LastModifiedDate
    @Column(name = "date_updated")
    private LocalDateTime dateUpdated;
}
