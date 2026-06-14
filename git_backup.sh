#!/bin/bash
# Script de respaldo para CapacitaPro
# Ejecutar desde Terminal: bash "/Volumes/PortableSSD/07_APLICACIONES/Capacita PRO/git_backup.sh"

set -e
REPO_DIR="/Volumes/PortableSSD/07_APLICACIONES/Capacita PRO"
cd "$REPO_DIR"

echo "📁 Directorio: $REPO_DIR"
echo ""

# 1. Limpiar lock si existe
if [ -f ".git/index.lock" ]; then
  echo "🔓 Eliminando lock de git..."
  rm -f ".git/index.lock"
fi

# 2. Stage todo
echo "📦 Agregando archivos al staging..."
git add -A

# 3. Verificar si hay cambios
if git diff --cached --quiet; then
  echo "✅ No hay cambios nuevos para commitear."
else
  git commit -m "🚀 CapacitaPro v1.0 - Plataforma de capacitación corporativa SoldesP

- Login con RUT chileno (12.345.678-9) o email directo
- Roles: super_admin, admin, employee con control de acceso
- Panel Super Admin: promover/degradar admins, resetear contraseñas
- Motor IA DeepSeek: cursos desde PDF/Word con 5 módulos estructurados
- Visor de cursos: slides visuales por tipo + quiz interactivo por módulo
- Evaluación final y emisión de certificados
- Desplegado en capacita-pro.vercel.app (Vercel + Supabase)
- Fecha: 2026-06-13"
  echo "✅ Commit local creado."
fi

echo ""

# 4. Push a GitHub si hay remote configurado
REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE" ]; then
  echo "⚠️  No hay remote de GitHub configurado."
  echo ""
  echo "Para conectar con GitHub, ejecuta estos comandos:"
  echo ""
  echo "  git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git"
  echo "  git push -u origin main"
  echo ""
  echo "  (Reemplaza TU_USUARIO y TU_REPOSITORIO con los tuyos)"
else
  echo "🚀 Pushing a GitHub ($REMOTE)..."
  git push -u origin main
  echo "✅ Push exitoso a GitHub."
fi

echo ""
echo "🎉 Respaldo completado."
