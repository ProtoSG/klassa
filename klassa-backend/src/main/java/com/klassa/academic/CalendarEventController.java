package com.klassa.academic;

import com.klassa.academic.dto.CalendarEventRequest;
import com.klassa.academic.dto.CalendarEventResponse;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.exception.EntityNotFoundException;
import com.klassa.shared.web.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calendar-events")
@Tag(name = "Calendar Events")
@SecurityRequirement(name = "bearerAuth")
public class CalendarEventController {

    private final CalendarEventRepository calendarEventRepository;

    public CalendarEventController(CalendarEventRepository calendarEventRepository) {
        this.calendarEventRepository = calendarEventRepository;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> create(
            @Valid @RequestBody CalendarEventRequest request) {
        assertValidDates(request);
        CalendarEvent event = new CalendarEvent();
        applyRequest(event, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(toResponse(calendarEventRepository.save(event))));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('TEACHER') or hasRole('TREASURER') or hasRole('PARENT')")
    public ResponseEntity<ApiResponse<List<CalendarEventResponse>>> findAll() {
        List<CalendarEventResponse> events = calendarEventRepository.findAllByOrderByStartDateAsc().stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(events));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> update(
            @PathVariable Long id, @Valid @RequestBody CalendarEventRequest request) {
        assertValidDates(request);
        CalendarEvent event = calendarEventRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("CalendarEvent", id));
        applyRequest(event, request);
        return ResponseEntity.ok(ApiResponse.ok(toResponse(calendarEventRepository.save(event))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!calendarEventRepository.existsById(id)) {
            throw new EntityNotFoundException("CalendarEvent", id);
        }
        calendarEventRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void assertValidDates(CalendarEventRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new BusinessRuleException(ErrorCode.CALENDAR_EVENT_INVALID_DATES);
        }
    }

    private void applyRequest(CalendarEvent event, CalendarEventRequest request) {
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        event.setType(request.type());
    }

    private CalendarEventResponse toResponse(CalendarEvent event) {
        return new CalendarEventResponse(event.getId(), event.getTitle(), event.getDescription(),
                event.getStartDate(), event.getEndDate(), event.getType());
    }
}
