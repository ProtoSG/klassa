package com.klassa.assistant;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.klassa.shared.exception.KlassaException;
import com.klassa.shared.security.SecurityUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * Maps a tool_use block (name + JSON input) to the matching {@link AssistantTools} method and
 * wraps the outcome as a tool_result.
 * <p>
 * Critically, {@code assistantTools} here is the <b>injected, Spring-managed bean</b> — calling
 * its methods goes through the AOP proxy that enforces {@code @PreAuthorize}. Never replace this
 * with {@code new AssistantTools(...)} or a self-invocation from within {@link AssistantTools}
 * itself; either would silently bypass every authorization check on this class.
 */
@Component
public class AssistantToolDispatcher {

    private static final Logger log = LoggerFactory.getLogger(AssistantToolDispatcher.class);

    private final AssistantTools assistantTools;
    private final ObjectMapper objectMapper;

    public AssistantToolDispatcher(AssistantTools assistantTools, ObjectMapper objectMapper) {
        this.assistantTools = assistantTools;
        this.objectMapper = objectMapper;
    }

    public ToolResult execute(String toolName, JsonNode input, SecurityUser principal) {
        try {
            Object result = switch (toolName) {
                case "get_student_info" -> assistantTools.getStudentInfo(requireLong(input, "studentId"));
                case "get_student_grades" -> assistantTools.getStudentGrades(requireLong(input, "enrollmentId"));
                case "get_student_attendance" -> assistantTools.getStudentAttendance(requireLong(input, "enrollmentId"));
                case "get_student_balance" -> assistantTools.getStudentBalance(requireLong(input, "studentId"));
                case "list_my_students" -> assistantTools.listMyStudents(principal);
                case "list_sections" -> assistantTools.listSections(requireLong(input, "academicYearId"), principal);
                case "list_section_enrollments" -> assistantTools.listSectionEnrollments(requireLong(input, "sectionId"));
                case "list_student_enrollments" -> assistantTools.listStudentEnrollments(requireLong(input, "studentId"));
                case "list_section_assignments" -> assistantTools.listSectionAssignments(requireLong(input, "sectionId"));
                case "list_student_invoices" -> assistantTools.listStudentInvoices(requireLong(input, "studentId"));
                case "list_calendar_events" -> assistantTools.listCalendarEvents();
                case "list_academic_years" -> assistantTools.listAcademicYears();
                default -> throw new IllegalArgumentException("Herramienta desconocida: " + toolName);
            };
            return new ToolResult(writeJson(result), false);
        } catch (AccessDeniedException e) {
            // The whole point of the copied @PreAuthorize: let the assistant tell the user it
            // can't access that data instead of the tool-use loop (or the whole chat request)
            // blowing up with a 403.
            return new ToolResult("No tenés acceso a esa información.", true);
        } catch (KlassaException e) {
            // e.g. EntityNotFoundException for a studentId/enrollmentId the model made up or that
            // no longer exists — surface the message so Claude can tell the user, not crash.
            return new ToolResult(e.getMessage(), true);
        } catch (IllegalArgumentException e) {
            return new ToolResult(e.getMessage(), true);
        } catch (RuntimeException e) {
            log.warn("Assistant tool '{}' failed unexpectedly", toolName, e);
            return new ToolResult("No se pudo obtener esa información en este momento.", true);
        }
    }

    private Long requireLong(JsonNode input, String field) {
        JsonNode node = (input == null) ? null : input.get(field);
        if (node == null || node.isNull()) {
            throw new IllegalArgumentException("Falta el parámetro requerido: " + field);
        }
        return node.asLong();
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
