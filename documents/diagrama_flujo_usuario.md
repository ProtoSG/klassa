# Diagrama de Flujo de Usuario — Klassa

| Campo | Valor |
|---|---|
| Versión doc | 1.0 — 2026-06-25 |
| Alcance | Flujos de plataforma y de colegio (MVP) |

---

## 1. Mapa de actores y áreas

```
┌──────────────────────────────────────────────────────────────┐
│  klassa.com (landing)                                         │
│     ▼                                                         │
│  ┌──────────────┐         ┌──────────────────────────────┐  │
│  │  /platform   │         │  {subdomain}.klassa.com       │  │
│  │  PLATFORM_ADMIN         │  ADMIN / TEACHER / TREASURER  │  │
│  └──────────────┘         │  / PARENT (futuro)            │  │
│                           └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Flujo A — Onboarding de un colegio (PLATFORM_ADMIN)

```
[Landing] ──► [/platform/login]
                   │ POST /api/platform/auth/login
                   ▼
            ¿credenciales válidas?
              │no► error
              │sí
              ▼
        [/platform/dashboard]  (StatsCards + TenantTable)
                   │
                   ▼ "Nuevo colegio"
        [/platform/tenants/new]
                   │ POST /api/tenants
                   │   {subdomain, name, planId, trialDays, adminEmail, ...}
                   ▼
        Backend: provisiona schema {subdomain}
                 + crea usuario ADMIN (must_change_password=true)
                   │
                   ▼
        Respuesta 201 → muestra tempPassword UNA sola vez
                   │
                   ▼
        [/platform/tenants/{subdomain}]  (detalle, estado TRIAL)
                   │ PATCH /api/tenants/{subdomain}/status
                   ▼
        TRIAL ──► ACTIVE ──► SUSPENDED ──► CANCELLED
```

**Estados del tenant:**

```
        crear                activar              suspender           cancelar
  ●───► TRIAL ─────────────► ACTIVE ────────────► SUSPENDED ────────► CANCELLED
          │                    ▲                      │
          └── trial vence ─────┘  reactivar ──────────┘
```

---

## 3. Flujo B — Primer acceso del director (ADMIN del colegio)

```
[/auth/login]  (header X-Tenant-Subdomain: colegio-demo)
     │ POST /api/auth/login {email, tempPassword}
     ▼
 ¿must_change_password?
   │sí► 403 PASSWORD_CHANGE_REQUIRED
   │       ▼
   │   [/auth/change-password]
   │       │ PUT /api/auth/change-password {current, new}
   │       ▼
   │   200 + cookie klassa_token  ──┐
   │no──────────────────────────────┤
   ▼                                 ▼
[/dashboard]  (sesión iniciada, BottomNav según rol)
```

---

## 4. Flujo C — Login normal y sesión

```
[/auth/login] ─ POST /api/auth/login ─► cookie HttpOnly klassa_token (24h)
     │                                   + klassa_subdomain
     ▼
SessionInitializer hidrata Zustand (userId, email, role, tenant)
     ▼
BottomNav filtra módulos por rol:
   ADMIN     → Inicio, Alumnos, Académico, Asistencia, Cobros, Usuarios
   TEACHER   → Inicio, Alumnos, Académico, Asistencia
   TREASURER → Inicio, Cobros
   PARENT    → Inicio (portal pendiente)
     ▼
[Logout] POST /api/auth/logout → limpia cookie → [/auth/login]
```

---

## 5. Flujo D — Configuración académica (ADMIN)

```
[/academic-years]
   │ crear Año Académico (start/end, activar)
   ▼
crear Grados (INITIAL/PRIMARY/SECONDARY) ──► crear Materias por grado
   ▼
crear Secciones (grado + año + tutor + capacidad)
   ▼
[/academic-years/sections/{id}]  ── gestionar matrículas de la sección
```

---

## 6. Flujo E — Alta de alumno y matrícula (ADMIN / TEACHER)

```
[/students] ──► "Nuevo alumno"
     │ POST /api/students  (+ familia opcional, + foto → S3)
     ▼
[/students/{id}]  (ficha: datos, familia, foto, matrículas)
     │
     ▼ "Matricular"
EnrollStudentDialog ─ POST /api/enrollments {student, section}
     │  (constraint: 1 matrícula por sección)
     ▼
Alumno activo en la sección
     │
     ├──► Traslado: TransferEnrollmentDialog (WITHDRAWN en origen, ACTIVE en destino)
     └──► Cambio de estado: ACTIVE / INACTIVE / TRANSFERRED
```

---

## 7. Flujo F — Asistencia diaria (TEACHER / ADMIN)

```
[/attendance]
   │ seleccionar sección + fecha
   ▼
listar matrículas activas ──► marcar estado por alumno
   │  (PRESENT / ABSENT / LATE / JUSTIFIED, + nota)
   ▼ POST /api/attendance
guardar registros
   ▼
EnrollmentAttendanceSummary ── % de asistencia por alumno
```

---

## 8. Flujo G — Calificaciones (TEACHER / ADMIN)

```
[/academic-years/sections/{id}]  ──► SectionScores
   │ seleccionar materia + periodo (1–4)
   ▼
NewScoreDialog ─ POST /api/scores {enrollment, subject, period, score 0–20}
   │  (constraint único enrollment+subject+period → actualiza si existe)
   ▼
ScoreTable muestra notas consolidadas
```

---

## 9. Flujo H — Cobranza (TREASURER / ADMIN)

```
[/billing]
   │
   ├─ FeeSchedules: crear esquema de cobro (concepto, monto, día venc., año)
   │
   ├─ "Generar facturas del mes"
   │     GenerateMonthlyDialog ─ POST genera invoices para alumnos activos
   │     ▼  estado inicial: PENDING
   │
   ├─ InvoicesSection: lista facturas (badge de estado)
   │     │ "Registrar pago"
   │     ▼ RegisterPaymentDialog ─ POST /api/billing/payments {método, monto}
   │        (bloqueo optimista por invoice.version)
   │     ▼
   │   recalcular estado:  pago parcial → PARTIAL   |   total → PAID
   │
   └─ PaymentHistoryDialog: historial de pagos por factura

  [Job nocturno 00:05]  markOverdue → facturas vencidas no pagadas → OVERDUE
```

**Ciclo de vida de una factura:**

```
                  pago parcial        pago total
  PENDING ──────► PARTIAL ──────────► PAID
     │                │
     │ vence          │ vence
     ▼                ▼
   OVERDUE ◄──────────┘        (cualquiera) ──cancelar──► CANCELLED
```

---

## 10. Flujo I — Gestión de usuarios del colegio (ADMIN)

```
[/users]
   │ "Nuevo usuario"
   ▼ UserFormDialog ─ POST /api/users {email, rol, nombre}
   │  (se crea con contraseña temporal, must_change_password=true)
   ▼
UsersClient lista usuarios con UserRoleBadge
   └─ editar / activar-desactivar
```

---

## 11. Resumen de rutas (frontend)

| Área | Rutas |
|---|---|
| Pública | `/` (landing), `/auth/login`, `/auth/change-password` |
| Plataforma | `/platform/login`, `/platform/dashboard`, `/platform/tenants/new`, `/platform/tenants/{subdomain}` |
| Colegio | `/dashboard`, `/students`, `/students/{id}`, `/academic-years`, `/academic-years/sections/{id}`, `/attendance`, `/billing`, `/users` |

---

## 12. Documentos relacionados

- `product_requierements_document.md` — roles y reglas de negocio.
- `technical_requirements_document.md` — multitenancy y autenticación.
- `esquema_base_datos.md` — tablas que respaldan cada flujo.
