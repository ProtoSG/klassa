# Klassa Backend

SaaS ERP escolar multi-tenant. Schema-per-tenant PostgreSQL, Spring Boot 3.5.1.

## Stack

| Capa | Tecnología |
|---|---|
| Runtime | Java 21 (virtual threads) |
| Framework | Spring Boot 3.5.1 |
| BD | PostgreSQL 16 (schema-per-tenant) |
| Migraciones | Flyway |
| Cache | Redis 7 |
| Auth | JWT + HttpOnly cookies |
| Mapeo | MapStruct + Lombok |
| API Docs | Swagger UI (`/swagger-ui.html`) |

## Requisitos

- Java 21+
- Docker + Docker Compose
- Maven (incluido `./mvnw`)

## Levantar el entorno

```bash
# Infraestructura (PostgreSQL + Redis)
docker compose -f docker-compose.dev.yml up -d

# Aplicación
./mvnw spring-boot:run
```

La app corre en `http://localhost:8080`.  
Flyway crea el schema `platform` y todas las tablas al arrancar.

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/klassa_dev` | URL de PostgreSQL |
| `DB_USERNAME` | `klassa` | Usuario de BD |
| `DB_PASSWORD` | `klassa` | Contraseña de BD |
| `REDIS_HOST` | `localhost` | Host de Redis |
| `REDIS_PORT` | `6379` | Puerto de Redis |
| `JWT_SECRET` | *(ver application.yml)* | Secret HS256 (mín. 256 bits) |
| `PLATFORM_ADMIN_EMAIL` | — | Email del superadmin de plataforma |
| `PLATFORM_ADMIN_PASSWORD` | — | Contraseña del superadmin (mín. 8 chars) |

`PLATFORM_ADMIN_EMAIL` y `PLATFORM_ADMIN_PASSWORD` son opcionales en dev pero requeridos en producción. Si están presentes al arrancar, se crea el usuario platform admin automáticamente (idempotente).

## Arquitectura multi-tenant

Cada colegio tiene su propio schema PostgreSQL. El routing funciona así:

```
Request → TenantInterceptor → TenantContext (ThreadLocal)
                                    ↓
                         JwtAuthFilter (sobreescribe con claim del JWT)
                                    ↓
                    TenantIdentifierResolver → SET search_path TO "{tenant}"
```

En desarrollo, pasar el header `X-Tenant-Subdomain: <subdomain>` para identificar el tenant.  
En producción, se extrae del subdominio del Host (`colegio.klassa.com` → `colegio`).

### Schemas

| Schema | Contenido |
|---|---|
| `platform` | `tenants`, `plans`, `platform_users` — datos globales |
| `{subdomain}` | `users`, `students`, `families`, `enrollments`, ... — datos del colegio |

### Migraciones Flyway

- `db/migration/` — V1–V9: inicialización del schema platform (corre al arrancar)
- `db/tenant/` — V1–V7: tablas de cada colegio (corre al provisionar un tenant nuevo)

## Flujo de prueba

### 0. Prerequisitos

```bash
docker compose -f docker-compose.dev.yml up -d
./mvnw spring-boot:run
```

### 1. Ver planes disponibles (público)

```
GET /api/plans
→ 200 — lista Starter / Pro / Enterprise con IDs
```

### 2. Login como Platform Admin

```
POST /api/platform/auth/login
{ "email": "<PLATFORM_ADMIN_EMAIL>", "password": "<PLATFORM_ADMIN_PASSWORD>" }
→ 200 + cookie klassa_token
```

### 3. Crear tenant + admin del colegio

```
POST /api/tenants
Header: Authorization: Bearer <token>
{
  "subdomain": "colegio-demo",
  "name": "Colegio Demo",
  "planId": 1,
  "trialDays": 30,
  "adminEmail": "director@colegio-demo.com",
  "adminFirstName": "Juan",
  "adminLastName": "Rodriguez"
}
→ 201
{
  "tenant": { ... },
  "tempPassword": "abc123xyz456A1!"   ← guardar, se muestra UNA sola vez
}
```

Esto crea el schema `colegio-demo` con todas las tablas y un usuario ADMIN con `must_change_password = true`.

### 4. Intentar login como director (debe fallar)

```
POST /api/auth/login
Header: X-Tenant-Subdomain: colegio-demo
{ "email": "director@colegio-demo.com", "password": "<tempPassword>" }
→ 403 PASSWORD_CHANGE_REQUIRED
```

### 5. Cambiar contraseña

```
PUT /api/auth/change-password
Header: X-Tenant-Subdomain: colegio-demo
{
  "email": "director@colegio-demo.com",
  "currentPassword": "<tempPassword>",
  "newPassword": "NuevaPassword2026!"
}
→ 200 + cookie JWT del director lista para usar
```

### 6. Login normal

```
POST /api/auth/login
Header: X-Tenant-Subdomain: colegio-demo
{ "email": "director@colegio-demo.com", "password": "NuevaPassword2026!" }
→ 200
```

### 7. Operar dentro del colegio

Todos los endpoints con `X-Tenant-Subdomain: colegio-demo` + cookie del director:

```
GET  /api/users
POST /api/academic-years
POST /api/grade-levels
POST /api/sections
POST /api/students
POST /api/enrollments
POST /api/attendance
POST /api/scores
POST /api/billing/invoices
...
```

### 8. Gestión de plataforma

```
GET   /api/tenants                          → listar todos los colegios
GET   /api/tenants/{subdomain}              → detalle
PATCH /api/tenants/{subdomain}/status       → cambiar estado (TRIAL/ACTIVE/SUSPENDED)
```

## Colección Bruno

Importar la carpeta `bruno/` en Bruno. Configurar el environment con:

| Variable | Valor |
|---|---|
| `base_url` | `http://localhost:8080/api` |
| `subdomain` | `colegio-demo` |
| `token` | *(se llena después del login)* |

Orden de ejecución: `platform/` → `auth/` → resto de carpetas.

## Auth

- Login devuelve cookie `klassa_token` (HttpOnly, SameSite=Lax)
- Bearer token también soportado: `Authorization: Bearer <jwt>`
- JWT contiene: `userId`, `email`, `tenantId`, `role`
- Logout: `POST /api/auth/logout` — limpia la cookie

## Endpoints públicos

```
GET  /api/plans
POST /api/auth/login
POST /api/auth/logout
PUT  /api/auth/change-password
POST /api/platform/auth/login
GET  /actuator/health
```

Todos los demás requieren JWT válido. `POST /api/tenants` requiere rol `PLATFORM_ADMIN`.

## Verificar BD (psql)

```sql
-- Schemas existentes
SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%';

-- Tenants
SELECT subdomain, name, status, trial_ends_at FROM platform.tenants;

-- Usuario admin del colegio
SELECT email, role, must_change_password FROM "colegio-demo".users;

-- Planes
SELECT name, max_students, price_monthly FROM platform.plans;
```
