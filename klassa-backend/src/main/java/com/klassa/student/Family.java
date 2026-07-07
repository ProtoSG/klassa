package com.klassa.student;

import com.klassa.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "families")
@Getter
@Setter
@NoArgsConstructor
public class Family extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String guardianName;

    @Column(length = 200)
    private String guardianEmail;

    @Column(length = 20)
    private String guardianPhone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 200)
    private String emergencyContact;

    @Column(length = 20)
    private String emergencyPhone;
}
