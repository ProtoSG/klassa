package com.klassa.shared.exception;

/**
 * Centralized business error codes with Spanish (user-facing) message templates.
 * The code (enum name) is sent to the client for programmatic handling; the
 * formatted message is shown to the user. Keeps all messages in one place and
 * in one language.
 */
public enum ErrorCode {

    // --- Not found (404) ---
    NOT_FOUND("%s con id %d no encontrado"),
    NOT_FOUND_BY_FIELD("%s con %s '%s' no encontrado"),

    // --- Student ---
    STUDENT_CODE_TAKEN("El código de alumno '%s' ya está registrado"),
    STUDENT_ALREADY_INACTIVE("El alumno ya está inactivo"),
    STUDENT_ALREADY_ACTIVE("El alumno ya está activo"),

    // --- Photo upload ---
    PHOTO_EMPTY("El archivo está vacío"),
    PHOTO_INVALID_FORMAT("Formatos de imagen permitidos: JPEG, PNG"),
    PHOTO_TOO_LARGE("La imagen no debe superar 5 MB"),

    // --- Academic year ---
    ACADEMIC_YEAR_ALREADY_CLOSED("El año académico ya está cerrado"),
    ACADEMIC_YEAR_INVALID_DATES("La fecha de fin debe ser posterior a la fecha de inicio"),

    // --- Section / enrollment ---
    SECTION_AT_CAPACITY("La sección '%s' está llena (capacidad %d)"),
    SECTION_CAPACITY_BELOW_ACTIVE("No se puede reducir la capacidad por debajo de las matrículas activas (%d)"),
    ALREADY_ENROLLED("El alumno ya está matriculado en esta sección"),
    ENROLLMENT_NOT_ACTIVE("La matrícula no está activa"),
    ENROLLMENT_NOT_ACTIVE_TRANSFER("Solo se puede trasladar una matrícula activa"),

    // --- Teaching assignments ---
    SUBJECT_GRADE_LEVEL_MISMATCH("La materia no pertenece al grado de la sección"),
    USER_NOT_TEACHER("El usuario seleccionado no tiene el rol de docente"),

    // --- Calendar events ---
    CALENDAR_EVENT_INVALID_DATES("La fecha de fin debe ser igual o posterior a la fecha de inicio"),

    // --- Attendance / score ---
    ATTENDANCE_INACTIVE_ENROLLMENT("No se puede registrar asistencia en una matrícula inactiva"),
    SCORE_INACTIVE_ENROLLMENT("No se puede calificar una matrícula inactiva"),

    // --- Billing ---
    INVOICE_NOT_PAYABLE("No se puede pagar una factura con estado %s"),
    PAYMENT_EXCEEDS_BALANCE("El monto ingresado (%.2f) supera el saldo pendiente (%.2f)"),
    PAID_INVOICE_CANCEL("No se puede anular una factura pagada"),
    INVOICE_ALREADY_PAID("La factura %s ya está pagada"),
    INVOICE_CANCELLED("La factura %s está anulada"),

    // --- Family / guardian ---
    FAMILY_ALREADY_LINKED("La familia ya tiene un apoderado vinculado"),

    // --- Tenant ---
    SUBDOMAIN_TAKEN("El subdominio '%s' ya está en uso"),
    INVALID_TENANT_TRANSITION("No se puede cambiar el estado de %s a %s"),
    PLAN_BELOW_CURRENT_USAGE("El colegio tiene %d alumnos activos, más que el límite de %d del nuevo plan"),
    TENANT_NOT_CANCELLED("Solo se pueden purgar los datos de un colegio cancelado"),
    TENANT_ALREADY_PURGED("Los datos de este colegio ya fueron purgados"),

    // --- User / auth ---
    EMAIL_TAKEN("El correo '%s' ya está registrado"),
    INVALID_CREDENTIALS("Credenciales inválidas"),
    PASSWORD_CHANGE_REQUIRED("Debes cambiar tu contraseña antes de continuar"),
    ACCESS_DENIED("Acceso denegado");

    private final String messageTemplate;

    ErrorCode(String messageTemplate) {
        this.messageTemplate = messageTemplate;
    }

    public String format(Object... args) {
        return args.length == 0 ? messageTemplate : messageTemplate.formatted(args);
    }
}
