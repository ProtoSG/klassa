package com.klassa.user;

import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.user.dto.UserRequest;
import com.klassa.user.dto.UserResponse;
import com.klassa.user.dto.UserUpdateRequest;
import com.klassa.shared.web.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, UserMapper userMapper,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse create(UserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessRuleException(ErrorCode.EMAIL_TAKEN, request.email());
        }
        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.role());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setActive(true);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void createInitialAdmin(String email, String tempPassword, String firstName, String lastName) {
        if (userRepository.existsByEmail(email)) {
            throw new BusinessRuleException(ErrorCode.EMAIL_TAKEN, email);
        }
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setRole(UserRole.ADMIN);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setActive(true);
        user.setMustChangePassword(true);
        userRepository.save(user);
    }

    public UserResponse findById(Long id) {
        return userRepository.findById(id)
                .map(userMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
    }

    public PageResponse<UserResponse> findAll(Pageable pageable) {
        return PageResponse.of(userRepository.findAllByActiveTrue(pageable).map(userMapper::toResponse));
    }

    public PageResponse<UserResponse> findByRole(UserRole role, Pageable pageable) {
        return PageResponse.of(userRepository.findAllByRole(role, pageable).map(userMapper::toResponse));
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));

        if (!user.getEmail().equals(request.email()) && userRepository.existsByEmail(request.email())) {
            throw new BusinessRuleException(ErrorCode.EMAIL_TAKEN, request.email());
        }

        user.setEmail(request.email());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        user.setRole(request.role());
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        return userMapper.toResponse(userRepository.save(user));
    }

    public PageResponse<UserResponse> findInactive(Pageable pageable) {
        return PageResponse.of(userRepository.findAllByActiveFalse(pageable).map(userMapper::toResponse));
    }

    @Transactional
    public void deactivate(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
        user.setActive(false);
        userRepository.save(user);
    }

    @Transactional
    public UserResponse activate(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
        user.setActive(true);
        return userMapper.toResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    public User loadByEmail(String email) {
        return userRepository.findByEmailAndActiveTrue(email)
                .orElseThrow(() -> new EntityNotFoundException("User", "email", email));
    }
}
