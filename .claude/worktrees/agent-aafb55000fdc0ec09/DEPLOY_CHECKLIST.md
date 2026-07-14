# Checklist de Puesta en Producción — CapacitaPro

## Estado actual
- ✅ App desplegada en https://capacita-pro.vercel.app
- ✅ Login acepta RUT directo (ej: `20.089.645-9`) — novedad de esta versión
- ✅ Código TypeScript sin errores
- ✅ Excel de credenciales generado: `Credenciales_KMC_CapacitaPro.xlsx`
- ⏳ Supabase por configurar (abajo)
- ⏳ Deploy con cambios nuevos (abajo)

---

## PASO 1 — Crear proyecto en Supabase (5 min)

1. Ve a https://supabase.com → New Project
2. Nombre: `capacita-pro`  |  Contraseña de BD: guárdala
3. Región: South America (São Paulo) — más cercana a Chile
4. Espera que termine (~2 min)

---

## PASO 2 — Aplicar migración de base de datos

1. En el dashboard de Supabase → **SQL Editor**
2. Copia y pega el contenido de: `supabase/migrations/20260613000000_initial_schema.sql`
3. Clic en **Run**

---

## PASO 3 — Crear organización y admin inicial

1. En **SQL Editor**, abre `supabase/seed_production.sql`
2. **Edita** las líneas marcadas con `<-- Cambia`:
   - Email del admin
   - Contraseña del admin
3. Clic en **Run**

---

## PASO 4 — Obtener credenciales de Supabase

En el dashboard: **Settings → API**

- `Project URL` → este es tu `VITE_SUPABASE_URL`
- `anon public` key → este es tu `VITE_SUPABASE_ANON_KEY`

---

## PASO 5 — Configurar variables en Vercel

1. Ve a https://vercel.com/rauldiazespejo-ctrls-projects/capacita-pro/settings/environment-variables
2. Agrega:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | tu Project URL de Supabase |
| `VITE_SUPABASE_ANON_KEY` | tu anon key de Supabase |

3. Selecciona entorno: **Production**

---

## PASO 6 — Desplegar con los cambios nuevos

En tu Terminal, ejecuta:

```bash
cd "/Volumes/PortableSSD/07_APLICACIONES/Capacita PRO"
vercel deploy --prod
```

---

## PASO 7 — Desplegar funciones de Supabase Edge

```bash
cd "/Volumes/PortableSSD/07_APLICACIONES/Capacita PRO"
npx supabase functions deploy generate-course --project-ref TU_PROJECT_REF
npx supabase functions deploy import-workers --project-ref TU_PROJECT_REF
npx supabase secrets set DEEPSEEK_API_KEY=TU_CLAVE_DEEPSEEK --project-ref TU_PROJECT_REF
```

> El `PROJECT_REF` está en Settings → General de tu proyecto Supabase (ej: `abcdefghijklm`)

---

## PASO 8 — Importar los 51 trabajadores

1. Ingresa a https://capacita-pro.vercel.app con el admin que creaste
2. Ve a **Empleados → Importar desde Excel**
3. Sube el archivo: `Credenciales_KMC_CapacitaPro.xlsx` original (el del nómina)
4. El sistema crea las cuentas y descarga las credenciales finales con contraseñas reales
5. Entrega físicamente las credenciales a cada trabajador

---

## Cómo ingresan los trabajadores

Los trabajadores simplemente escriben su **RUT** en el campo de login:
```
RUT: 20.089.645-9
Contraseña: (la que viene en las credenciales)
```

No necesitan saber ni recordar ningún correo electrónico.
