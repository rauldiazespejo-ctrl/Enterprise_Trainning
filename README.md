# CapacitaPro - Plataforma de Capacitación Corporativa

## Descripción

CapacitaPro es una plataforma completa de capacitación corporativa que permite:

- **Subir documentos** (PDF, TXT) y generar cursos automáticamente (similar a Notebook LM)
- **Visualizar cursos** con diapositivas interactivas
- **Realizar quizzes** para reforzar contenidos en cada módulo
- **Evaluaciones finales** para completar cursos
- **Emitir certificados** con código de verificación
- **Panel de administración** para gestionar empleados y cursos

## Características Principales

### Para Administradores (Superusuario):
- Dashboard con estadísticas de la plataforma
- Gestión de empleados
- Asignación de cursos a empleados
- Gestión de certificados
- Reportes y análisis
- Configuración del sistema

### Para Empleados:
- Portal de aprendizaje personalizado
- Visualización de cursos con navegación por módulos
- Diapositivas interactivas
- Quizzes en cada módulo
- Evaluación final
- Certificados

## Credenciales de Demo Local

### Administrador:
- Email: `admin@capacitapro.com`
- Contraseña: `admin123`

### Empleado:
- Email: `empleado@capacitapro.com`
- Contraseña: `empleado123`

Estas cuentas solo se incluyen al ejecutar Vite en modo desarrollo. Nunca forman parte del
bundle de producción.

## Persistencia de Datos

Todos los datos (usuarios, cursos, asignaciones, progreso y certificados) se guardan en
`localStorage` del navegador durante el modo demo. Para producción, usa las migraciones,
políticas RLS y funciones incluidas en `supabase/`.

## Generación de Cursos con IA (DeepSeek)

Para generar cursos reales a partir de documentos (módulos, diapositivas y quizzes basados
en el contenido), configura tu API key de DeepSeek:

1. Despliega `supabase/functions/generate-course`
2. Configura `DEEPSEEK_API_KEY` como secreto de Supabase
3. Define únicamente las variables públicas de Supabase en el frontend

Sin la función configurada, la app usa un generador básico de demostración.

## Configuración de Supabase (Opcional)

Para usar persistencia de datos real, configura Supabase:

1. Crea una cuenta en supabase.com
2. Crea un nuevo proyecto
3. En Settings → API, copia la URL y la clave anon
4. En el panel de administración (Configuración → Base de Datos), ingresa las credenciales

## Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev

# Compilar para producción
pnpm build
```

## Estructura del Proyecto

```
src/
├── components/
│   ├── ui/           # Componentes UI reutilizables
│   ├── layout/       # Layout principal (Sidebar, Header)
│   ├── admin/        # Componentes específicos del admin
│   ├── employee/    # Componentes específicos del empleado
│   ├── course/       # Componentes de cursos
│   └── quiz/         # Componentes de quizzes
├── contexts/        # Contextos de React (Auth, Course)
├── hooks/           # Hooks personalizados
├── lib/             # Utilidades y servicios
├── pages/           # Páginas de la aplicación
│   ├── admin/       # Páginas del administrador
│   ├── employee/    # Páginas del empleado
│   └── auth/        # Páginas de autenticación
├── types/           # Definiciones de TypeScript
└── utils/           # Funciones auxiliares
```

## Tecnologías Utilizadas

- **React 18** con TypeScript
- **Vite** para construcción y desarrollo
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Supabase** para base de datos (opcional)
- **PDF.js** para extracción de texto de PDFs

## Licencia

© 2024 CapacitaPro. Todos los derechos reservados.
