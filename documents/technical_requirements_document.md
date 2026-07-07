# Technical Requirements Document (TRD) — Klassa

| Campo | Valor |
|---|---|
| Producto | Klassa — SaaS ERP escolar multi-tenant |
| Versión doc | 1.0 |
| Fecha | 2026-06-25 |
| Repos | `klassa-backend` (Spring Boot), `klassa-frontend` (Next.js) |

---

## 1. Visión de arquitectura

Klassa es una aplicación de **dos servicios desplegables** sobre infraestructura compartida:

```
                   ┌─────────────────────────────────────────────┐
   Navegador  ───► │  klassa-frontend (Next.js 16 / React 19)     │
   (apoderado,     │  - SSR + Server Actions + BFF proxy          │
    docente,       │  - Cookie HttpOnly klassa_token              │
    director)      └───────────────┬─────────────────────────────┘
                                    │  HTTP /api  (Bearer/cookie + X-Tenant-Subdomain)
                                    ▼
                   ┌─────────────────────────────────────────────┐
                   │  klassa-backend (Spring Boot 3.5 / Java 21)  │
                   │  - REST API   - JWT auth   - Multitenancy    │
                   └───┬───────────────┬───────────────┬──────────┘
                       ▼               ▼               ▼
                ┌────────────┐  ┌────────────┐  ┌────────────┐
                │ PostgreSQL │  │  Redis 7   │  │ S3 / MinIO │
                │ schema/    │  │  cache     │  │ fotos      │
                │ tenant     │  │            │  │            │
                └────────────┘  └────────────┘  └────────────┘
```

## 2. Stack tecnológico

### 2.1 Backend (`klassa-backend`)

| Capa | Tecnología | Notas |
|---|---|---|
| Runtime | Java 21 | Virtual threads habilitados (`spring.threads.virtual.enabled`) |
| Framework | Spring Boot 3.5.1 | Web, Data JPA, Security, Validation, Actuator, Data Redis |
| BD | PostgreSQL 16 | **Multitenancy SCHEMA** (Hibernate `multiTenancy: SCHEMA`) |
| Migraciones | Flyway | `db/migration` (platform) + `db/tenant` (por colegio) |
| Cache | Redis 7 | `spring.cache.type=redis`, TTL 600 s |
| Auth | JWT (jjwt) HS256 | Cookie `klassa_token` HttpOnly + Bearer |
| Mapeo | MapStruct + Lombok | DTO ↔ entidad |
| Almacenamiento | AWS SDK S3 / MinIO | Fotos de alumnos, thumbnails (Thumbnailator) |
| API Docs | springdoc OpenAPI / Swagger | Solo en perfil `dev` (`/swagger-ui.html`) |
| Build | Maven (`./mvnw`) | `spring-boot-maven-plugin` |

### 2.2 Frontend (`klassa-frontend`)

| Capa | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 16.2 (App Router) | **Versión con breaking changes** — consultar `node_modules/next/dist/docs/` antes de codificar (ver `AGENTS.md`) |
| UI | React 19.2 | Server Components + Server Actions |
| Estilos | Tailwind CSS v4 + tw-animate-css | Sistema de diseño Klassa (tokens en `globals.css`) |
| Componentes | shadcn + Radix Slot + Base UI | `components/ui/*` |
| Formularios | react-hook-form + Zod | Validación cliente/servidor compartida (`schemas.ts`) |
| Estado | Zustand | Sesión de usuario (`shared/store/session.ts`) |
| Iconos | lucide-react | |
| Toasts | sonner | |
| Temas | next-themes | |
| Runtime/Build | Bun (`bun.lock`) | `next dev --hostname 0.0.0.0` |

## 3. Multi-tenancy (núcleo del sistema)

Estrategia: **schema-per-tenant** sobre una sola base de datos.

```
Request → TenantInterceptor → TenantContext (ThreadLocal)
                                    │
                                    ▼
                         JwtAuthFilter (sobreescribe tenant con claim del JWT)
                                    │
                                    ▼
              TenantIdentifierResolver → SET search_path TO "{tenant}"
```

- **Identificación del tenant:**
  - Dev: header `X-Tenant-Subdomain: <subdomain>`.
  - Prod: subdominio del `Host` (`colegio.klassa.com` → `colegio`).
- **`TenantContext`** guarda el tenant activo en un `ThreadLocal`.
- **`SchemaMultiTenantProvider` / `TenantIdentifierResolver`** ejecutan `SET search_path` por conexión.
- **Schemas:**
  - `platform` — `plans`, `tenants`, `platform_users` (datos globales del SaaS).
  - `{subdomain}` — `users`, `students`, `families`, `enrollments`, etc. (datos del colegio).
  - `template_tenant` — plantilla con la estructura base que se clona al provisionar.
- **Provisión:** al crear un tenant, `TenantService` aplica las migraciones `db/tenant/V1..V8`
  sobre el nuevo schema y siembra el usuario ADMIN.

Archivos clave: `shared/multitenancy/*`, `config/MultiTenancyConfig.java`, `config/FlywayConfig.java`.

## 4. Seguridad

| Aspecto | Implementación |
|---|---|
| Autenticación | JWT HS256, secret ≥ 256 bits (`JWT_SECRET`), expiración 86 400 000 ms (24 h) |
| Transporte token | Cookie `klassa_token` HttpOnly SameSite=Lax (`cookie-secure=false` en dev) + `Authorization: Bearer` |
| Claims JWT | `userId`, `email`, `tenantId`, `role` |
| Cambio de contraseña | `must_change_password` fuerza `403 PASSWORD_CHANGE_REQUIRED` en el primer login |
| Autorización | Spring Security por rol; `POST /api/tenants` requiere `PLATFORM_ADMIN` |
| Aislamiento | El `search_path` por tenant impide cruzar datos entre colegios |
| CORS | Orígenes permitidos en `cors.allowed-origins` (localhost:3000/5173, IP LAN) |
| Errores | `GlobalExceptionHandler` + `ErrorCode` enum → respuestas `ApiResponse` consistentes |

Endpoints públicos: `GET /api/plans`, `POST /api/auth/login`, `POST /api/auth/logout`,
`PUT /api/auth/change-password`, `POST /api/platform/auth/login`, `GET /actuator/health`.

## 5. Organización del código

### 5.1 Backend — paquetes por dominio (`com.klassa`)

```
billing/      Facturas, pagos, esquemas de cobro, scheduler de morosidad
tenant/       Tenants, planes, provisión de schemas
student/      Alumnos, familias
academic/     Años académicos, grados, secciones, materias, matrículas, notas
attendance/   Asistencia
user/         Usuarios del colegio + auth (login, change-password)
platform/     Platform users + bootstrap del admin de plataforma
config/        Security, Jwt, MultiTenancy, Flyway, Redis, Storage, OpenApi, WebMvc
shared/
  domain/     BaseEntity, value objects (DueDay)
  security/   JwtService, JwtAuthFilter, SecurityUser
  multitenancy/ TenantContext, TenantInterceptor, resolvers
  storage/    StorageService, S3StorageService
  exception/  KlassaException, BusinessRuleException, ErrorCode, handler
  web/        ApiResponse, PageResponse
```

Cada dominio sigue el patrón **Controller → Service → Repository (JPA) + Mapper (MapStruct) + DTOs**.

### 5.2 Frontend — vertical slices por feature

```
src/
  app/
    page.tsx, _landing/*        Landing comercial (Hero, Stats, Pricing, ...)
    (tenant)/                   Área del colegio (dashboard, students, attendance, billing, users, academic-years)
    platform/                   Área de plataforma (login, dashboard, tenants)
    auth/                       login, change-password
  features/<dominio>/
    api.ts        Llamadas al backend
    actions.ts    Server Actions
    schemas.ts    Zod
    types.ts      Tipos
    components/   UI del feature
  shared/
    components/   BottomNav, Pagination, Dialog, ConfirmDialog, SessionInitializer
    store/        session.ts (Zustand)
    lib/          api.ts, constants.ts, nav-items.ts
    types/
  components/ui/  Primitivas (shadcn): button, input, table, dialog, form, ...
  proxy.ts        BFF: reenvía /api al backend inyectando cookie + X-Tenant-Subdomain
```

El frontend actúa como **BFF**: las Server Actions y `proxy.ts` adjuntan la cookie JWT y
el subdominio del tenant antes de llamar al backend, manteniendo el token fuera del cliente.

## 6. Modelo de API (resumen)

| Recurso | Endpoints representativos |
|---|---|
| Plataforma | `GET /api/plans`, `POST /api/platform/auth/login`, `POST/GET /api/tenants`, `PATCH /api/tenants/{subdomain}/status` |
| Auth colegio | `POST /api/auth/login`, `POST /api/auth/logout`, `PUT /api/auth/change-password` |
| Usuarios | `GET/POST /api/users` |
| Académico | `/api/academic-years`, `/api/grade-levels`, `/api/sections`, `/api/subjects`, `/api/enrollments`, `/api/scores` |
| Alumnos | `/api/students`, `/api/families` |
| Asistencia | `/api/attendance` (registro + % asistencia) |
| Cobranza | `/api/billing/invoices`, `/api/billing/payments`, `/api/billing/fee-schedules`, generación masiva |

Convención de respuesta: envoltura `ApiResponse<T>` y paginación `PageResponse<T>`.

## 7. Datos, transacciones y concurrencia

- **Auditoría:** `BaseEntity` aporta `user_created/date_created/user_updated/date_updated`;
  triggers SQL (`V4/V5`) actualizan `date_updated`.
- **Integridad:** check constraints (notas 0–20, periodo 1–4, montos > 0, capacidad 1–100,
  fechas coherentes) y únicos (un alumno por sección, una nota por enrollment/materia/periodo).
- **Concurrencia de cobranza:** las facturas llevan columna `version` (`V8__add_invoice_version`)
  para **bloqueo optimista** y evitar dobles pagos.
- **Jobs:** `BillingScheduler` corre cron `0 5 0 * * *` (00:05) para marcar morosos.
- **Funciones/Procedimientos:** lógica en SQL (`V5__functions`, `V6__procedures`) reutilizada por servicios.

## 8. Infraestructura y entornos

### 8.1 Dependencias de runtime (dev — `docker-compose.dev.yml`)

| Servicio | Imagen | Puertos |
|---|---|---|
| PostgreSQL | `postgres:16-alpine` | 5432 |
| Redis | `redis:7-alpine` | 6379 |
| MinIO | `minio/minio:latest` | 9000 (API), 9001 (consola) |

### 8.2 Variables de entorno (backend)

| Variable | Default | Uso |
|---|---|---|
| `DB_URL/DB_USERNAME/DB_PASSWORD` | postgres local | Conexión BD |
| `REDIS_HOST/REDIS_PORT/REDIS_PASSWORD` | localhost:6379 | Cache |
| `JWT_SECRET` | (dev key) | Firma JWT — **rotar en prod** |
| `SPRING_PROFILES_ACTIVE` | `dev` | Perfil (Swagger solo en dev) |
| `STORAGE_*` | MinIO local | S3/MinIO (endpoint, keys, bucket, region) |
| `PLATFORM_ADMIN_EMAIL/PASSWORD/...` | — | Seed idempotente del admin de plataforma |

### 8.3 Arranque local

```bash
# Infra
docker compose -f docker-compose.dev.yml up -d   # en klassa-backend
# Backend
./mvnw spring-boot:run                            # :8080
# Frontend
bun run dev                                        # :3000
# (o usar ./start-dev.sh en la raíz)
```

## 9. Requisitos no funcionales (técnicos)

| NFR | Requisito | Mecanismo |
|---|---|---|
| Rendimiento | Concurrencia alta con bajo costo de hilos | Virtual threads + Hikari (20 max) |
| Latencia lectura | Reducir golpes a BD | Cache Redis (TTL 600 s) + índices |
| Escalabilidad | Crecer en nº de colegios | Schema-per-tenant; futuro sharding por tenant |
| Seguridad transporte | Cookies seguras en prod | `cookie-secure=true`, HTTPS obligatorio |
| Observabilidad | Salud y métricas | Actuator `health,info,metrics` |
| Mantenibilidad | Cambios de esquema versionados | Flyway `validate-on-migrate` |
| Límites de carga | Subidas controladas | multipart 5 MB / request 10 MB |

## 10. Riesgos técnicos y decisiones

| Riesgo / Decisión | Mitigación |
|---|---|
| Migración de esquema en todos los tenants | Versionado Flyway de `db/tenant`; aplicar por schema al desplegar |
| Crecimiento de schemas en una instancia Postgres | Monitorear; plan de sharding de tenants por instancia |
| Next.js 16 con breaking changes | Regla en `AGENTS.md`: leer docs locales antes de codificar |
| Pagos manuales sin pasarela | Bloqueo optimista + numeración única hasta integrar pasarela |
| Secret JWT en repo (dev) | Obligatorio sobreescribir `JWT_SECRET` en prod |

## 11. Documentos relacionados

- `product_requierements_document.md` · `esquema_base_datos.md` · `diagrama_flujo_usuario.md`
- `design_system_document.md` (sistema de diseño Klassa) · `plan_implementacion.md`
