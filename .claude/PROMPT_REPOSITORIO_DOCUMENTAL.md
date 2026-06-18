# Prompt: Repositorio Documental + QR de Acceso a la App

## Contexto del proyecto
- **App**: CapacitaPro — plataforma de capacitación corporativa
- **Stack**: React 18 + TypeScript + Vite + Tailwind CSS + Supabase
- **Package manager**: pnpm (NO npm)
- **Tema**: Dark theme (bg: `#0A0E1A`, cards: glassmorphism)
- **URL producción**: `https://capacita-pro.vercel.app`
- **Bucket Supabase Storage**: `documents` (ya existe)
- **QR library**: `qrcode.react` v4.2.0 (ya instalada)
- **Diseño**: Modern Dark Cinema con animaciones `stagger-children`, `animate-fadeInUp`
- **Fuentes**: Lexend (headings) + Source Sans 3 (body)

## Archivos clave existentes
- `src/lib/supabase.ts` — exporta `storage.uploadFile(bucket, path, file)` que retorna `publicUrl`
- `src/App.tsx` — routing, ya tiene ruta `/admin/documents` apuntando a `DocumentUpload`
- `src/components/layout/Sidebar.tsx` — nav con `{ path: '/admin/documents', icon: FileText, label: 'Documentos' }`
- `src/components/ui/Card.tsx` — componentes `Card, Button, Badge, Modal, Input, Select, StatCard, Spinner, EmptyState`
- `src/pages/admin/AssignmentManagement.tsx` — ejemplo funcional de QR con descarga PNG (referencia de patrón)
- `src/pages/admin/DocumentUpload.tsx` — página actual de subida de PPTX para crear cursos (NO es repositorio)

## Tarea 1: Crear página "Repositorio Documental"

### Crear archivo: `src/pages/admin/DocumentRepository.tsx`

Página completa de gestión documental con estas funcionalidades:

### 1.1 Subida de documentos
- Drag & drop zone + botón de selección de archivo
- Tipos permitidos: PDF, DOCX, XLSX, PPTX, JPG, PNG (mostrar íconos distintos por tipo)
- Subir a Supabase Storage bucket `documents` usando `storage.uploadFile()`
- Campos del formulario: nombre del documento, categoría (dropdown), descripción opcional
- Categorías: `Procedimientos`, `Políticas`, `Formatos`, `Manuales`, `Certificados`, `Registros HSEQ`, `Otro`
- Barra de progreso durante la subida
- Guardar metadatos en tabla `documents` de Supabase (crear si no existe):
  ```sql
  -- Tabla esperada (si no existe, usar localStorage como fallback)
  id uuid PK default gen_random_uuid()
  name text NOT NULL
  category text NOT NULL
  description text
  file_url text NOT NULL
  file_type text NOT NULL -- 'pdf', 'docx', 'xlsx', etc.
  file_size bigint
  uploaded_by uuid REFERENCES profiles(id)
  organization_id uuid REFERENCES organizations(id)
  created_at timestamptz default now()
  ```

### 1.2 Listado de documentos
- Vista en grid de cards (default) + opción lista/tabla
- Cada card muestra:
  - Ícono según tipo de archivo (PDF=rojo, DOCX=azul, XLSX=verde, PPTX=naranja, imagen=purple)
  - Nombre del documento (truncado con `line-clamp-2`)
  - Categoría como `Badge`
  - Tamaño del archivo formateado (KB/MB)
  - Fecha de subida relativa ("hace 2 días")
  - Subido por (nombre del usuario)
- Búsqueda por nombre
- Filtro por categoría
- Filtro por tipo de archivo
- Ordenar por: más reciente, nombre A-Z, tamaño

### 1.3 Acciones por documento
- **Descargar**: botón que descarga el archivo directamente desde Supabase Storage URL
- **QR del documento**: genera QR con la URL pública del archivo, con opción de descargar QR como PNG (1024px)
- **Eliminar**: con modal de confirmación
- **Copiar enlace**: copia la URL al clipboard con toast de confirmación

### 1.4 Stats superiores
- Total de documentos
- Por categoría más frecuente
- Tamaño total almacenado (formateado en MB/GB)
- Documentos subidos este mes

### 1.5 Diseño visual
- Usar clases del design system: `card-modern`, `stagger-children`, `animate-fadeInUp`
- Responsive: grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Mobile: cards compactas, touch targets `min-h-[44px]`
- Empty state con ícono y CTA para subir primer documento
- Ambient blobs en el fondo (como AdminDashboard)

## Tarea 2: QR de acceso a la aplicación (componente global)

### Crear componente reutilizable: `src/components/ui/AppAccessQR.tsx`

Componente modal que muestra:
- QR grande con la URL de la app (`https://capacita-pro.vercel.app`)
- Logo de SoldesP centrado dentro del QR (como overlay)
- Texto: "Escanea para acceder a CapacitaPro"
- Botón "Descargar QR" → genera PNG 1024x1024 con:
  - Fondo oscuro `#0A0E1A`
  - QR centrado
  - Texto "CapacitaPro" debajo
  - Texto "Powered by SoldesP" al fondo
- Botón "Copiar enlace"

### Integrar el QR de acceso en:
- **Header**: agregar botón con ícono QrCode en la barra del header, al lado de notificaciones
- **Sidebar**: agregar enlace "QR de Acceso" en la sección de navegación (ícono: `QrCode` de lucide)

## Tarea 3: Integrar en el routing

### Modificar `src/App.tsx`:
- Agregar import lazy: `const DocumentRepository = lazy(() => import('@/pages/admin/DocumentRepository'));`
- Agregar ruta: `<Route path="/admin/repository" element={<ProtectedRoute requireAdmin><DocumentRepository /></ProtectedRoute>} />`
- Mantener la ruta `/admin/documents` existente para DocumentUpload (crear cursos)

### Modificar `src/components/layout/Sidebar.tsx`:
- Cambiar el link de "Documentos" para que apunte a `/admin/repository` (el repositorio)
- Agregar nuevo link: `{ path: '/admin/documents', icon: Upload, label: 'Crear Curso' }` (o renombrar el existente)
- O mejor: agregar `{ path: '/admin/repository', icon: FolderOpen, label: 'Repositorio' }` como nuevo item

## Reglas técnicas
1. Usar `text-base` en todos los inputs (previene auto-zoom iOS)
2. Todos los colores dark mode: `text-white`, `text-slate-400`, `bg-slate-800`, `border-slate-700`
3. Touch targets mínimo `min-h-[44px]` en mobile
4. Usar `tabular-nums` en números/tamaños
5. Usar `QRCodeSVG` de `qrcode.react` (ya instalado)
6. Formatear tamaños con: `(bytes / 1024 / 1024).toFixed(1) + ' MB'`
7. Fecha relativa: usar `Intl.RelativeTimeFormat` o cálculo manual (no instalar date-fns)
8. Si la tabla `documents` no existe en Supabase, usar localStorage como fallback (mismo patrón que CourseContext)
9. No crear archivos de test
10. Mantener consistencia con el design system existente en `index.css`

## Verificación esperada
| Check | Criterio |
|-------|----------|
| Build | `pnpm run build` sin errores |
| TypeScript | `npx tsc --noEmit` sin errores |
| Subida | Drag & drop funcional, archivo sube a Supabase Storage |
| Descarga | Botón descarga el archivo correctamente |
| QR documento | Genera QR con URL del archivo, descargable como PNG |
| QR app | Modal con QR de acceso a la app, descargable como PNG |
| Responsive | Grid se adapta a mobile/tablet/desktop |
| Dark mode | Todos los textos legibles sobre fondo oscuro |
| Routing | `/admin/repository` carga la página correctamente |
| Sidebar | Link "Repositorio" visible y activo |
