package com.klassa.assistant;

import com.klassa.assistant.dto.ChatMessageDto;
import com.klassa.assistant.llm.LlmClient;
import com.klassa.assistant.llm.LlmMessage;
import com.klassa.assistant.llm.LlmTool;
import com.klassa.plan.PlanFeatures;
import com.klassa.plan.PlanService;
import com.klassa.shared.exception.BusinessRuleException;
import com.klassa.shared.exception.ErrorCode;
import com.klassa.shared.security.SecurityUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Orchestrates one assistant turn: resolves the tenant's monthly quota, runs the LLM
 * tool-use loop (via {@link LlmClient}), and returns the final answer.
 * <p>
 * Deliberately fully synchronous — no {@code @Async}, no executor, no reactive types anywhere in
 * this path — so {@link TenantContext} (a plain {@code ThreadLocal}) and
 * {@code SecurityContextHolder} stay valid for every tool call without any special propagation.
 */
@Service
public class AssistantService {

    private static final Logger log = LoggerFactory.getLogger(AssistantService.class);

    private static final String SYSTEM_PROMPT = """
            Sos el asistente de Klassa, un sistema de gestión escolar. Respondés SIEMPRE en español, \
            breve y concreto.

            ## REGLAS CRÍTICAS

            1. NUNCA pedirle al usuario un ID. Si necesitás un ID (de alumno, sección, matrícula, \
            año académico), usá las herramientas de listado para buscarlo vos. Por ejemplo, si el \
            usuario dice "info de Camila", primero listá los alumnos, encontrá el ID, y después \
            consultá los datos.

            2. NUNCA mencionar nombres de herramientas, funciones, IDs internos, ni técnicismos \
            al usuario. Decí "consulté los datos" no "usé get_student_info".

            3. Cuando el usuario pida información "completa" o "toda la info" sobre un alumno, \
            encadená TODAS las herramientas necesarias en una sola vuelta: datos generales, \
            matrícula, calificaciones, asistencia y saldo. No preguntes qué quiere ver — \
            mostrale todo.

            4. Si el usuario pregunta algo que requiere recorrer varios registros (ej: "qué alumnos \
            no tienen apoderado"), hacelo. Listá los alumnos, y para cada uno consultá sus datos. \
            No le pidas al usuario que lo haga.

            5. Formateá con markdown: negritas para nombres, listas, tablas cuando hay varios \
            registros con varias columnas.

            6. Si una herramienta devuelve error de acceso, decí "no tenés acceso a esa información" \
            sin explicar por qué.

            7. Sé DIRECTO. No preguntes "¿querés que consulte?" — simplemente consultá y mostrá \
            el resultado. El usuario ya pidió la info.

            8. Solo respondé preguntas relacionadas a la gestión escolar de Klassa (alumnos, \
            secciones, matrículas, calificaciones, asistencia, facturación, calendario académico). \
            Si te preguntan algo fuera de ese dominio, respondé brevemente que solo podés ayudar \
            con temas de Klassa, sin explicar más.

            ## FORMATO DE RESPUESTA

            - Datos de un alumno: tabla con campo = valor
            - Listas de alumnos: tabla con Nombre, Código, Estado
            - Calificaciones: tabla con Materia, Período, Nota
            - Asistencia: resumen con porcentaje + tabla de ausencias
            - Saldos: tabla con Factura, Monto, Estado, Vencimiento
            - Si no hay datos: "No se encontraron registros" """;

    private static final List<LlmTool> TOOLS = List.of(
            new LlmTool(
                    "get_student_info",
                    "Obtiene los datos generales de un alumno (nombre, estado, apoderado) a partir de su ID.",
                    Map.of(
                            "type", "object",
                            "properties", Map.of(
                                    "studentId", Map.of("type", "integer", "description", "ID numérico del alumno")),
                            "required", List.of("studentId"))),
            new LlmTool(
                    "get_student_grades",
                    "Obtiene las calificaciones y el promedio de una matrícula (enrollment) a partir de su ID.",
                    Map.of(
                            "type", "object",
                            "properties", Map.of(
                                    "enrollmentId", Map.of("type", "integer", "description", "ID numérico de la matrícula")),
                            "required", List.of("enrollmentId"))),
            new LlmTool(
                    "get_student_attendance",
                    "Obtiene el porcentaje de asistencia y las ausencias/tardanzas recientes (últimos 30 días) "
                            + "de una matrícula a partir de su ID.",
                    Map.of(
                            "type", "object",
                            "properties", Map.of(
                                    "enrollmentId", Map.of("type", "integer", "description", "ID numérico de la matrícula")),
                            "required", List.of("enrollmentId"))),
            new LlmTool(
                    "get_student_balance",
                    "Obtiene el saldo pendiente de pago de un alumno a partir de su ID.",
                    Map.of(
                            "type", "object",
                            "properties", Map.of(
                                    "studentId", Map.of("type", "integer", "description", "ID numérico del alumno")),
                            "required", List.of("studentId"))),
            new LlmTool(
                    "list_my_students",
                    "Lista los alumnos activos del usuario actual (para un docente, su propia sección/roster; "
                            + "para un administrador o tesorero, el listado completo del colegio).",
                    Map.of("type", "object", "properties", Map.of(), "required", List.of())),
            new LlmTool(
                    "list_sections",
                    "Lista las secciones (cursos) de un año académico con su capacidad y docente a cargo.",
                    Map.of(
                            "type", "object",
                            "properties", Map.of(
                                    "academicYearId", Map.of("type", "integer", "description", "ID del año académico")),
                            "required", List.of("academicYearId"))),
            new LlmTool(
                    "list_section_enrollments",
                    "Lista los alumnos matriculados en una sección específica.",
                    Map.of(
                            "type", "object",
                            "properties", Map.of(
                                    "sectionId", Map.of("type", "integer", "description", "ID de la sección")),
                            "required", List.of("sectionId"))),
            new LlmTool(
                    "list_student_enrollments",
                    "Lista las matrículas de un alumno (en qué secciones ha estado o está matriculado).",
                    Map.of(
                            "type", "object",
                            "properties", Map.of(
                                    "studentId", Map.of("type", "integer", "description", "ID numérico del alumno")),
                            "required", List.of("studentId"))),
            new LlmTool(
                    "list_section_assignments",
                    "Lista las asignaciones de materias y docentes de una sección.",
                    Map.of(
                            "type", "object",
                            "properties", Map.of(
                                    "sectionId", Map.of("type", "integer", "description", "ID de la sección")),
                            "required", List.of("sectionId"))),
            new LlmTool(
                    "list_student_invoices",
                    "Lista las facturas/cuotas de un alumno (concepto, monto, estado, vencimiento).",
                    Map.of(
                            "type", "object",
                            "properties", Map.of(
                                    "studentId", Map.of("type", "integer", "description", "ID numérico del alumno")),
                            "required", List.of("studentId"))),
            new LlmTool(
                    "list_calendar_events",
                    "Lista todos los eventos del calendario escolar (fechas, tipo, descripción).",
                    Map.of("type", "object", "properties", Map.of(), "required", List.of())),
            new LlmTool(
                    "list_academic_years",
                    "Lista los años académicos del colegio (nombre, fechas, si está activo).",
                    Map.of("type", "object", "properties", Map.of(), "required", List.of())));

    private final LlmClient llmClient;
    private final AssistantToolDispatcher toolDispatcher;
    private final AssistantUsageService assistantUsageService;
    private final PlanService planService;

    public AssistantService(LlmClient llmClient, AssistantToolDispatcher toolDispatcher,
                            AssistantUsageService assistantUsageService, PlanService planService) {
        this.llmClient = llmClient;
        this.toolDispatcher = toolDispatcher;
        this.assistantUsageService = assistantUsageService;
        this.planService = planService;
    }

    public ChatMessageDto chat(List<ChatMessageDto> history, SecurityUser principal) {
        assistantUsageService.checkAndIncrement(resolveMonthlyQuota());

        List<LlmMessage> messages = new ArrayList<>();
        for (ChatMessageDto turn : history) {
            messages.add(new LlmMessage(turn.role(), turn.content()));
        }

        String text = llmClient.chat(SYSTEM_PROMPT, messages, TOOLS,
                (toolName, input) -> {
                    var result = toolDispatcher.execute(toolName, input, principal);
                    return new LlmClient.ToolCallResult(result.content(), result.isError());
                });

        return new ChatMessageDto("assistant", text);
    }

    private int resolveMonthlyQuota() {
        // PlanService cache is shared with the @RequiresModule interceptor and the
        // StudentService capacity check, so this lookup is consistent across the
        // request lifecycle and survives TenantService.updatePlan via cache eviction.
        PlanFeatures features = planService.getCurrentFeatures();
        if (features.aiMessagesPerMonth() == 0) {
            // A plan with aiMessagesPerMonth == 0 means "module not enabled" for the
            // assistant — same observable as before this refactor, where the quota
            // resolved to 0. The @RequiresModule("assistant") guard upstream should
            // have already stopped the request, so getting here means a tenant on a
            // plan that has the module but an unset quota. Log it so ops can fix the
            // plan feature rather than wait for a support ticket.
            log.warn("Tenant resolved AI quota to 0 — plan features missing aiMessagesPerMonth");
        }
        return features.aiMessagesPerMonth();
    }
}
