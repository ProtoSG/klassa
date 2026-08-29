# Plan de Implementación — Klassa

| Campo | Valor |
|---|---|
| Versión doc | 1.1 — 2026-08-16 |
| Estado | MVP funcional; carga docente, calendario, notificaciones, asistente IA y portal parent entregados; endurecimiento en curso |

---

## 1. Estrategia general

Entrega incremental por **vertical slices** (cada feature atraviesa BD → backend → frontend).
El núcleo multi-tenant se construyó primero porque condiciona todo lo demás; sobre él se
apilan los módulos de dominio en orden de dependencia
(académico → alumnos → matrícula → asistencia/notas → cobranza).

```
Fase 0 ─ Infra & multitenancy             ← base (hecho)
Fase 1 ─ Plataforma & auth                ← hecho
Fase 2 ─ Académico                        ← hecho
Fase 3 ─ Alumnos & matrícula              ← hecho
Fase 4 ─ Asistencia & notas               ← hecho
Fase 5 ─ Cobranza                         ← hecho
Fase 6 ─ Landing & UI system              ← hecho
Fase 6b ─ Carga docente, calendario,      ← hecho
        notificaciones, asistente IA
Fase 7 ─ Endurecimiento prod              ← en curso
Fase 8 ─ Portal apoderados (PARENT)       ← hecho
Fase 9 ─ Pagos en línea & reportes        ← pendiente
```

---

## 2. Fases y entregables

### Fase 0 — Infraestructura y multi-tenancy ✅
- `docker-compose.dev.yml`: PostgreSQL 16, Redis 7, MinIO.
- Spring Boot 3.5 + Java 21 (virtual threads), Hikari, Redis cache.
- Multitenancy SCHEMA: `TenantContext`, `TenantInterceptor`, `TenantIdentifierResolver`, `SchemaMultiTenantProvider`.
- Flyway: schema `platform` (`db/migration`) + plantilla `template_tenant` (`db/tenant`).
- **Criterio de aceptación:** un request con `X-Tenant-Subdomain` resuelve el `search_path` correcto y aísla datos.

### Fase 1 — Plataforma, planes y autenticación ✅
- Tablas `plans`, `tenants`, `platform_users`; seed de 3 planes (V9).
- `PlatformDataInitializer`: seed idempotente del admin de plataforma.
- Provisión de tenant: crea schema + usuario ADMIN con contraseña temporal.
- JWT HS256 en cookie HttpOnly + Bearer; claims `userId/email/tenantId/role`.
- Flujo `must_change_password` → `403 PASSWORD_CHANGE_REQUIRED` (V7).
- **Aceptación:** flujo completo del README §1–§6 funciona end-to-end.

### Fase 2 — Académico ✅
- Años académicos, grados (`grade_level_type`), secciones (tutor + capacidad), materias.
- Controllers/Services/Repositories + MapStruct + DTOs.
- **Aceptación:** se puede construir la estructura académica de un año.

### Fase 3 — Alumnos, familias y matrícula ✅
- Ficha de alumno + familia; foto a S3/MinIO (Thumbnailator).
- Matrícula con constraint único por sección; traslado entre secciones.
- **Aceptación:** alumno creado, matriculado y trasladado sin duplicar matrícula.

### Fase 4 — Asistencia y calificaciones ✅
- Asistencia por matrícula/fecha/estado + % de asistencia.
- Notas 0–20, periodo 1–4, único por (enrollment, materia, periodo).
- **Aceptación:** registro y consulta consistentes con los check constraints.

### Fase 5 — Cobranza ✅
- Esquemas de cobro, generación masiva de facturas, pagos multi-método.
- Recalculo de estado (PENDING/PARTIAL/PAID); bloqueo optimista `invoice.version` (V8).
- `BillingScheduler` cron `0 5 0 * * *` → `markOverdue`.
- **Aceptación:** un pago parcial deja PARTIAL; pago total deja PAID; vencidas pasan a OVERDUE.

### Fase 6 — Landing y sistema de diseño ✅
- Landing comercial (`_landing/*`), sistema de diseño Klassa (Tailwind v4, shadcn).
- Navegación por rol (`BottomNav`, `nav-items.ts`).
- **Aceptación:** UI responsive, accesible, idioma español.

### Fase 6b — Carga docente, calendario, notificaciones y asistente IA ✅
- **Carga docente:** tabla `teaching_assignments` (V12); `TeachingAssignmentController/Service`; UI `/cursos`.
- **Calendario:** tabla `calendar_events` + ENUM `calendar_event_type` (V13); `CalendarEventController`; UI `/calendar`.
- **Notificaciones in-app:** tabla `notifications` (V15); `NotificationController/Service`; `notifications` consumidas por la home del portal/parental.
- **Asistente IA:** paquete `assistant/` (`AssistantController`, `AssistantService`, `AnthropicClient`, `OpenRouterClient`, `AssistantTools` con function-calling); cuota por plan vía `plans.features.aiMessagesPerMonth` (V11) y contadores en `ai_usage_counters` (V14).
- **Aceptación:** el colegio puede asignar docentes, gestionar el calendario, recibir notificaciones in-app y usar el asistente con su cuota.

### Fase 7 — Endurecimiento para producción 🔄 (en curso)
- [x] `JWT_SECRET` fuera del repo (`.env.dev` no trackeado desde `54f3fb5`); ⚠️ **rotar el valor actual** porque sigue en el histórico de `aebb0be`.
- [ ] `cookie-secure=true` + HTTPS en prod — aplicado en `application.yml` (`prod`) pero falta smoke test E2E.
- [x] Resolución de tenant por subdominio del Host en prod (`TenantInterceptor.resolveRequestedTenant`).
- [ ] Política de `max_students` por plan (enforcement real) — `BR-1` sin implementar.
- [ ] Estrategia de migración Flyway sobre **todos** los schemas de tenant en cada release — `TenantMigrationRunner` existe pero falta patrón resumible/paralelo.
- [ ] Backups de PostgreSQL y del bucket S3; retención.
- [ ] Observabilidad: métricas Actuator + alertas; logs estructurados.
- [ ] Tests de integración multi-tenant (aislamiento) y de cobranza (concurrencia) — `TenantInterceptorTest` (135) e `InvoiceTest` (105) cubren los flujos happy-path; faltan tests de concurrencia.
- [x] Rate limiting (`shared/security/AuthRateLimiter`) — falta endurecer CORS para dominios de producción.

### Fase 8 — Portal de apoderados (PARENT) ✅
- [x] Vistas de notas, asistencia, pagos y calendario del hijo (`app/(parent)/portal/{page,notas,asistencia,pagos,calendario}`).
- [x] Restricción de datos al núcleo familiar del usuario (`families.guardian_user_id` leído en queries; UI filtra por hijos).
- [x] Onboarding del apoderado (sub-flujo de "vincular familia" desde el lado admin) — `CreateParentAccessDialog`, `LinkExistingFamilyDialog`, `SiblingSearchPicker`.

### Fase 9 — Pagos en línea y reportes ⏳
- [ ] Integración de pasarela (Yape/Plin/tarjeta) + conciliación.
- [ ] Reportes PDF (libreta de notas, recibos), reporte de morosidad.
- [ ] Dashboards (feature de planes Pro/Enterprise).
- [ ] Facturación del SaaS a los colegios (cobro de la suscripción).
- Ver detalle en `plan_implementacion_modulo_reportes.md` y `contrato_eventos_kafka.md`.

---

## 3. Dependencias entre fases

```
Fase 0 ──► Fase 1 ──► Fase 2 ──► Fase 3 ──► Fase 4
                          │                     │
                          └──────► Fase 5 ◄─────┘
Fase 6 (paralela a 2–5)
Fase 6b (paralela a 5–6) ──► carga docente, calendario, notificaciones, asistente IA
Fase 7 depende de 1–6b estables
Fase 8 depende de 6b (notifications + guardian_user_id)
Fase 9 depende de 7
```

---

## 4. Entornos y despliegue

| Entorno | Infra | Notas |
|---|---|---|
| Local/dev | Docker Compose (PG/Redis/MinIO) + `./mvnw spring-boot:run` + `bun run dev` | Swagger habilitado, `cookie-secure=false`, tenant por header |
| Staging | Réplica de prod | Validar migraciones de tenant antes de release |
| Producción | PostgreSQL gestionado, Redis, almacenamiento S3, HTTPS | Tenant por subdominio, secretos en gestor, backups |

Scripts: `start-dev.sh` / `stop-dev.sh` en la raíz orquestan backend + frontend en local.

---

## 5. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Migración inconsistente entre schemas de tenant | Alto | Pipeline que aplica `db/tenant` a cada schema; validar en staging |
| Crecimiento de schemas en una instancia | Medio | Monitoreo + plan de sharding por instancia |
| Secretos por defecto en dev usados en prod | Alto | Checklist de release: rotar `JWT_SECRET`, credenciales y keys S3 |
| Doble pago / condición de carrera en cobranza | Medio | Bloqueo optimista `invoice.version` + numeración única |
| Next.js 16 breaking changes | Medio | Regla `AGENTS.md`: leer docs locales antes de codificar |

---

## 6. Definición de "Hecho" (DoD) por slice

- [ ] Migración Flyway versionada (si toca BD).
- [ ] Backend: Controller + Service + Repository + DTO + Mapper, con validación.
- [ ] Frontend: feature slice (`api/actions/schemas/types/components`) integrado.
- [ ] Reglas de negocio cubiertas por check constraints o validación de servicio.
- [ ] Aislamiento de tenant verificado.
- [ ] Probado vía Bruno (`klassa-backend/bruno/`) o test automatizado.

---

## 7. Documentos relacionados

- `product_requierements_document.md` · `technical_requirements_document.md`
- `esquema_base_datos.md` · `diagrama_flujo_usuario.md` · `design_system_document.md`
