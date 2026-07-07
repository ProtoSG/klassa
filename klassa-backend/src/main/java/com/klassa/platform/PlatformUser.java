package com.klassa.platform;

import com.klassa.shared.domain.BaseEntity;
import com.klassa.user.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "platform_users", schema = "platform")
@Getter
@Setter
@NoArgsConstructor
public class PlatformUser extends BaseEntity {

    @Column(nullable = false, unique = true, length = 200)
    private String email;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole role;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false)
    private Boolean active = true;

    public String fullName() {
        return firstName + " " + lastName;
    }
}
