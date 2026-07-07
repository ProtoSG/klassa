# Esquema de Base de Datos — Klassa

| Campo | Valor |
|---|---|
| Motor | PostgreSQL 16 |
| Estrategia | Multi-tenant **schema-per-tenant** |
| Migraciones | Flyway (`db/migration` = platform, `db/tenant` = colegio) |
| Versión doc | 1.0 — 2026-06-25 |

---

## 1. Modelo de schemas

```
PostgreSQL (instancia única)
├── platform                ← datos globales del SaaS
│   ├── plans
│   ├── tenants
│   └── platform_users
├── template_tenant         ← plantilla clonada al provisionar un colegio
└── {subdomain}             ← un schema por colegio (clon de template_tenant)
    ├── users
    ├── families
    ├── students
    ├── academic_years
    ├── grade_levels
    ├── sections
    ├── subjects
    ├── enrollments
    ├── scores
    ├── attendance_records
    ├── fee_schedules
    ├── invoices
    └── payments
```

**Convención de auditoría** (presente en casi todas las tablas, vía `BaseEntity` + triggers):
`user_created`, `date_created` (default `NOW()`), `user_updated`, `date_updated`
(actualizado por trigger `fn_update_date_updated()`).

Las claves primarias usan `BIGINT GENERATED ALWAYS AS IDENTITY` (o `BIGSERIAL`).

---

## 2. Schema `platform`

### 2.1 `plans`
Catálogo de planes comerciales del SaaS.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT PK | identity |
| name | VARCHAR(100) | Starter / Pro / Enterprise |
| max_students | INT | tope de alumnos del plan |
| price_monthly | DECIMAL(10,2) | precio mensual USD |
| features | JSONB | `{"modules": [...]}` |
| active | BOOLEAN | default TRUE |
| auditoría | — | índice `idx_plans_active` |

### 2.2 `tenants`
Cada colegio registrado.

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT PK | identity |
| subdomain | VARCHAR(50) UNIQUE | identifica el schema del colegio |
| name | VARCHAR(200) | nombre del colegio |
| status | VARCHAR(20) | `TRIAL`/`ACTIVE`/`SUSPENDED`/`CANCELLED` (check) |
| plan_id | BIGINT FK → plans.id | |
| trial_ends_at | TIMESTAMPTZ | fin del periodo de prueba |
| created_at | TIMESTAMPTZ | |
| auditoría | — | índices `idx_tenants_subdomain`, `idx_tenants_status` |

### 2.3 `platform_users`
Administradores de la plataforma (no pertenecen a ningún colegio).

| Columna | Tipo | Notas |
|---|---|---|
| id | BIGSERIAL PK | |
| email | VARCHAR(200) UNIQUE | |
| password_hash | VARCHAR(255) | |
| first_name / last_name | VARCHAR(100) | |
| role | VARCHAR(30) | default `PLATFORM_ADMIN` |
| active | BOOLEAN | default TRUE |
| auditoría | — | trigger `trg_platform_users_date_updated` |

---

## 3. Schema de colegio (`template_tenant` → `{subdomain}`)

### 3.1 Tipos ENUM

```sql
user_role         = ('ADMIN', 'TEACHER', 'TREASURER', 'PARENT')
student_gender    = ('M', 'F')
student_status    = ('ACTIVE', 'INACTIVE', 'TRANSFERRED')
grade_level_type  = ('INITIAL', 'PRIMARY', 'SECONDARY')
enrollment_status = ('ACTIVE', 'WITHDRAWN', 'TRANSFERRED')
attendance_status = ('PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED')
invoice_status    = ('PENDING', 'PAID', 'OVERDUE', 'PARTIAL', 'CANCELLED')
payment_method    = ('CASH', 'TRANSFER', 'CARD', 'YAPE', 'PLIN')
```

### 3.2 Tablas

#### `users` — staff y apoderados del colegio
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT PK | |
| email | VARCHAR(200) UNIQUE | |
| password_hash | VARCHAR(255) | |
| role | user_role | |
| first_name / last_name | VARCHAR(100) | |
| active | BOOLEAN | default TRUE |
| must_change_password* | BOOLEAN | añadido en `db/tenant/V7`; fuerza cambio en 1er login |

#### `families` — apoderados / núcleo familiar
| Columna | Tipo |
|---|---|
| id | BIGINT PK |
| guardian_name | VARCHAR(200) |
| guardian_email / guardian_phone | VARCHAR |
| address | TEXT |
| emergency_contact / emergency_phone | VARCHAR |

#### `students` — alumnos
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT PK | |
| code | VARCHAR(20) UNIQUE | código de alumno |
| first_name / last_name | VARCHAR(100) | |
| birth_date | DATE | check `< CURRENT_DATE` |
| gender | student_gender | |
| status | student_status | default ACTIVE |
| family_id | BIGINT FK → families.id | nullable |
| photo_url | VARCHAR(500) | foto en S3/MinIO |

#### `academic_years` — años lectivos
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT PK | |
| name | VARCHAR(100) | |
| start_date / end_date | DATE | check `end_date > start_date` |
| active | BOOLEAN | default FALSE |

#### `grade_levels` — grados
| Columna | Tipo |
|---|---|
| id | BIGINT PK |
| name | VARCHAR(100) |
| level | grade_level_type |
| sort_order | INT |

#### `sections` — secciones/aulas
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT PK | |
| name | VARCHAR(50) | |
| grade_level_id | BIGINT FK → grade_levels.id | |
| academic_year_id | BIGINT FK → academic_years.id | |
| homeroom_teacher_id | BIGINT FK → users.id | tutor, nullable |
| max_capacity | INT | default 30, check 1–100 |

#### `subjects` — materias
| Columna | Tipo |
|---|---|
| id | BIGINT PK |
| name | VARCHAR(100) |
| grade_level_id | BIGINT FK → grade_levels.id |
| hours_per_week | INT (default 1) |
| active | BOOLEAN |

#### `enrollments` — matrículas
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT PK | |
| student_id | BIGINT FK → students.id | |
| section_id | BIGINT FK → sections.id | |
| enrolled_at | TIMESTAMPTZ | |
| status | enrollment_status | default ACTIVE |
| | | **UNIQUE (student_id, section_id)** |

#### `scores` — calificaciones
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT PK | |
| enrollment_id | BIGINT FK → enrollments.id | |
| subject_id | BIGINT FK → subjects.id | |
| period | INT | check 1–4 |
| score | DECIMAL(4,2) | check 0–20 |
| created_by | BIGINT FK → users.id | |
| | | **UNIQUE (enrollment_id, subject_id, period)** |

#### `attendance_records` — asistencia
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT PK | |
| enrollment_id | BIGINT FK → enrollments.id | |
| date | DATE | |
| status | attendance_status | |
| note | TEXT | justificación |
| registered_by | BIGINT FK → users.id | |

#### `fee_schedules` — esquemas de cobro (pensiones)
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT PK | |
| concept | VARCHAR(200) | p.ej. "Pensión marzo" |
| amount | DECIMAL(10,2) | check > 0 |
| due_day | INT | check 1–31 |
| academic_year_id | BIGINT FK → academic_years.id | |
| active | BOOLEAN | |

#### `invoices` — facturas
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT PK | |
| invoice_number | VARCHAR(50) UNIQUE | numeración |
| student_id | BIGINT FK → students.id | |
| fee_schedule_id | BIGINT FK → fee_schedules.id | nullable |
| concept | VARCHAR(200) | |
| amount | DECIMAL(10,2) | check > 0 |
| due_date | DATE | |
| status | invoice_status | default PENDING |
| version* | BIGINT | bloqueo optimista (`db/tenant/V8`) |

#### `payments` — pagos
| Columna | Tipo | Notas |
|---|---|---|
| id | BIGINT PK | |
| invoice_id | BIGINT FK → invoices.id | |
| amount | DECIMAL(10,2) | check > 0 |
| payment_date | DATE | |
| method | payment_method | |
| receipt_number | VARCHAR(100) | |
| registered_by | BIGINT FK → users.id | |
| notes | TEXT | |

\* Columnas añadidas en migraciones posteriores (`V7` must_change_password, `V8` invoice version).

---

## 4. Diagrama de relaciones (schema de colegio)

```
families ──< students ──< enrollments >── sections >── grade_levels
                                 │              │            │
                                 │              └─ academic_years
                                 ├──< scores >── subjects ───┘
                                 └──< attendance_records

academic_years ──< fee_schedules
students ──< invoices ──< payments
users ── (homeroom_teacher / created_by / registered_by)
```

Leyenda: `A ──< B` = uno-a-muchos (A es padre), `>──` = muchos-a-uno hacia el padre.

---

## 5. Restricciones e integridad (resumen)

| Tipo | Regla |
|---|---|
| CHECK | `scores.score` 0–20, `scores.period` 1–4 |
| CHECK | `payments.amount > 0`, `invoices.amount > 0`, `fee_schedules.amount > 0` |
| CHECK | `fee_schedules.due_day` 1–31, `sections.max_capacity` 1–100 |
| CHECK | `students.birth_date < CURRENT_DATE`, `academic_years.end_date > start_date` |
| CHECK | `tenants.status ∈ {TRIAL, ACTIVE, SUSPENDED, CANCELLED}` |
| UNIQUE | `enrollments (student_id, section_id)` |
| UNIQUE | `scores (enrollment_id, subject_id, period)` |
| UNIQUE | `students.code`, `users.email`, `invoices.invoice_number`, `tenants.subdomain` |
| OPTIMISTIC LOCK | `invoices.version` |

---

## 6. Migraciones Flyway

| Carpeta | Versiones | Contenido |
|---|---|---|
| `db/migration` (platform) | V1–V9 | Schema platform, tablas globales, funciones/procedimientos, platform_users (V8), seed de planes (V9) |
| `db/tenant` (por colegio) | V1–V8 | Tablas base (V1), índices (V2), check constraints (V3), audit triggers (V4), funciones (V5), procedimientos (V6), `must_change_password` (V7), `invoice.version` (V8) |

> Las migraciones de `db/tenant` se aplican sobre cada schema de colegio en el momento de
> la provisión y en cada despliegue que cambie su estructura.

---

## 7. Documentos relacionados

- `technical_requirements_document.md` — arquitectura multitenant.
- `product_requierements_document.md` — reglas de negocio.
- `diagrama_flujo_usuario.md` — flujos que consumen estas tablas.
