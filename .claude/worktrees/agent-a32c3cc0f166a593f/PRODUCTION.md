# Puesta en Producción

## Requisitos

- Node.js 22
- pnpm 11.5.3
- Proyecto Supabase
- Hosting compatible con SPA, como Vercel

## Preparación

1. Ejecuta las migraciones de `supabase/migrations`.
2. Despliega `supabase/functions/generate-course`.
3. Configura `DEEPSEEK_API_KEY` como secreto de Supabase.
4. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el hosting.
5. Crea la organización y el primer perfil administrador en Supabase.

Nunca configures claves privadas usando el prefijo `VITE_`.

## Puertas de Entrega

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm audit:prod
```

El despliegue debe detenerse si cualquiera de estos comandos falla.

## Despliegue

El archivo `vercel.json` incluye rewrites para React Router y cabeceras básicas de seguridad.
Los despliegues de producción deben usar:

```bash
pnpm build:prod
```

## Operación

- Revisa errores de frontend y funciones server-side.
- Habilita backups automáticos de Supabase.
- Prueba restauración y rollback antes de incorporar usuarios reales.
- Revisa periódicamente las políticas RLS y el reporte de dependencias.
