# Prompt: Fix Cursos/Asignaciones/Admin — CapacitaPro

## Stack
React 18 + TypeScript + Vite + Tailwind CSS + Supabase. Package manager: **pnpm** (NO npm).

## 3 Problemas Raíz Identificados

### Problema 1: Cursos no persisten a Supabase
**Archivo:** `src/contexts/CourseContext.tsx` — función `createCourse()`

`mapCourseToSupabase()` lanza una excepción cuando `user?.organizationId` es `undefined` (el perfil del admin no tiene `organization_id` cargado en el contexto). El error queda atrapado en el catch → el curso se guarda **solo en localStorage del admin**. Resultado: otros usuarios y sesiones no ven los cursos.

**Fix:**
Antes de llamar `mapCourseToSupabase()`, si `user?.organizationId` es undefined hacer una query fresca:
```typescript
let orgId = user?.organizationId;
if (!orgId && user?.id) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  orgId = profile?.organization_id ?? undefined;
}
```
Aplicar el mismo fix en `updateCourse()`.

### Problema 2: Asignaciones huérfanas (cursos no visibles para empleados)
**Archivo:** `src/contexts/CourseContext.tsx` — useEffect de carga del usuario

Las asignaciones SÍ se guardan en Supabase (`course_assignments` con `course_id` correcto), pero el curso nunca llegó a Supabase (quedó solo en localStorage del admin). Cuando el empleado inicia sesión, `getCoursesWithModules()` no retorna esos cursos y `courses.find(c => c.id === a.courseId)` retorna `undefined` → el dashboard muestra 0 cursos.

**Fix:**
Después de cargar las asignaciones del usuario, hacer un fetch secundario de los cursos referenciados que no estén en la lista ya cargada:
```typescript
const assignedCourseIds = mappedAssignments.map(a => a.courseId).filter(Boolean);
// Fetch de cursos faltantes usando .in('id', missingIds)
```

### Problema 3: import-workers rechazaba super_admin
**Archivo:** `supabase/functions/import-workers/index.ts`

**YA CORREGIDO** (línea 78 ya acepta `['admin', 'super_admin']`).

## Comportamiento esperado tras los fixes

| Acción | Antes | Después |
|--------|-------|---------|
| Admin crea curso | Solo en localStorage del admin | Persiste en Supabase |
| Empleado ve cursos asignados | 0 cursos (courses.find falla) | Ve los cursos correctamente |
| Usuario elevado a admin | Necesita re-login | Al re-login accede a /admin con Repositorio, Cursos, etc. |
| super_admin importa empleados | Edge function error 400 | Funciona correctamente |

## Routing para usuario elevado a admin

- `/admin` y sub-rutas usan `<ProtectedRoute requiredRole="admin">`
- `user.role === 'admin'` pasa el guard sin problema
- `RoleRedirect` lo envía a `/admin` en el próximo login
- El sidebar muestra `adminLinks` que incluye Repositorio, Cursos, Empleados, etc.

## Archivos modificados
- `src/contexts/CourseContext.tsx` — createCourse, updateCourse, useEffect usuario

## Verificación
```bash
npx tsc --noEmit    # 0 errores
pnpm run build      # ✓ sin errores
```
