# Prompt: Asignaciones, QR de Acceso y Responsive Móvil — Capacita PRO

> Copia y pega este prompt en una sesión de Claude Code para implementar todas las mejoras.

---

## Contexto

Capacita PRO es una plataforma de capacitación empresarial (React 18 + TypeScript + Vite + Supabase + Tailwind CSS). Tema oscuro (`bg-[#0a0d14]`). Deploy en Vercel: `https://capacita-pro.vercel.app`. El paquete `qrcode.react` ya está instalado.

### IDs útiles
- **Super admin userId:** `e2474507-a1cb-44a7-a273-c0c4169c340e`
- **Organization ID:** `d19b750c-2842-4769-8beb-e7cdf9e42f6c`
- **Vercel URL:** `https://capacita-pro.vercel.app`

---

## Tareas (en orden de ejecución)

### 1. Crear página `/admin/assignments` — Gestión de Asignaciones

**Problema actual:** El sidebar tiene un enlace "Asignaciones" que redirige a `/admin/employees` (un `<Navigate>` en App.tsx línea 166). No existe página propia.

**Qué crear:** `src/pages/admin/AssignmentManagement.tsx`

**Funcionalidad requerida:**
- Tabla de asignaciones existentes con columnas: Empleado, Curso, Fecha asignación, Fecha límite, Estado (Pendiente/En Progreso/Completado), Progreso (%)
- Botón **"Nueva Asignación"** que abre modal con:
  - Selector de curso (solo cursos `published`)
  - Selector de empleado(s) — puede ser individual O "Todos los empleados"
  - Campo fecha límite (opcional)
  - Botón confirmar
- Botón **"Asignar a Todos"** que asigna un curso seleccionado a TODOS los empleados activos de una sola vez (usa `assignCourseToAll` del CourseContext)
- Filtros: por curso, por estado
- Colores consistentes con tema oscuro: `text-white`, `text-slate-300`, `text-slate-400`, bordes `border-slate-700`

**Archivos a modificar:**
- `src/App.tsx` — reemplazar `<Navigate to="/admin/employees">` por `<AssignmentManagement />` en la ruta `/admin/assignments`
- `src/contexts/CourseContext.tsx` — la función `assignCourseToAll` ya está creada

### 2. Corregir colores dark mode en EmployeeManagement

**Archivo:** `src/pages/admin/EmployeeManagement.tsx`

**Problema:** La página usa colores de tema claro que no se ven en el fondo oscuro:
- `text-slate-900` → debe ser `text-white`
- `bg-slate-50` → debe ser `bg-slate-800/50`
- `border-slate-200` / `border-slate-100` → debe ser `border-slate-700`
- `border-slate-300` en inputs → debe ser `border-slate-600`
- `hover:bg-slate-50` → debe ser `hover:bg-slate-800/30`
- `text-slate-700` en headers de tabla → debe ser `text-slate-400`
- Los inputs del modal también usan colores claros — agregar `bg-slate-800 text-white` a todos los `<input>` y `<select>`
- El modal de agregar/editar empleado tiene labels `text-slate-700` → cambiar a `text-slate-300`
- `bg-red-50` en error → `bg-red-500/10`

**Patrón de reemplazo global:** Buscar todos los casos de colores `*-slate-900`, `bg-slate-50`, `border-slate-100`, `border-slate-200`, `border-slate-300` y reemplazar por sus equivalentes dark.

### 3. Crear componente QR de enlace directo a la aplicación

**Qué crear:** Componente reutilizable que genera un QR con el enlace de la app.

**Ubicación del QR:**
- En la página de **Settings** (`/admin/settings`) — sección "Acceso Empleados" con QR grande descargable
- En el modal de **asignación de curso** — QR pequeño con enlace directo al curso

**Implementación:**
```tsx
import { QRCodeSVG } from 'qrcode.react';

// QR con logo de SoldesP en el centro
<QRCodeSVG
  value="https://capacita-pro.vercel.app"
  size={256}
  level="H"  // Alta corrección de errores para permitir logo
  bgColor="transparent"
  fgColor="#ffffff"
/>
```

**Funcionalidades del QR:**
- Botón "Descargar QR" que exporta como PNG de alta resolución (300 DPI)
- El QR apunta a `https://capacita-pro.vercel.app` (o a `/employee/course/:id` para QR de curso específico)
- Tamaño configurable: 256px para Settings, 128px para modales

### 4. Asegurar calidad en celulares (responsive)

**Viewport meta** ya existe en `index.html` ✓

**Problemas a corregir:**

a) **EmployeeManagement.tsx** — la tabla de empleados NO es responsive:
   - En móvil, convertir la tabla a cards apiladas verticalmente
   - Usar `hidden md:table-cell` para ocultar columnas secundarias en móvil
   - Los botones de acción deben ser un menú dropdown en móvil

b) **AssignmentManagement.tsx** (nueva) — diseñar mobile-first:
   - Cards en móvil, tabla en desktop
   - Botones de acción apilados verticalmente en móvil
   - Modal de asignación ocupa `w-full` en móvil

c) **AdminDashboard.tsx** — las Quick Actions y stat cards ya son responsive ✓

d) **CourseManagement.tsx** — el grid ya es `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` ✓

e) **Sidebar** — ya tiene menú hamburguesa móvil via MainLayout ✓

f) **QR en Settings** — el QR debe ser centrado y de tamaño proporcional en móvil

g) **Inputs y modales:**
   - Todos los inputs deben tener `text-base` (no `text-sm`) para evitar zoom automático en iOS
   - Los modales deben tener `max-h-[90vh] overflow-y-auto` para no salirse de la pantalla

### 5. Verificación

Al terminar, verificar en el preview server (puerto 5180):

| Verificación | Ruta | Qué comprobar |
|---|---|---|
| Asignaciones carga | `/admin/assignments` | Tabla de asignaciones, botón nueva asignación |
| Asignar a todos | Modal nueva asignación | Checkbox "Todos los empleados" funciona |
| QR visible | `/admin/settings` | QR se renderiza, botón descargar funciona |
| Dark mode | `/admin/employees` | Texto visible, inputs legibles |
| Mobile cards | `/admin/employees` (320px) | Cards en vez de tabla |
| Mobile assignments | `/admin/assignments` (320px) | Cards en vez de tabla |
| Sin errores consola | Todas las rutas admin | 0 errores en console |

---

## Instrucciones de ejecución

1. Levanta el dev server: `.claude/launch.json` configurado para puerto 5180
2. Implementa en orden: Asignaciones → Dark mode → QR → Responsive
3. Después de cada cambio, verifica con `npx tsc --noEmit`
4. Al final: prueba visual en preview, luego commit y push
5. Genera tabla de verificación con estado OK/PENDIENTE
