package com.klassa.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailAndActiveTrue(String email);

    boolean existsByEmail(String email);

    Page<User> findAllByActiveTrue(Pageable pageable);

    Page<User> findAllByActiveFalse(Pageable pageable);

    Page<User> findAllByRole(UserRole role, Pageable pageable);
}
