# Design System — Klassa

| Campo | Valor |
|---|---|
| Producto | Klassa — SaaS ERP escolar |
| Versión doc | 1.0 — 2026-06-25 |
| Fuente de verdad | `klassa-frontend/src/app/globals.css` (tokens `@theme`) |
| Base | Tailwind CSS v4 + shadcn + Inter |
| Linaje | Derivado del sistema "Zenith UI" (cálido, humano), re-skinned a la marca Klassa |

---

## 1. Personalidad de marca

Klassa transmite **gestión escolar tranquila y confiable**. La interfaz debe sentirse
cálida, ordenada y humana — nunca corporativa-rígida ni infantil. Es una herramienta
de trabajo diario para directores, docentes y tesorería, así que prioriza claridad,
jerarquía suave y foco en los datos.

**Identidad central:** lienzo cálido off-white + un único acento menta. Formas redondeadas,
navegación oscura flotante, elementos decorativos que flotan sin distraer.

**Atributos:** cálido · confiable · claro · ordenado · orgánicamente premium.

---

## 2. Reglas absolutas (lo prohibido)

Si el output incluye cualquiera de esto, el diseño falla:

- **Color:** negro puro en texto/fondos. Acentos neón o de alta saturación. Gradientes en fondos o cards.
- **Tipografía:** más de dos familias. Display en `bold` (máx. `font-medium`). Títulos en MAYÚSCULAS.
- **Formas:** esquinas rectas en elementos interactivos. Botones cuadrados (mínimo `rounded-lg`).
- **Layout:** headers oscuros edge-to-edge sin tratamiento redondeado. Hero sin elementos decorativos flotantes.
- **Movimiento:** transiciones `linear` por defecto. Cards sin hover lift. Sin animación de entrada.

---

## 3. Tokens de diseño

Definidos en `globals.css` con `@theme inline` (consumibles como `bg-*`, `text-*`, `border-*`).

### 3.1 Color

```css
--color-accent:      rgb(216, 249, 184);  /* menta suave — ÚNICO color cromático */
--color-canvas:      rgb(243, 242, 241);  /* off-white cálido — fondo de página */
--color-surface:     rgb(247, 247, 247);  /* superficie clara para cards */
--color-muted-fill:  rgb(242, 242, 242);  /* gris sutil para pills y chips */
--color-ink:         rgb(43, 45, 45);     /* carbón cálido — nunca negro puro */
--color-prose:       rgb(102, 102, 102);  /* texto de cuerpo */
--color-ghost:       rgb(140, 140, 140);  /* captions, microcopy */
--color-line:        rgb(230, 230, 230);  /* bordes de card */
--color-trim:        rgb(216, 213, 209);  /* bordes de botón */
--color-background:  rgb(243, 242, 241);  /* alias de canvas (shadcn) */
--color-foreground:  rgb(43, 45, 45);     /* alias de ink (shadcn) */
```

| Token | Clase Tailwind | Uso |
|---|---|---|
| accent | `bg-accent` / `text-accent` | logo, dots, badges, checks, CTA destacada |
| canvas | `bg-canvas` | fondo global (`body`) |
| surface | `bg-surface` | superficies elevadas |
| muted-fill | `bg-muted-fill` | pills, chips de stats |
| ink | `text-ink` / `bg-ink` | texto principal, navbar oscura, botón primario |
| prose | `text-prose` | párrafos de cuerpo |
| ghost | `text-ghost` | leyendas, subtextos |
| line | `border-line` | bordes de card |
| trim | `border-trim` | bordes de botón secundario |
| white | `bg-white` | relleno de cards |

> El acento es intencionalmente pastel. Re-skinear a otro pastel (durazno, lavanda,
> amarillo cálido) cambia el ánimo manteniendo la personalidad. `canvas` cálido es
> esencial — no usar blanco puro ni gris frío como fondo.

### 3.2 Tipografía

- **Familia:** `Inter` (Google Fonts, cargada en `layout.tsx`), pesos 400–600.
- **Display:** `text-5xl lg:text-[58px]`, `font-medium`, `leading-[1.05]`, `tracking-[-0.5px]`. Nunca bold.
- **Cuerpo:** `text-lg`, `text-prose`, `leading-relaxed`.
- **Labels:** `text-sm font-medium`. Chips/pills: `text-xs`.
- **Logo "K":** inicial en `font-semibold` dentro del cuadro de acento.

### 3.3 Espaciado y formas

- Secciones: `py-24` (énfasis `py-32`).
- Contenedor: `max-w-7xl mx-auto px-6 md:px-10`.
- Radios: botones `rounded-xl` (12px) / `rounded-lg` (8px); cards `rounded-2xl` (16px) / `rounded-3xl` (24px).
- Sombras (utilities en `globals.css`):
  - `shadow-card` → `0 8px 32px rgba(0,0,0,0.08)`
  - `shadow-hover` → `0 12px 32px rgba(0,0,0,0.14)`

---

## 4. Animación (utilities definidas)

| Utility | Keyframe | Duración / easing | Uso |
|---|---|---|---|
| `animate-float` | `float` (translateY + rotate) | 6s ease-in-out infinite | íconos decorativos del hero |
| `animate-ticker` | `ticker` (translateX 0→-50%) | 30s linear infinite | marquee de logos |
| `animate-ticker-slow` | `ticker` | 60s linear infinite | marquee de testimonios |
| `animate-dialog-in` | `dialog-in` (scale+translate+opacity) | 200ms ease-out | entrada de modales |
| `animate-backdrop-in` | `backdrop-in` (opacity) | 150ms ease-out | backdrop de modales |
| `ticker-mask` | máscara de gradiente | — | fade en bordes de marquees |

**Reglas:**
- Animar solo `transform` y `opacity` (rendimiento); `box-shadow` aceptable en hover.
- Hover de cards: `hover:-translate-y-2 hover:shadow-hover`. Botones: `hover:scale-105`.
- Float lento (6s) con rotación leve = vivo pero no distrae. Usar `animationDelay` escalonado.

---

## 5. Componentes de marca (implementados)

### A. Navbar oscura flotante — `_landing/LandingNav.tsx`
- `fixed top-5 left-5 right-5`, contenedor `bg-ink rounded-xl px-2 py-1.5 max-w-7xl mx-auto`.
- Logo: cuadro `w-8 h-8 bg-accent rounded-lg` con "K" en `text-ink font-semibold` + wordmark "Klassa".
- Links: `text-white/60 hover:text-white hover:bg-white/10 rounded-lg`.
- CTA "Iniciar sesión": `bg-white border border-trim text-ink rounded-lg hover:scale-105`.
- Mobile: hamburguesa (`Menu`/`X`) despliega menú con mismo estilo oscuro.

### B. Hero split — `_landing/Hero.tsx`
- Dos columnas (`lg:grid-cols-2`), texto izquierda + composición visual derecha.
- **Badge:** pill `bg-white rounded-full shadow-card` con dot `bg-accent animate-pulse` + "Gestión escolar inteligente".
- **Headline:** una frase con subrayado SVG squiggle en `rgb(216,249,184)`.
- **Pills de features:** `bg-muted-fill border border-line rounded-lg` + ícono lucide.
- **CTA:** primaria `bg-ink text-white rounded-xl hover:scale-105 shadow-card` + secundaria `bg-white border-2 border-trim`.
- **Composición derecha:** íconos flotantes (`animate-float`, delays escalonados) + card de preview `bg-white rounded-3xl shadow-hover` con logo "K", chips de stats, lista de módulos con checks de acento, y CTA "Acceder al panel".

### C. Logo / identidad
- Marca: **cuadro de acento con "K"** (`bg-accent rounded-lg`, "K" en `text-ink font-semibold`) + wordmark "Klassa".
- Tamaños: navbar `w-8 h-8`, cards `w-7 h-7`.

### D. Navegación de aplicación — `shared/components/BottomNav.tsx`
- Barra inferior tipo móvil; íconos lucide; filtra módulos por rol (`nav-items.ts`).
- Activos del producto: Inicio, Alumnos, Académico, Asistencia, Cobros, Usuarios.

### E. Modales — `shared/components/Dialog.tsx`
- Entrada `animate-dialog-in`; backdrop `animate-backdrop-in`.
- Card `bg-white rounded-2xl shadow-hover border border-line`.

### F. Primitivas shadcn — `components/ui/*`
- `button`, `input`, `select`, `table`, `dialog`, `form`, `card`, `badge`, `label`, `separator`, `sonner`.
- Reestilizadas con tokens Klassa (radios redondeados, `border-line/trim`, foco en `accent`).

---

## 6. Patrones de aplicación (área tenant)

El área de trabajo del colegio reusa los tokens del landing en clave más sobria:

- **Fondo:** `bg-canvas`. **Cards de datos:** `bg-white rounded-2xl border border-line`.
- **Tablas:** `components/ui/table` con filas separadas por `border-line`, hover suave.
- **Badges de estado:** menta (`bg-accent/30 text-ink`) para activo; tonos neutros para inactivo.
  Estados de factura usan `InvoiceStatusBadge`; roles usan `UserRoleBadge`.
- **Acciones primarias:** botón `bg-ink text-white rounded-xl`. Destructivas confirman con `ConfirmDialog`.
- **Formularios:** react-hook-form + Zod; labels `text-sm font-medium`, inputs `rounded-lg border-line`.

---

## 7. Accesibilidad

- Contraste: `ink` sobre `canvas`/`white` cumple AA. Evitar `ghost` para texto esencial.
- `lang="es"` en `<html>`; `aria-label` en controles solo-ícono (ej. hamburguesa "Menú").
- SVG decorativos con `aria-hidden`.
- Targets táctiles ≥ 36px (`w-9 h-9` mínimo en botones de ícono).
- Foco visible y orden de tabulación coherente en modales.

---

## 8. Contratos responsive

- **Hero:** una columna en mobile; composición visual escala; algunos íconos flotantes se ocultan en pantallas chicas.
- **Grids (alumnos/secciones/pricing):** `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-3/4`.
- **Navbar landing:** nav completa oculta en mobile, hamburguesa visible.
- **App:** `BottomNav` fija en mobile; tablas con scroll horizontal cuando hace falta.
- **Tickers:** mantener máscara de fade en todos los breakpoints.

---

## 9. Guía de re-skin

1. Cambiar `--color-accent` a otro pastel suave (durazno, lavanda, azul pálido, amarillo cálido).
2. Ajustar `--color-ink` a un carbón cálido que combine con el acento.
3. Mantener `--color-canvas` off-white cálido — la calidez es la firma de Klassa.

Firmas estructurales que **no** cambian: navbar oscura flotante redondeada, íconos
decorativos flotantes, logo "K" en cuadro de acento, hover lift de cards.

---

## 10. Checklist pre-entrega

- [ ] Fondo `bg-canvas` (`rgb(243,242,241)`), no blanco puro ni gris frío.
- [ ] Un solo acento (`accent` menta o pastel equivalente).
- [ ] Texto en `ink` (`rgb(43,45,45)`), nunca negro puro.
- [ ] Navbar = barra oscura redondeada (`bg-ink rounded-xl`) inset del borde.
- [ ] Logo "K" en cuadro de acento presente donde corresponde la marca.
- [ ] Headings `font-medium`, sin MAYÚSCULAS.
- [ ] Hero con íconos `animate-float` y card de preview `shadow-hover`.
- [ ] Pills `bg-muted-fill border border-line` con íconos lucide.
- [ ] Cards `rounded-2xl` con `hover:-translate-y-2 hover:shadow-hover`.
- [ ] Modales con `animate-dialog-in` + backdrop.
- [ ] Tokens consumidos vía clases (`bg-canvas`, `text-ink`, ...), no hex sueltos.
- [ ] Impresión general: herramienta escolar cálida y confiable, no template genérico.

---

## 11. Documentos relacionados

- `product_requierements_document.md` — roles y módulos que la UI sirve.
- `diagrama_flujo_usuario.md` — pantallas y navegación.
- `technical_requirements_document.md` — stack frontend (Next 16, Tailwind v4, shadcn).
