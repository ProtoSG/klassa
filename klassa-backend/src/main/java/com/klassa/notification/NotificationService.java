package com.klassa.notification;

import com.klassa.notification.dto.NotificationResponse;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.web.PageResponse;
import com.klassa.student.StudentRepository;
import com.klassa.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository,
                                StudentRepository studentRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
    }

    /**
     * Called from trigger points (e.g. InvoiceService.markOverdue) — never from a controller.
     * References are proxies (getReferenceById), not fetched rows: this only ever runs as a
     * side effect of an operation that already knows the recipient/student are real.
     */
    @Transactional
    public void notify(Long recipientUserId, NotificationType type, String title, String message, Long studentId) {
        Notification n = new Notification();
        n.setRecipientUser(userRepository.getReferenceById(recipientUserId));
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        if (studentId != null) {
            n.setStudent(studentRepository.getReferenceById(studentId));
        }
        notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> findMine(Long userId, Pageable pageable) {
        Page<Notification> page = notificationRepository.findByRecipientUserIdOrderByDateCreatedDesc(userId, pageable);
        return PageResponse.of(page.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByRecipientUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(Long id, Long userId) {
        if (notificationRepository.markRead(id, userId) == 0) {
            throw new EntityNotFoundException("Notification", id);
        }
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllRead(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType().name(),
                n.getTitle(),
                n.getMessage(),
                n.getStudent() != null ? n.getStudent().getId() : null,
                n.getStudent() != null ? n.getStudent().fullName() : null,
                Boolean.TRUE.equals(n.getRead()),
                n.getDateCreated()
        );
    }
}
