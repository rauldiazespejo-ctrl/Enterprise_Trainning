---
version: alpha
name: CapacitaPro
description: >-
  Plataforma de capacitación corporativa HSEQ. Identidad industrial-confiable:
  Navy profundo + Orange terracota. Glass morphism, dark-first, tipografía
  geométrica moderna. Diseñado para uso diario en planta y oficina.
colors:
  # ── Brand ──────────────────────────────────────────────
  brand-navy: "#001B4B"
  brand-navy-light: "#1E3A6E"
  brand-navy-dark: "#000D28"
  brand-orange: "#C4502C"
  brand-orange-light: "#D15F3D"
  brand-orange-dark: "#A23F20"

  # ── Semantic (dark theme defaults) ─────────────────────
  background: "#0A0E1A"
  foreground: "#F9FAFB"
  card: "#111827"
  card-foreground: "#F9FAFB"
  surface: "#1F2937"
  surface-foreground: "#F9FAFB"
  muted: "#1B2333"
  muted-foreground: "#9CA3AF"
  border: "#1E2A3D"
  input: "#1E2A3D"
  ring: "#C4502C"

  # ── Semantic (light theme) ─────────────────────────────
  background-light: "#FAFAFA"
  foreground-light: "#111827"
  card-light: "#FFFFFF"
  card-light-foreground: "#111827"
  surface-light: "#F3F4F6"
  surface-light-foreground: "#111827"
  muted-light: "#E5E7EB"
  muted-light-foreground: "#6B7280"
  border-light: "#D1D5DB"
  input-light: "#D1D5DB"

  # ── Accents ────────────────────────────────────────────
  primary: "#C4502C"
  primary-hover: "#D15F3D"
  secondary: "#001B4B"
  secondary-hover: "#1E3A6E"
  accent: "#F59E0B"
  destructive: "#EF4444"
  success: "#10B981"
  info: "#3B82F6"
  warning: "#F59E0B"

typography:
  h1:
    fontFamily: Lexend
    fontSize: 3rem
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  h2:
    fontFamily: Lexend
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  h3:
    fontFamily: Lexend
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0em"
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Source Sans 3
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Source Sans 3
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Source Sans 3
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.05em"
  mono:
    fontFamily: SF Mono, Menlo, monospace
    fontSize: 0.9rem
    fontWeight: 500
    lineHeight: 1.5

rounded:
  none: 0px
  sm: 6px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px

elevation:
  none: "none"
  sm: "0 1px 2px 0 rgba(0,0,0,0.3)"
  md: "0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -1px rgba(0,0,0,0.3)"
  lg: "0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -2px rgba(0,0,0,0.4)"
  brand: "0 4px 20px rgba(209,95,61,0.3)"
  glow: "0 0 40px rgba(209,95,61,0.2)"
  glass: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.4)"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 12px
    typography:
      fontFamily: Lexend
      fontSize: 1rem
      fontWeight: 600
      lineHeight: 1.2
  button-primary-hover:
    backgroundColor: "{colors.brand-orange-dark}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 12px
  button-secondary-hover:
    backgroundColor: "{colors.secondary-hover}"
    textColor: "#FFFFFF"
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.md}"
    padding: 12px
  button-ghost-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
  input-field:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: 12px
  input-field-focus:
    backgroundColor: "{colors.input}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
  card-surface:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.lg}"
    padding: 24px
  glass-card:
    backgroundColor: "rgba(17,24,39,0.7)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: 24px
  badge-success:
    backgroundColor: "rgba(16,185,129,0.15)"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: 4px
  badge-warning:
    backgroundColor: "rgba(245,158,11,0.15)"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: 4px
  badge-destructive:
    backgroundColor: "rgba(239,68,68,0.15)"
    textColor: "{colors.destructive}"
    rounded: "{rounded.full}"
    padding: 4px
  nav-item:
    backgroundColor: transparent
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.md}"
    padding: 10px
  nav-item-active:
    backgroundColor: "rgba(209,95,61,0.12)"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
---

## Overview

CapacitaPro es la plataforma de capacitación corporativa de SoldesP S.A. para
gestión HSEQ. La identidad visual combina **Navy profundo** (confianza
industrial, compliance ISO) con **Orange terracota** (energía, acción,
capacitación). El diseño es **dark-first** con glass morphism para crear
profundidad sin sacrificar legibilidad en pantallas industriales.

La filosofía es **"claridad operacional"**: cada elemento visual tiene un
propósito funcional. Los ornamentos se eliminan en favor de densidad
informativa y escaneo rápido.

### Dirección material: acero operativo

Las superficies principales reinterpretan gabinetes eléctricos y equipos de
planta mediante grafito, acero frío, reflejos superiores y una veta cepillada
muy tenue. El efecto se reserva para navegación, header, login y tarjetas;
no se aplica al texto ni compite con los estados HSEQ. El cobre SoldesP se
mantiene como material de acción y nunca como fondo dominante.

## Colors

- **Brand Navy (#001B4B):** Color corporativo de SoldesP. Usado para headers,
  sidebars, y elementos de marca. Transmite solidez y cumplimiento normativo.
- **Brand Orange (#D15F3D):** Color de acción. Botones primarios, links,
  indicadores de progreso. Es el único driver de interacción de alto énfasis.
- **Accent Amber (#F59E0B):** Notificaciones, advertencias, highlights.
- **Success Green (#10B981):** Estados completados, certificados, logros.
- **Destructive Red (#EF4444):** Errores, eliminación, alertas críticas.
- **MutedForeground (#9CA3AF):** Texto secundario, labels, metadata.

El sistema usa **tokens HSL por tema** que cambian dinámicamente entre
claro/oscuro. El naranja se mantiene constante en ambos temas como ancla
visual de marca.

## Typography

- **Lexend** (400-800): Headers y títulos. Geométrica, moderna, optimizada
  para legibilidad en pantallas. El peso 800 se reserva para h1 hero.
- **Source Sans 3** (400-700): Cuerpo de texto, formularios, UI. Protagonista
  de la densidad informativa.
- **SF Mono**: Inputs de RUT, códigos de verificación, datos técnicos.

Jerarquía: h1 (3rem/800) → h2 (2rem/700) → h3 (1.5rem/600) → body-lg → body-md
→ body-sm → label (0.75rem/600 uppercase 0.05em).

## Layout & Spacing

Sistema de 8px base. Container centrado con max-width 1400px. Padding de
2rem en container. Grid de 12 columnas implícito con gap de 24px.

Layout principal: sidebar fija (260px) + área de contenido flexible. En
móvil, sidebar colapsa a drawer con overlay.

## Elevation & Depth

- **sm**: Cards anidadas, inputs
- **md**: Dropdowns, popovers
- **lg**: Modales, dialogs
- **brand**: Botones primarios (glow naranja)
- **glow**: Elementos destacados (hero, CTA)
- **glass**: Glass morphism con inset highlight + blur

## Shapes

Border radius generoso (12-16px) para softening del aspect industrial.
Componentes interactivos usan 12px, contenedores 16px, badges pill (full).
Inputs mantienen 12px para consistencia táctil.

## Components

- **button-primary**: Acción principal. Naranja sólido, texto blanco, radius
  12px. Hover aclara a orange-light. Shadow brand (glow 20% naranja).
- **button-secondary**: Navy sólido para acciones de marca.
- **button-ghost**: Transparente para acciones terciarias.
- **input-field**: Fondo input token, border subtle, focus ring naranja.
- **card-surface**: Contenedor base. Fondo card, radius 16px, padding 24px.
- **glass-card**: Variante premium con backdrop-blur(20px) + glass border.
- **badge-***: Pills semánticos (success/warning/destructive) con bg 15%.
- **nav-item**: Item de navegación. Transparente por defecto, activo tiene
  bg naranja 12% + texto naranja.

## Do's and Don'ts

### Do
- Usar orange solo para acciones primarias y CTAs
- Mantener contraste mínimo 4.5:1 (WCAG AA) en texto
- Usar glass morphism con moderación (hero, login, modales)
- Reservar h1/800 para páginas hero únicamente
- Animar transiciones con cubic-bezier(0.16, 1, 0.3, 1) (ease-out premium)

### Don't
- No usar navy y orange en proporciones iguales (naranja es acento, no base)
- No mezclar más de 2 pesos de Lexend en una vista
- No usar glass-card dentro de glass-card (evitar blur stacking)
- No aplicar elevation lg a elementos inline
- No usar destructive red para navegación o información no crítica
