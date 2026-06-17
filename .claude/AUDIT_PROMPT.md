# Prompt de Auditoría y Corrección — Capacita PRO

> Copia y pega este prompt completo en una nueva sesión de Claude Code para auditar y corregir pendientes.

---

## Contexto del proyecto

Capacita PRO es una plataforma de capacitación empresarial (React 18 + TypeScript + Vite + Supabase + Tailwind CSS). Autenticación por RUT chileno vía Supabase Auth. Deploy en Vercel (frontend) y Supabase (backend, edge functions, storage). El usuario es Raul Diaz, gerente HSEQ, trabaja en español.

## Tu tarea

Audita y corrige los siguientes pendientes conocidos. Para cada uno, verifica el estado actual, implementa la corrección si aplica, y prueba en el preview (localhost:5180). Al final genera una tabla de verificación con estado OK/CORREGIDO/PENDIENTE.

---

### 1. FALLBACK_USER_ID y FALLBACK_ORG_ID siguen en el código

**Archivo:** `src/contexts/CourseContext.tsx` líneas 9-10 y 121-122, 355

Los UUIDs falsos `00000000-0000-0000-0000-000000000001` siguen como fallback en `mapCourseToSupabase()` y `createCourse()`. Si el usuario no tiene `organizationId` (por ejemplo fallo de sesión), el INSERT a Supabase fallará por FK constraint. Decide: ¿lanzar error explícito en vez de usar fallback silencioso, o mantener como red de seguridad? Lo correcto es lanzar error si no hay user/org válidos.

### 2. console.log/warn/error de diagnóstico en producción

**Archivos con logs restantes:**
- `src/contexts/AuthContext.tsx`
- `src/contexts/CourseContext.tsx`  
- `src/lib/supabase.ts`

Hay ~14 `console.log/warn/error` en estos archivos. Revisa cuáles son informativos legítimos (errores de Supabase que deben loguearse) vs diagnósticos temporales que deben eliminarse. Los `console.warn` en catches de Supabase son razonables; los `console.log` de debug deben quitarse.

### 3. Bucket `assets` huérfano — nunca se usa

**Archivo:** `supabase/migrations/20260614000002_create_assets_bucket.sql`

Se creó un bucket `assets` pero todo el código usa el bucket `documents`. El bucket `assets` ocupa espacio en Supabase y sus RLS policies son innecesarias. Evalúa si crear una migración para eliminarlo o dejarlo.

### 4. Chunks de build excesivamente grandes

El build de producción produce chunks >700KB:
- `excel-*.js` — 938KB (librería de Excel para importación de empleados)
- `pdf-*.js` — 470KB (parser PDF)
- `docxParser-*.js` — 404KB

Implementar code-splitting con `React.lazy()` + `Suspense` para las rutas que usan estos parsers (`/admin/documents`, `/admin/employees`). Configurar `build.rollupOptions.output.manualChunks` en `vite.config.ts`.

### 5. Tests — cobertura mínima

Solo existen 2 archivos de test:
- `src/lib/employeeImport.test.ts`
- `src/lib/storage.test.ts`

Componentes críticos sin tests:
- `pptxParser.ts` — probar extracción de imágenes con orden de atributos variado en .rels
- `CourseContext.tsx` — probar que `createCourse` falla si no hay user/org
- `AuthContext.tsx` — probar `addUser` → `import-workers` → reload profiles

Crear al menos tests unitarios para `pptxParser.ts` (el bug del regex que fue corregido debería tener un test de regresión).

### 6. Flujo de creación de curso end-to-end

Verificar que el flujo completo funciona desde la UI:
1. Ir a `/admin/documents`
2. Subir un PPTX (usar el que está en `/Volumes/PortableSSD/Material Cursos/WE1850_Structural_Maintenance_Standards.pptx`)
3. Verificar que las 15 slides muestran preview de imágenes en el editor
4. Opcionalmente subir un PDF de referencia
5. Generar preguntas con IA (si la API key está configurada)
6. Publicar el curso
7. Ir a `/admin/courses` y verificar que aparece
8. Ir a `/admin/courses/:id/preview` y verificar:
   - Las 15 diapositivas muestran imágenes reales (no placeholder)
   - "MATERIAL DE APOYO" aparece en el sidebar con enlace de descarga del PPTX
   - La navegación Anterior/Siguiente funciona
   - El modo "Presentación" funciona
9. Recargar la página y verificar que el curso persiste
10. Si algo falla, revisar la consola del browser para errores

### 7. Asignación de curso a empleados

Verificar que se puede:
1. Ir a `/admin/employees` 
2. Verificar que los 56 empleados se cargan desde Supabase
3. Crear un empleado nuevo (probar que `import-workers` funciona con super_admin)
4. Asignar un curso publicado a un empleado
5. Verificar que la asignación persiste en Supabase (no solo localStorage)

### 8. Vista del empleado

Verificar desde la perspectiva del empleado:
1. El dashboard muestra cursos asignados
2. Al entrar a un curso asignado, las slides muestran imágenes
3. El progreso se guarda al avanzar por las slides
4. El enlace de descarga del PPTX funciona
5. La evaluación final funciona (si tiene preguntas)
6. Al completar el curso, se genera certificado

### 9. Seguridad — RLS policies

Verificar que las RLS policies funcionan correctamente:
- Un empleado NO puede ver cursos de otra organización
- Un empleado NO puede modificar perfiles de otros usuarios
- Un admin NO puede ver datos de otra organización
- El super_admin SÍ puede ver datos cross-organización
- El bucket `documents` permite lectura pública pero solo escritura autenticada

### 10. Edge functions — deploy actualizado

Verificar que todas las edge functions están deployadas con la última versión:
```bash
npx supabase functions deploy import-workers --linked
npx supabase functions deploy manage-user-role --linked
npx supabase functions deploy generate-course --linked
```
La función `scrape-url` puede no ser necesaria — verificar si se usa en algún lugar del frontend.

### 11. Producción — Vercel

Verificar que el deploy en Vercel (https://capacita-pro.vercel.app) funciona:
- Login con `raul.diaz@soldesp.cl`
- Los cursos se cargan desde Supabase
- Las imágenes del Storage se muestran correctamente (CORS)
- El PPTX se puede descargar desde el enlace de Material de Apoyo

### 12. UX — Mejoras menores detectadas

- El título del curso en la card de `/admin/courses` no se muestra (solo muestra el ícono y las stats)
- El editor de curso no muestra preview de las imágenes de cada slide
- No hay confirmación antes de eliminar un curso
- No hay indicador de progreso durante el upload de imágenes al Storage (ya existe `imageUploadProgress` pero verificar que se renderiza)

---

## Instrucciones de ejecución

1. Levanta el dev server: el archivo `.claude/launch.json` ya está configurado para puerto 5180
2. Login: email `raul.diaz@soldesp.cl` (super_admin)
3. Para cada pendiente: verifica → corrige → prueba en browser → marca estado
4. Haz commits incrementales con mensajes descriptivos
5. Al final: `git push origin main` y redeploy en Vercel si hubo cambios
6. Genera la tabla de verificación final

## Credenciales / IDs útiles

- **Super admin userId:** `e2474507-a1cb-44a7-a273-c0c4169c340e`
- **Organization ID:** `d19b750c-2842-4769-8beb-e7cdf9e42f6c`
- **Supabase project:** `vyumcxkjetzalvnebgqi`
- **Vercel URL:** `https://capacita-pro.vercel.app`
- **Storage bucket en uso:** `documents` (no `assets`)
- **PPTX de prueba:** `/Volumes/PortableSSD/Material Cursos/WE1850_Structural_Maintenance_Standards.pptx`
