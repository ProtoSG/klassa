# Product Requirements Document (PRD) — Klassa

| Campo | Valor |
|---|---|
| Producto | **Klassa** — SaaS ERP escolar multi-tenant |
| Versión doc | 1.0 |
| Fecha | 2026-06-25 |
| Estado | En desarrollo (MVP funcional) |
| Owner | Equipo Klassa |

---

## 1. Resumen ejecutivo

Klassa es un **ERP escolar entregado como SaaS** para colegios de educación básica
(inicial, primaria, secundaria). Cada colegio es un *tenant* aislado con su propio
schema PostgreSQL. Una empresa operadora (la "plataforma") da de alta colegios,
les asigna un plan comercial y cobra una suscripción mensual; cada colegio administra
de forma autónoma alumnos, secciones, asistencia, calificaciones y cobranzas.

El producto resuelve tres dolores concretos del colegio pequeño/mediano de LatAm:

1. **Gestión académica fragmentada** — matrículas, notas y asistencia en hojas de cálculo sueltas.
2. **Cobranza manual** — pensiones cobradas con recibos en papel, sin trazabilidad de morosidad.
3. **Costo de TI** — no pueden mantener servidores ni software propio.

## 2. Objetivos y métricas de éxito

| Objetivo | Métrica (North Star) | Meta MVP |
|---|---|---|
| Onboarding de colegios sin fricción | Tiempo desde alta a primer alumno cargado | < 30 min |
| Cobranza trazable | % de facturas con estado correcto y automático | 100% |
| Adopción diaria | Usuarios activos diarios por colegio (docentes) | ≥ 60% del staff |
| Aislamiento y confianza | Incidentes de fuga de datos entre tenants | 0 |
| Conversión comercial | Tenants que pasan de TRIAL a ACTIVE | ≥ 40% |

## 3. Usuarios y roles

El sistema tiene **dos planos de identidad**: usuarios de plataforma y usuarios de colegio.

### 3.1 Plano plataforma (schema `platform`)

| Rol | Descripción | Capacidades |
|---|---|---|
| `PLATFORM_ADMIN` | Operador del SaaS | Alta/baja de colegios, asignar planes, cambiar estado de tenant (TRIAL/ACTIVE/SUSPENDED/CANCELLED), ver catálogo de planes |

### 3.2 Plano colegio (schema `{subdomain}`)

| Rol | Persona | Capacidades principales |
|---|---|---|
| `ADMIN` | Director / coordinador | Todo dentro del colegio: usuarios, años académicos, grados, secciones, alumnos, matrícula, asistencia, notas, cobranza |
| `TEACHER` | Docente | Alumnos (lectura), asistencia, registro de notas de sus secciones |
| `TREASURER` | Tesorería | Esquemas de cobro, generación de facturas, registro de pagos |
| `PARENT` | Apoderado | (Rol previsto) consulta de notas, asistencia y estado de cuenta de sus hijos |

> **Estado actual:** la navegación del frontend habilita módulos para `ADMIN`,
> `TEACHER` y `TREASURER`. El rol `PARENT` está modelado en BD y JWT pero su
> portal aún no está implementado (ver Roadmap §9).

## 4. Alcance del MVP

### 4.1 Dentro de alcance (implementado)

- **Multi-tenancy schema-per-tenant** con provisión automática del schema al crear un colegio.
- **Gestión de plataforma:** catálogo de planes (Starter/Pro/Enterprise), alta de tenants, ciclo de vida del tenant.
- **Autenticación:** JWT en cookie HttpOnly + flujo obligatorio de cambio de contraseña en el primer login.
- **Usuarios del colegio** con roles.
- **Académico:** años académicos, grados, secciones (con tutor y capacidad), materias.
- **Alumnos y familias:** ficha del alumno, foto (almacenamiento S3/MinIO), apoderado.
- **Matrícula:** inscripción de alumno en sección, traslado entre secciones.
- **Asistencia:** registro diario por estado (presente/ausente/tarde/justificado) y % de asistencia.
- **Calificaciones:** notas 0–20 por materia y periodo (1–4), una nota por enrollment/materia/periodo.
- **Cobranza:** esquemas de cobro (pensiones), generación masiva de facturas, registro de pagos multi-método (efectivo, transferencia, tarjeta, Yape, Plin), cálculo de estado (PENDING/PAID/PARTIAL/OVERDUE/CANCELLED) y job nocturno de morosidad.
- **Landing page** comercial (marketing del SaaS).

### 4.2 Fuera de alcance (MVP)

- Portal de apoderados (PARENT).
- Cobro en línea / pasarela de pago real (los pagos se registran manualmente).
- Reportes/analítica avanzada (incluidos en planes Pro/Enterprise como feature flag, sin UI aún).
- Horarios de clase, mensajería interna, biblioteca, transporte.
- App móvil nativa (la UI web es responsive con navegación inferior tipo móvil).

## 5. Requisitos funcionales

### RF-1 — Gestión de plataforma
- RF-1.1 El `PLATFORM_ADMIN` autenticado puede crear un colegio indicando subdominio, nombre, plan y días de trial.
- RF-1.2 Al crear el colegio se aprovisiona automáticamente su schema con todas las tablas.
- RF-1.3 Se crea un usuario `ADMIN` del colegio con contraseña temporal mostrada **una sola vez**.
- RF-1.4 El estado del tenant transiciona entre TRIAL → ACTIVE → SUSPENDED → CANCELLED.
- RF-1.5 El catálogo de planes (`GET /api/plans`) es público.

### RF-2 — Autenticación y sesión
- RF-2.1 Login devuelve cookie `klassa_token` (HttpOnly, SameSite=Lax) y soporta `Authorization: Bearer`.
- RF-2.2 El primer login de un usuario con `must_change_password = true` retorna `403 PASSWORD_CHANGE_REQUIRED`.
- RF-2.3 El usuario debe cambiar la contraseña antes de operar; tras el cambio recibe sesión válida.
- RF-2.4 El tenant se identifica por header `X-Tenant-Subdomain` (dev) o subdominio del Host (prod).

### RF-3 — Académico
- RF-3.1 Un colegio define años académicos (solo uno activo conceptualmente), grados y materias por grado.
- RF-3.2 Las secciones pertenecen a un grado y año, con tutor opcional y capacidad (1–100).
- RF-3.3 Un alumno se matricula en una sección; no puede matricularse dos veces en la misma sección.

### RF-4 — Asistencia
- RF-4.1 Se registra asistencia por matrícula y fecha con estado del enum.
- RF-4.2 El sistema calcula el porcentaje de asistencia por alumno.

### RF-5 — Calificaciones
- RF-5.1 Notas en rango 0–20, periodo 1–4.
- RF-5.2 Una sola nota por (matrícula, materia, periodo); reintentos actualizan.

### RF-6 — Cobranza
- RF-6.1 Se definen esquemas de cobro (concepto, monto, día de vencimiento, año académico).
- RF-6.2 Generación masiva de facturas para alumnos activos.
- RF-6.3 Registro de pagos con método; el estado de la factura se recalcula (PARTIAL/PAID).
- RF-6.4 Job nocturno (00:05) marca como OVERDUE las facturas vencidas no pagadas.
- RF-6.5 Las facturas usan numeración única y bloqueo optimista (versión) para evitar doble pago.

## 6. Requisitos no funcionales

| Categoría | Requisito |
|---|---|
| **Seguridad** | Aislamiento de datos por schema; JWT firmado HS256; passwords con hash; cookie HttpOnly; CORS restringido a orígenes conocidos. |
| **Privacidad** | Datos de menores: cada colegio solo ve su propio schema; el platform admin no accede a datos académicos del tenant. |
| **Rendimiento** | Java 21 virtual threads; pool Hikari 20; cache Redis (TTL 600 s); índices en columnas de filtro. |
| **Escalabilidad** | Schema-per-tenant sobre una instancia Postgres; crecimiento horizontal por sharding de tenants a futuro. |
| **Disponibilidad** | Healthcheck `/actuator/health`; infra dockerizada con healthchecks. |
| **Usabilidad** | UI responsive, navegación inferior móvil, idioma español, sistema de diseño Klassa (cálido y accesible). |
| **Observabilidad** | Actuator (health/info/metrics); logs de jobs de cobranza. |
| **Límites** | Subida de archivos ≤ 5 MB (10 MB request); `max_students` por plan. |

## 7. Reglas de negocio clave

- **BR-1** Un colegio no puede superar el `max_students` de su plan (Starter 100, Pro 500, Enterprise ilimitado).
- **BR-2** Notas válidas 0–20; asistencia y notas siempre ligadas a una matrícula activa.
- **BR-3** Un alumno = una matrícula por sección (constraint único).
- **BR-4** Estados de factura derivados de pagos; no se editan a mano salvo cancelación.
- **BR-5** Contraseña temporal de un solo uso; cambio obligatorio antes de operar.
- **BR-6** El subdominio es inmutable e identifica el schema del colegio.

## 8. Planes comerciales

| Plan | Máx. alumnos | Precio/mes (USD) | Módulos |
|---|---|---|---|
| Starter | 100 | 49.00 | students, attendance, scores |
| Pro | 500 | 129.00 | + billing, reports |
| Enterprise | Ilimitado | 299.00 | + api |

## 9. Roadmap (post-MVP)

1. **Portal de apoderados (PARENT):** consulta de notas, asistencia y estado de cuenta.
2. **Pasarela de pago** (Yape/Plin/tarjeta en línea) con conciliación automática.
3. **Reportes y analítica** (libreta de notas PDF, reporte de morosidad, dashboards).
4. **Horarios y carga docente.**
5. **Notificaciones** (email/WhatsApp) de pagos y ausencias.
6. **Enforcement de cuotas por plan** y facturación del SaaS a los colegios.

## 10. Documentos relacionados

- `technical_requirements_document.md` — arquitectura y stack.
- `esquema_base_datos.md` — modelo de datos.
- `diagrama_flujo_usuario.md` — flujos de usuario.
- `design_system_document.md` — sistema de diseño Klassa.
- `plan_implementacion.md` — plan de entrega.
