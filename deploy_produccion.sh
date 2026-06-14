#!/bin/bash
# ============================================================
# DEPLOY COMPLETO — CapacitaPro / Soldesp S.A.
# Ejecutar desde la raíz del proyecto: bash deploy_produccion.sh
# ============================================================
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

SUPABASE_URL="https://vyumcxkjetzalvnebgqi.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dW1jeGtqZXR6YWx2bmViZ3FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTI1MzcsImV4cCI6MjA5NjU4ODUzN30.3xwaIo56JaoVU4FxIAgPNn6nq1GgSSvxcpeWoIbtY8I"
SUPABASE_PROJECT_REF="vyumcxkjetzalvnebgqi"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     CapacitaPro — Deploy a Producción            ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── PASO 1: Variables de entorno en Vercel ──────────────────
VERCEL="npx --yes vercel"
SUPA="npx --yes supabase"

echo "▶ [1/4] Configurando variables de entorno en Vercel..."
$VERCEL env rm VITE_SUPABASE_URL production --yes 2>/dev/null || true
$VERCEL env rm VITE_SUPABASE_ANON_KEY production --yes 2>/dev/null || true
echo "$SUPABASE_URL"      | $VERCEL env add VITE_SUPABASE_URL production
echo "$SUPABASE_ANON_KEY" | $VERCEL env add VITE_SUPABASE_ANON_KEY production
echo "  ✓ Variables configuradas"

# ── PASO 2: Deploy a Vercel producción ─────────────────────
echo ""
echo "▶ [2/4] Desplegando frontend a Vercel producción..."
$VERCEL deploy --prod --yes
echo "  ✓ Frontend desplegado"

# ── PASO 3: Funciones Edge de Supabase ─────────────────────
echo ""
echo "▶ [3/4] Desplegando Edge Functions a Supabase..."
$SUPA functions deploy generate-course --project-ref "$SUPABASE_PROJECT_REF"
$SUPA functions deploy import-workers  --project-ref "$SUPABASE_PROJECT_REF"
echo "  ✓ Edge Functions desplegadas"

# ── PASO 4: Secreto DeepSeek (opcional) ────────────────────
echo ""
echo "▶ [4/4] Secreto DEEPSEEK_API_KEY..."
if [ -n "$DEEPSEEK_API_KEY" ]; then
  $SUPA secrets set DEEPSEEK_API_KEY="$DEEPSEEK_API_KEY" --project-ref "$SUPABASE_PROJECT_REF"
  echo "  ✓ Secreto configurado"
else
  echo "  ⚠ Sin DEEPSEEK_API_KEY — la generación de cursos con IA quedará deshabilitada."
  echo "    Cuando tengas la clave ejecuta:"
  echo "    npx supabase secrets set DEEPSEEK_API_KEY=tu_clave --project-ref $SUPABASE_PROJECT_REF"
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ Deploy completado                            ║"
echo "║                                                  ║"
echo "║  URL: https://capacita-pro.vercel.app            ║"
echo "║  Admin: admin@soldesp.cl / Soldesp2024!          ║"
echo "║                                                  ║"
echo "║  Próximo paso:                                   ║"
echo "║  Importar trabajadores desde el panel admin      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
