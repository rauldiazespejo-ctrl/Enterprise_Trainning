#!/usr/bin/env python3
"""
Manual Completo CapacitaPro - Generador PDF
"""

import qrcode
import io
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, Image, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import Flowable
from reportlab.lib import colors

# ── Colores de Marca ──────────────────────────────────────────────────────────
ORANGE      = HexColor('#D15F3D')
ORANGE_DARK = HexColor('#B34E2D')
NAVY        = HexColor('#001B4B')
NAVY_LIGHT  = HexColor('#1E3A6E')
BG_DARK     = HexColor('#0A0E1A')
BG_CARD     = HexColor('#111827')
SLATE_700   = HexColor('#374151')
SLATE_500   = HexColor('#6B7280')
SLATE_400   = HexColor('#9CA3AF')
SLATE_300   = HexColor('#D1D5DB')
WHITE       = HexColor('#F9FAFB')
EMERALD     = HexColor('#10B981')
AMBER       = HexColor('#F59E0B')
RED         = HexColor('#EF4444')
BLUE        = HexColor('#3B82F6')

PAGE_W, PAGE_H = A4
MARGIN = 2*cm

# ── Generar QR ────────────────────────────────────────────────────────────────
def make_qr_image(url: str, size: int = 300) -> io.BytesIO:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0A0E1A", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)
    return buf

# ── Flowable: línea de color ──────────────────────────────────────────────────
class ColorLine(Flowable):
    def __init__(self, width, color, thickness=1):
        Flowable.__init__(self)
        self.width = width
        self.color = color
        self.thickness = thickness
        self.height = thickness

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 0, self.width, 0)

# ── Flowable: caja coloreada ──────────────────────────────────────────────────
class ColorBox(Flowable):
    def __init__(self, width, height, bg_color, content='', text_color=None, radius=4):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.bg_color = bg_color
        self.content = content
        self.text_color = text_color or white
        self.radius = radius

    def draw(self):
        c = self.canv
        c.setFillColor(self.bg_color)
        c.roundRect(0, 0, self.width, self.height, self.radius, fill=1, stroke=0)

# ── Estilos ───────────────────────────────────────────────────────────────────
def build_styles():
    base = getSampleStyleSheet()

    s = {}

    s['cover_title'] = ParagraphStyle(
        'cover_title', parent=base['Normal'],
        fontSize=40, textColor=WHITE, fontName='Helvetica-Bold',
        leading=46, alignment=TA_CENTER, spaceAfter=6
    )
    s['cover_sub'] = ParagraphStyle(
        'cover_sub', parent=base['Normal'],
        fontSize=16, textColor=SLATE_400, fontName='Helvetica',
        leading=22, alignment=TA_CENTER, spaceAfter=4
    )
    s['cover_orange'] = ParagraphStyle(
        'cover_orange', parent=base['Normal'],
        fontSize=13, textColor=ORANGE, fontName='Helvetica-Bold',
        leading=18, alignment=TA_CENTER
    )
    s['h1'] = ParagraphStyle(
        'h1', parent=base['Normal'],
        fontSize=22, textColor=NAVY, fontName='Helvetica-Bold',
        leading=28, spaceBefore=18, spaceAfter=6
    )
    s['h2'] = ParagraphStyle(
        'h2', parent=base['Normal'],
        fontSize=15, textColor=ORANGE, fontName='Helvetica-Bold',
        leading=20, spaceBefore=14, spaceAfter=4
    )
    s['h3'] = ParagraphStyle(
        'h3', parent=base['Normal'],
        fontSize=12, textColor=NAVY, fontName='Helvetica-Bold',
        leading=16, spaceBefore=8, spaceAfter=3
    )
    s['body'] = ParagraphStyle(
        'body', parent=base['Normal'],
        fontSize=10, textColor=HexColor('#1F2937'), fontName='Helvetica',
        leading=15, spaceAfter=4, alignment=TA_JUSTIFY
    )
    s['body_bold'] = ParagraphStyle(
        'body_bold', parent=base['Normal'],
        fontSize=10, textColor=HexColor('#111827'), fontName='Helvetica-Bold',
        leading=15, spaceAfter=2
    )
    s['bullet'] = ParagraphStyle(
        'bullet', parent=base['Normal'],
        fontSize=10, textColor=HexColor('#1F2937'), fontName='Helvetica',
        leading=15, spaceAfter=2, leftIndent=14, firstLineIndent=-14
    )
    s['note'] = ParagraphStyle(
        'note', parent=base['Normal'],
        fontSize=9, textColor=SLATE_500, fontName='Helvetica-Oblique',
        leading=13, spaceAfter=4
    )
    s['tag'] = ParagraphStyle(
        'tag', parent=base['Normal'],
        fontSize=8, textColor=ORANGE, fontName='Helvetica-Bold',
        leading=12, spaceBefore=2
    )
    s['table_header'] = ParagraphStyle(
        'table_header', parent=base['Normal'],
        fontSize=9, textColor=WHITE, fontName='Helvetica-Bold',
        leading=13, alignment=TA_CENTER
    )
    s['table_cell'] = ParagraphStyle(
        'table_cell', parent=base['Normal'],
        fontSize=9, textColor=HexColor('#1F2937'), fontName='Helvetica',
        leading=13
    )
    s['table_cell_c'] = ParagraphStyle(
        'table_cell_c', parent=base['Normal'],
        fontSize=9, textColor=HexColor('#1F2937'), fontName='Helvetica',
        leading=13, alignment=TA_CENTER
    )
    s['caption'] = ParagraphStyle(
        'caption', parent=base['Normal'],
        fontSize=8, textColor=SLATE_500, fontName='Helvetica-Oblique',
        leading=12, alignment=TA_CENTER, spaceAfter=6
    )
    s['footer'] = ParagraphStyle(
        'footer', parent=base['Normal'],
        fontSize=8, textColor=SLATE_500, fontName='Helvetica',
        leading=11, alignment=TA_CENTER
    )
    return s

# ── Tabla de funcionalidades ──────────────────────────────────────────────────
def feature_table(data, col_widths, styles_dict):
    st = styles_dict
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',   (0,0), (-1,0), 9),
        ('ALIGN',      (0,0), (-1,0), 'CENTER'),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [HexColor('#F9FAFB'), HexColor('#F3F4F6')]),
        ('FONTNAME',   (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE',   (0,1), (-1,-1), 9),
        ('TOPPADDING',    (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING',   (0,0), (-1,-1), 6),
        ('RIGHTPADDING',  (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, HexColor('#E5E7EB')),
        ('LINEBELOW', (0,0), (-1,0), 1.5, ORANGE),
    ]))
    return table

def role_badge_table(roles, styles_dict):
    """Tabla de roles con colores"""
    data = [[
        Paragraph('<b>Rol</b>', styles_dict['table_header']),
        Paragraph('<b>Acceso</b>', styles_dict['table_header']),
        Paragraph('<b>Descripción</b>', styles_dict['table_header']),
        Paragraph('<b>Color badge</b>', styles_dict['table_header']),
    ]]
    for r in roles:
        data.append([
            Paragraph(r[0], styles_dict['table_cell']),
            Paragraph(r[1], styles_dict['table_cell']),
            Paragraph(r[2], styles_dict['table_cell']),
            Paragraph(r[3], styles_dict['table_cell_c']),
        ])
    return feature_table(data, [3.5*cm, 3*cm, 7.5*cm, 3*cm], styles_dict)

# ── Páginas Header/Footer ─────────────────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    w, h = A4
    # Header bar
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 1.2*cm, w, 1.2*cm, fill=1, stroke=0)
    canvas.setFillColor(ORANGE)
    canvas.rect(0, h - 1.2*cm, 0.5*cm, 1.2*cm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont('Helvetica-Bold', 9)
    canvas.drawString(1*cm, h - 0.8*cm, 'CapacitaPro')
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(SLATE_400)
    canvas.drawRightString(w - 1*cm, h - 0.8*cm, 'Manual de Usuario · SoldesP 2026')
    # Footer bar
    canvas.setFillColor(HexColor('#F3F4F6'))
    canvas.rect(0, 0, w, 0.9*cm, fill=1, stroke=0)
    canvas.setStrokeColor(HexColor('#E5E7EB'))
    canvas.setLineWidth(0.5)
    canvas.line(0, 0.9*cm, w, 0.9*cm)
    canvas.setFillColor(SLATE_500)
    canvas.setFont('Helvetica', 8)
    canvas.drawString(MARGIN, 0.35*cm, 'Confidencial · Uso interno SoldesP / Boilercomp')
    canvas.drawRightString(w - MARGIN, 0.35*cm, f'Página {doc.page}')
    canvas.restoreState()

def on_first_page(canvas, doc):
    # Portada sin header/footer normal
    pass

# ── CONTENIDO ─────────────────────────────────────────────────────────────────
def build_story(styles):
    st = styles
    story = []
    TW = PAGE_W - 2*MARGIN  # ancho texto

    # ═══════════════════════════════════════════════════════════════════════════
    # PORTADA
    # ═══════════════════════════════════════════════════════════════════════════
    # Fondo oscuro portada
    story.append(Spacer(1, 2*cm))

    # Logo texto
    story.append(Paragraph('<b>Capacita<font color="#D15F3D">Pro</font></b>', st['cover_title']))
    story.append(Paragraph('Plataforma de Capacitación Corporativa', st['cover_sub']))
    story.append(Spacer(1, 0.3*cm))
    story.append(ColorLine(TW, ORANGE, 2))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph('MANUAL COMPLETO DE USUARIO', st['cover_orange']))
    story.append(Spacer(1, 0.5*cm))

    # QR grande en portada
    qr_buf = make_qr_image('https://capacita-pro.vercel.app', 300)
    qr_img = Image(qr_buf, width=5.5*cm, height=5.5*cm)
    qr_table = Table([[qr_img]], colWidths=[TW])
    qr_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, HexColor('#E5E7EB')),
        ('ROUNDEDCORNERS', [8]),
    ]))
    story.append(qr_table)
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph('Escanea para acceder a la plataforma', st['caption']))
    story.append(Paragraph('https://capacita-pro.vercel.app', ParagraphStyle(
        'url', parent=st['body'], fontSize=10, textColor=NAVY,
        fontName='Helvetica-Bold', alignment=TA_CENTER
    )))
    story.append(Spacer(1, 0.8*cm))

    # Info portada en tabla
    info_data = [
        ['Versión', '2.0 — Junio 2026'],
        ['Empresa', 'SoldesP S.A. / Boilercomp S.A.'],
        ['Plataforma', 'Web App (React 18 + Supabase)'],
        ['Clasificación', 'Confidencial — Uso interno'],
        ['Soporte', 'rauldiazespejo@gmail.com'],
    ]
    info_table = Table(info_data, colWidths=[4*cm, TW-4*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (1,0), (1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('TEXTCOLOR', (0,0), (0,-1), NAVY),
        ('TEXTCOLOR', (1,0), (1,-1), HexColor('#374151')),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [HexColor('#F8FAFC'), HexColor('#F1F5F9')]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.3, HexColor('#E5E7EB')),
        ('LINEBELOW', (0,-1), (-1,-1), 1, ORANGE),
    ]))
    story.append(info_table)
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # TABLA DE CONTENIDOS
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph('Tabla de Contenidos', st['h1']))
    story.append(ColorLine(TW, ORANGE, 1.5))
    story.append(Spacer(1, 0.3*cm))

    toc = [
        ('1.', 'Introducción y Descripción General', '3'),
        ('2.', 'Acceso a la Plataforma', '4'),
        ('3.', 'Roles y Permisos', '4'),
        ('4.', 'Panel de Administrador', '5'),
        ('  4.1', 'Dashboard Principal', '5'),
        ('  4.2', 'Gestión de Cursos', '6'),
        ('  4.3', 'Gestión de Empleados', '7'),
        ('  4.4', 'Asignaciones de Cursos', '8'),
        ('  4.5', 'Repositorio Documental', '9'),
        ('  4.6', 'Certificados', '10'),
        ('  4.7', 'Reportes', '11'),
        ('  4.8', 'Matriz de Capacitaciones', '11'),
        ('  4.9', 'Crear Curso desde Documento', '12'),
        ('  4.10', 'Configuración del Sistema', '13'),
        ('5.', 'Portal del Empleado', '14'),
        ('  5.1', 'Mi Aprendizaje (Dashboard)', '14'),
        ('  5.2', 'Mis Cursos', '14'),
        ('  5.3', 'Mis Certificados', '15'),
        ('  5.4', 'Mi Perfil', '15'),
        ('6.', 'QR de Acceso y Compartir', '16'),
        ('7.', 'Seguridad y Auditoría', '16'),
        ('8.', 'Preguntas Frecuentes', '17'),
        ('9.', 'Glosario', '18'),
    ]

    toc_data = []
    for num, title, page in toc:
        bold = not num.startswith('  ')
        fn = 'Helvetica-Bold' if bold else 'Helvetica'
        size = 10 if bold else 9
        toc_data.append([
            Paragraph(f'<font name="{fn}" size="{size}">{num}</font>', st['body']),
            Paragraph(f'<font name="{fn}" size="{size}">{title}</font>', st['body']),
            Paragraph(f'<font name="{fn}" size="{size}" color="#D15F3D">{page}</font>',
                      ParagraphStyle('p', parent=st['body'], alignment=TA_RIGHT)),
        ])
    toc_table = Table(toc_data, colWidths=[1.2*cm, TW-2.5*cm, 1.3*cm])
    toc_table.setStyle(TableStyle([
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 2),
        ('LINEBELOW', (0,0), (-1,-1), 0.3, HexColor('#F3F4F6')),
    ]))
    story.append(toc_table)
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 1: INTRODUCCIÓN
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph('1. Introducción y Descripción General', st['h1']))
    story.append(ColorLine(TW, ORANGE, 1.5))
    story.append(Spacer(1, 0.2*cm))

    story.append(Paragraph(
        '<b>CapacitaPro</b> es una plataforma web de capacitación corporativa desarrollada para '
        'SoldesP S.A. y Boilercomp S.A. Permite gestionar el ciclo completo de capacitación: '
        'creación de cursos desde documentos corporativos, asignación a empleados, seguimiento '
        'de progreso, emisión de certificados y repositorio documental centralizado.',
        st['body']
    ))
    story.append(Spacer(1, 0.2*cm))

    # Características principales en tabla de iconos
    features = [
        ('Cursos IA', 'Genera cursos y evaluaciones desde PPTX/PDF usando Inteligencia Artificial'),
        ('Asignaciones', 'Asigna cursos individualmente o a todos los empleados con un clic'),
        ('Certificados', 'Emite y verifica certificados digitales con código único'),
        ('Repositorio', 'Almacena y comparte documentos corporativos con QR de acceso'),
        ('Reportes', 'Visualiza estadísticas de avance y cumplimiento en tiempo real'),
        ('Matriz', 'Matriz de capacitaciones con estado por empleado y curso'),
        ('QR de Acceso', 'QR descargable para acceso rápido desde dispositivos móviles'),
        ('Auditoría', 'Registro completo de todas las acciones para ISO 45001'),
    ]

    feat_data = [[
        Paragraph('<b>Funcionalidad</b>', st['table_header']),
        Paragraph('<b>Descripción</b>', st['table_header']),
    ]]
    for f, d in features:
        feat_data.append([
            Paragraph(f'<b>{f}</b>', ParagraphStyle('fb', parent=st['table_cell'],
                      textColor=NAVY, fontName='Helvetica-Bold')),
            Paragraph(d, st['table_cell']),
        ])
    story.append(feature_table(feat_data, [4*cm, TW-4*cm], st))
    story.append(Spacer(1, 0.4*cm))

    story.append(Paragraph(
        '<b>Tecnología:</b> React 18 · TypeScript · Vite · Tailwind CSS · Supabase (PostgreSQL + Storage) · '
        'Vercel (despliegue) · DeepSeek AI (generación de preguntas)',
        st['note']
    ))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 2: ACCESO
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph('2. Acceso a la Plataforma', st['h1']))
    story.append(ColorLine(TW, ORANGE, 1.5))
    story.append(Spacer(1, 0.2*cm))

    story.append(Paragraph(
        'La plataforma es accesible desde cualquier navegador web moderno (Chrome, Safari, Firefox, Edge) '
        'en computadores de escritorio, tablets y smartphones.',
        st['body']
    ))
    story.append(Spacer(1, 0.3*cm))

    # URL y QR lado a lado
    qr_small_buf = make_qr_image('https://capacita-pro.vercel.app', 150)
    qr_small = Image(qr_small_buf, width=3.5*cm, height=3.5*cm)

    access_info = [
        [Paragraph('<b>URL de Acceso</b>', st['h3']), ''],
        [Paragraph('https://capacita-pro.vercel.app', ParagraphStyle(
            'url2', parent=st['body'], fontSize=12, textColor=NAVY,
            fontName='Helvetica-Bold'
        )), qr_small],
        [Paragraph('Disponible 24/7 desde cualquier dispositivo con internet.', st['note']), ''],
    ]
    acc_table = Table(access_info, colWidths=[TW - 4*cm, 4*cm])
    acc_table.setStyle(TableStyle([
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('SPAN', (1,0), (1,0)),
        ('SPAN', (1,1), (1,2)),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(acc_table)
    story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph('<b>Credenciales de Acceso</b>', st['h3']))
    cred_data = [
        [Paragraph('<b>Campo</b>', st['table_header']),
         Paragraph('<b>Formato</b>', st['table_header']),
         Paragraph('<b>Ejemplo</b>', st['table_header'])],
        [Paragraph('RUT (usuario)', st['table_cell']),
         Paragraph('Con dígito verificador y guión', st['table_cell']),
         Paragraph('15422822-5', st['table_cell'])],
        [Paragraph('RUT (alternativo)', st['table_cell']),
         Paragraph('Sin guión ni puntos', st['table_cell']),
         Paragraph('154228225', st['table_cell'])],
        [Paragraph('Contraseña', st['table_cell']),
         Paragraph('RUT sin dígito verificador', st['table_cell']),
         Paragraph('15422822', st['table_cell'])],
    ]
    story.append(feature_table(cred_data, [4*cm, 7*cm, 5*cm], st))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        'Nota: Si olvidaste tu contraseña, usa el enlace "¿Olvidaste tu contraseña?" en la pantalla '
        'de login. Se enviará un email de recuperación a tu correo registrado.',
        st['note']
    ))

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 3: ROLES
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph('3. Roles y Permisos', st['h1']))
    story.append(ColorLine(TW, ORANGE, 1.5))
    story.append(Spacer(1, 0.2*cm))

    story.append(Paragraph(
        'La plataforma maneja 3 niveles de acceso. El sistema redirige automáticamente '
        'al portal correspondiente tras el inicio de sesión.',
        st['body']
    ))
    story.append(Spacer(1, 0.2*cm))

    roles = [
        ('Super Admin', '/super-admin', 'Gestión de administradores, acceso total a todas las organizaciones', 'Dorado'),
        ('Administrador', '/admin', 'Dashboard, cursos, empleados, asignaciones, reportes, repositorio, configuración', 'Naranja'),
        ('Empleado', '/employee', 'Mi aprendizaje, mis cursos, mis certificados, mi perfil', 'Verde'),
    ]
    story.append(role_badge_table(roles, st))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 4: ADMINISTRADOR
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph('4. Panel de Administrador', st['h1']))
    story.append(ColorLine(TW, ORANGE, 1.5))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        'El panel de administrador está disponible en <b>/admin</b>. La barra lateral izquierda '
        'contiene la navegación completa. El header superior incluye búsqueda global, '
        'notificaciones y acceso rápido al QR de la app.',
        st['body']
    ))

    # 4.1 DASHBOARD
    story.append(Paragraph('4.1 Dashboard Principal', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /admin', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'Vista resumen con métricas en tiempo real y acciones rápidas.',
        st['body']
    ))
    dash_items = [
        ['Métrica', 'Descripción'],
        ['Total Empleados', 'Número de empleados activos en la organización'],
        ['Cursos Activos', 'Cursos con estado "Publicado" disponibles para asignar'],
        ['Certificados Emitidos', 'Total de certificados generados en la plataforma'],
        ['Tasa de Completación', 'Porcentaje de asignaciones completadas vs totales'],
    ]
    rows_d = [[Paragraph(dash_items[0][0], st['table_header']),
               Paragraph(dash_items[0][1], st['table_header'])]]
    for r in dash_items[1:]:
        rows_d.append([Paragraph(r[0], ParagraphStyle('b2', parent=st['table_cell'],
                       fontName='Helvetica-Bold', textColor=NAVY)),
                       Paragraph(r[1], st['table_cell'])])
    story.append(feature_table(rows_d, [5*cm, TW-5*cm], st))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'Acciones rápidas disponibles: Subir Documento, Crear Curso, Nueva Asignación. '
        'También muestra empleados recientes, cursos recientes y actividad reciente.',
        st['body']
    ))

    # 4.2 CURSOS
    story.append(Paragraph('4.2 Gestión de Cursos', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /admin/courses', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'Visualización y administración de todos los cursos de la plataforma en formato grid de tarjetas.',
        st['body']
    ))

    curso_items = [
        ['Funcionalidad', 'Detalle'],
        ['Buscar cursos', 'Búsqueda en tiempo real por nombre del curso'],
        ['Filtrar por estado', 'Publicado / Borrador / Archivado'],
        ['Paginación', '12 cursos por página con navegación'],
        ['Ver curso', 'Abre el visualizador del curso con módulos y diapositivas'],
        ['Editar curso', 'Permite modificar título, descripción, categoría, dificultad'],
        ['Eliminar curso', 'Eliminación con modal de confirmación'],
        ['Thumbnail', 'Cada curso muestra miniatura o ícono BookOpen si no tiene imagen'],
        ['Estadísticas', 'Módulos totales, empleados asignados, duración estimada'],
    ]
    rows_c = [[Paragraph(curso_items[0][0], st['table_header']),
               Paragraph(curso_items[0][1], st['table_header'])]]
    for r in curso_items[1:]:
        rows_c.append([Paragraph(r[0], ParagraphStyle('b3', parent=st['table_cell'],
                       fontName='Helvetica-Bold', textColor=NAVY)),
                       Paragraph(r[1], st['table_cell'])])
    story.append(feature_table(rows_c, [5*cm, TW-5*cm], st))

    story.append(Paragraph(
        'Estados de curso: <b>Publicado</b> (badge verde, visible para asignar) · '
        '<b>Borrador</b> (badge amarillo, en preparación) · '
        '<b>Archivado</b> (badge gris, no disponible).',
        st['note']
    ))

    # 4.3 EMPLEADOS
    story.append(Paragraph('4.3 Gestión de Empleados', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /admin/employees', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'Administración completa del directorio de empleados de la organización.',
        st['body']
    ))

    emp_items = [
        ['Acción', 'Descripción'],
        ['Agregar empleado', 'Formulario con nombre, email, RUT, departamento, cargo, rol'],
        ['Editar empleado', 'Modifica todos los datos del perfil del empleado'],
        ['Activar / Desactivar', 'Cambia el estado sin eliminar el registro'],
        ['Eliminar empleado', 'Eliminación definitiva con confirmación'],
        ['Buscar', 'Búsqueda por nombre, email o departamento'],
        ['Filtrar por estado', 'Activos / Inactivos'],
        ['Paginación', 'Navegación por páginas de resultados'],
        ['Badge de rol', 'Muestra si es Administrador o Empleado'],
        ['Importación masiva', 'Endpoint /import-workers para carga de empleados en lote'],
    ]
    rows_e = [[Paragraph(emp_items[0][0], st['table_header']),
               Paragraph(emp_items[0][1], st['table_header'])]]
    for r in emp_items[1:]:
        rows_e.append([Paragraph(r[0], ParagraphStyle('b4', parent=st['table_cell'],
                       fontName='Helvetica-Bold', textColor=NAVY)),
                       Paragraph(r[1], st['table_cell'])])
    story.append(feature_table(rows_e, [5*cm, TW-5*cm], st))
    story.append(PageBreak())

    # 4.4 ASIGNACIONES
    story.append(Paragraph('4.4 Asignaciones de Cursos', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /admin/assignments', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'Gestión centralizada de todas las asignaciones de cursos a empleados.',
        st['body']
    ))

    asig_items = [
        ['Funcionalidad', 'Detalle'],
        ['Stats superiores', 'Total asignaciones / Pendientes / En Progreso / Completadas'],
        ['Nueva Asignación', 'Selecciona curso + empleado específico + fecha límite opcional'],
        ['Asignar a TODOS', 'Checkbox "Asignar a todos los empleados" — asigna en lote, omitiendo ya asignados'],
        ['Buscar asignación', 'Búsqueda por nombre de empleado o título de curso'],
        ['Filtro por curso', 'Filtra las asignaciones por curso específico'],
        ['Filtro por estado', 'Pendiente / En Progreso / Completado'],
        ['Vista tabla', 'Tabla con empleado, curso, fecha límite, progreso y estado'],
        ['Vista mobile', 'Cards individuales en pantallas pequeñas'],
        ['QR de acceso', 'Genera QR descargable con el enlace a la app (PNG 1024px)'],
    ]
    rows_a = [[Paragraph(asig_items[0][0], st['table_header']),
               Paragraph(asig_items[0][1], st['table_header'])]]
    for r in asig_items[1:]:
        rows_a.append([Paragraph(r[0], ParagraphStyle('b5', parent=st['table_cell'],
                       fontName='Helvetica-Bold', textColor=NAVY)),
                       Paragraph(r[1], st['table_cell'])])
    story.append(feature_table(rows_a, [5*cm, TW-5*cm], st))

    story.append(Paragraph(
        'Estados de asignación: <b>Pendiente</b> (gris) · <b>En Progreso</b> (amarillo) · '
        '<b>Completado</b> (verde). El progreso se actualiza automáticamente al avanzar en el curso.',
        st['note']
    ))

    # 4.5 REPOSITORIO
    story.append(Paragraph('4.5 Repositorio Documental', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /admin/repository', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'Almacén centralizado de documentos corporativos con acceso rápido, descarga y QR por documento.',
        st['body']
    ))

    repo_items = [
        ['Funcionalidad', 'Detalle'],
        ['Subir documento', 'Drag & drop o selección de archivo — PDF, DOCX, XLSX, PPTX, JPG, PNG'],
        ['Campos al subir', 'Nombre, Categoría, Descripción (opcional)'],
        ['Categorías', 'Procedimientos / Políticas / Formatos / Manuales / Certificados / Registros HSEQ / Otro'],
        ['Almacenamiento', 'Supabase Storage bucket "documents" + localStorage como respaldo'],
        ['Grid de documentos', 'Tarjetas con color por tipo: PDF rojo, DOCX azul, XLSX verde, PPTX naranja'],
        ['Buscar', 'Búsqueda por nombre de documento en tiempo real'],
        ['Filtrar', 'Por categoría y por tipo de archivo'],
        ['Ordenar', 'Más reciente / Nombre A-Z / Mayor tamaño'],
        ['Descargar', 'Descarga directa del archivo original desde la URL pública'],
        ['QR del documento', 'Genera QR con la URL del documento, descargable como PNG 1024px'],
        ['Copiar enlace', 'Copia la URL pública al portapapeles con confirmación toast'],
        ['Eliminar', 'Eliminación con modal de confirmación'],
        ['Stats superiores', 'Total docs / Categoría más frecuente / Almacenamiento total / Subidos este mes'],
    ]
    rows_r = [[Paragraph(repo_items[0][0], st['table_header']),
               Paragraph(repo_items[0][1], st['table_header'])]]
    for r in repo_items[1:]:
        rows_r.append([Paragraph(r[0], ParagraphStyle('b6', parent=st['table_cell'],
                       fontName='Helvetica-Bold', textColor=NAVY)),
                       Paragraph(r[1], st['table_cell'])])
    story.append(feature_table(rows_r, [4.5*cm, TW-4.5*cm], st))
    story.append(PageBreak())

    # 4.6 CERTIFICADOS
    story.append(Paragraph('4.6 Gestión de Certificados', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /admin/certificates', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'Visualización y administración de todos los certificados emitidos por la plataforma.',
        st['body']
    ))
    cert_items = [
        ['Funcionalidad', 'Detalle'],
        ['Listado de certificados', 'Tabla con empleado, curso, puntuación, fecha y código de verificación'],
        ['Buscar certificado', 'Búsqueda por nombre de empleado o curso'],
        ['Ver certificado', 'Visualización del certificado digital con logo y firma'],
        ['Descargar certificado', 'Descarga en formato PDF/imagen'],
        ['Descargar todos', 'Exportación masiva de certificados'],
        ['Código de verificación', 'Código único por certificado para verificación externa'],
    ]
    rows_ce = [[Paragraph(cert_items[0][0], st['table_header']),
                Paragraph(cert_items[0][1], st['table_header'])]]
    for r in cert_items[1:]:
        rows_ce.append([Paragraph(r[0], ParagraphStyle('b7', parent=st['table_cell'],
                        fontName='Helvetica-Bold', textColor=NAVY)),
                        Paragraph(r[1], st['table_cell'])])
    story.append(feature_table(rows_ce, [5*cm, TW-5*cm], st))

    # 4.7 REPORTES
    story.append(Paragraph('4.7 Reportes', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /admin/reports', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'Visualización de estadísticas y métricas de capacitación con gráficos interactivos.',
        st['body']
    ))
    rep_items = [
        ['Reporte', 'Descripción'],
        ['Resumen general', 'KPIs: empleados, cursos, certificados, tasa de completación'],
        ['Progreso por empleado', 'Porcentaje de avance individual en cursos asignados'],
        ['Cursos más populares', 'Ranking de cursos por número de asignaciones y completaciones'],
        ['Actividad reciente', 'Log de acciones recientes en la plataforma'],
        ['Exportar datos', 'Descarga de reportes en formato compatible'],
        ['Filtro por período', 'Visualización por rango de fechas'],
    ]
    rows_rep = [[Paragraph(rep_items[0][0], st['table_header']),
                 Paragraph(rep_items[0][1], st['table_header'])]]
    for r in rep_items[1:]:
        rows_rep.append([Paragraph(r[0], ParagraphStyle('b8', parent=st['table_cell'],
                         fontName='Helvetica-Bold', textColor=NAVY)),
                         Paragraph(r[1], st['table_cell'])])
    story.append(feature_table(rows_rep, [5*cm, TW-5*cm], st))

    # 4.8 MATRIZ
    story.append(Paragraph('4.8 Matriz de Capacitaciones', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /admin/matrix', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'Vista matricial de todos los empleados (filas) contra todos los cursos (columnas). '
        'Herramienta fundamental para cumplimiento ISO 45001.',
        st['body']
    ))

    mat_items = [
        ['Estado celda', 'Color', 'Significado'],
        ['Completado', 'Verde', 'Empleado aprobó el curso (muestra puntaje y fecha)'],
        ['En Progreso', 'Amarillo', 'Empleado tiene el curso en progreso (muestra %)'],
        ['Pendiente', 'Naranja', 'Asignado pero sin iniciar'],
        ['No Asignado', 'Gris', 'El curso no ha sido asignado a este empleado'],
    ]
    rows_mat = [[
        Paragraph(mat_items[0][0], st['table_header']),
        Paragraph(mat_items[0][1], st['table_header']),
        Paragraph(mat_items[0][2], st['table_header']),
    ]]
    state_colors = [EMERALD, AMBER, ORANGE, SLATE_500]
    for i, r in enumerate(mat_items[1:]):
        rows_mat.append([
            Paragraph(r[0], ParagraphStyle('bm', parent=st['table_cell'],
                      fontName='Helvetica-Bold', textColor=state_colors[i])),
            Paragraph(r[1], st['table_cell']),
            Paragraph(r[2], st['table_cell']),
        ])
    story.append(feature_table(rows_mat, [4*cm, 3*cm, TW-7*cm], st))
    story.append(Paragraph(
        'Funciones adicionales: búsqueda por empleado/curso, filtro por estado (todos/pendiente/completado), '
        'exportar a Excel (XLSX) con un clic.',
        st['note']
    ))
    story.append(PageBreak())

    # 4.9 CREAR CURSO
    story.append(Paragraph('4.9 Crear Curso desde Documento', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /admin/documents', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'Herramienta más potente de la plataforma. Convierte documentos corporativos en cursos '
        'interactivos con evaluaciones generadas por Inteligencia Artificial.',
        st['body']
    ))

    create_steps = [
        ('Paso 1', 'Cargar PPTX', 'Arrastra o selecciona un archivo PowerPoint (.pptx). El sistema extrae automáticamente todas las diapositivas e imágenes.'),
        ('Paso 2', 'Documento fuente (opcional)', 'Puedes agregar un documento de referencia adicional (PDF, DOCX) para enriquecer el contexto del curso.'),
        ('Paso 3', 'Vista previa', 'Visualiza las diapositivas extraídas con su texto e imágenes antes de generar el curso.'),
        ('Paso 4', 'Configurar curso', 'Define: Título, Categoría, Dificultad (Principiante/Intermedio/Avanzado), Número de preguntas (5-20), Nota de aprobación (%).'),
        ('Paso 5', 'Generar con IA', 'El sistema usa DeepSeek AI para generar preguntas de opción múltiple basadas en el contenido de las diapositivas.'),
        ('Paso 6', 'Revisar preguntas', 'Previsualiza las preguntas generadas antes de guardar.'),
        ('Paso 7', 'Guardar curso', 'El curso queda guardado en la plataforma listo para asignar a empleados.'),
    ]

    for step, title, desc in create_steps:
        step_data = [[
            Paragraph(f'<b>{step}</b>', ParagraphStyle('step', parent=st['table_cell'],
                      textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER)),
            Paragraph(f'<b>{title}</b>', ParagraphStyle('stitle', parent=st['table_cell'],
                      fontName='Helvetica-Bold', textColor=NAVY)),
            Paragraph(desc, st['table_cell']),
        ]]
        t = Table(step_data, colWidths=[2*cm, 4*cm, TW-6*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), NAVY),
            ('BACKGROUND', (1,0), (-1,-1), HexColor('#F8FAFC')),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, HexColor('#E5E7EB')),
        ]))
        story.append(t)

    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        'Formatos soportados para PPTX: .pptx (recomendado). El parser extrae texto de cada '
        'diapositiva e imágenes embebidas. Archivos fuente adicionales: PDF, DOCX, XLSX.',
        st['note']
    ))

    # 4.10 CONFIGURACIÓN
    story.append(Paragraph('4.10 Configuración del Sistema', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /admin/settings', st['tag']))
    story.append(Spacer(1, 0.15*cm))

    config_tabs = [
        ['Pestaña', 'Contenido'],
        ['General', 'Nombre de la organización, zona horaria, idioma'],
        ['Inteligencia Artificial', 'API key de DeepSeek, test de conexión, configuración del modelo'],
        ['Base de Datos', 'URL y clave de Supabase, test de conectividad'],
        ['Notificaciones', 'Configuración de alertas y recordatorios automáticos'],
        ['Seguridad', 'Políticas de contraseñas, sesiones, rate limiting'],
    ]
    rows_cfg = [[Paragraph(config_tabs[0][0], st['table_header']),
                 Paragraph(config_tabs[0][1], st['table_header'])]]
    for r in config_tabs[1:]:
        rows_cfg.append([Paragraph(r[0], ParagraphStyle('bc', parent=st['table_cell'],
                         fontName='Helvetica-Bold', textColor=NAVY)),
                         Paragraph(r[1], st['table_cell'])])
    story.append(feature_table(rows_cfg, [4*cm, TW-4*cm], st))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 5: PORTAL EMPLEADO
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph('5. Portal del Empleado', st['h1']))
    story.append(ColorLine(TW, ORANGE, 1.5))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        'El portal del empleado es la interfaz que ven los trabajadores al iniciar sesión. '
        'Está diseñado para ser simple, intuitivo y enfocado en el aprendizaje.',
        st['body']
    ))

    # 5.1 MI APRENDIZAJE
    story.append(Paragraph('5.1 Mi Aprendizaje (Dashboard)', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /employee', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'Página de inicio del empleado con resumen de su progreso y acceso rápido.',
        st['body']
    ))
    emp_dash = [
        ['Sección', 'Descripción'],
        ['Banner de bienvenida', 'Saludo personalizado con nombre del empleado y acceso al próximo curso'],
        ['Estadísticas personales', 'Cursos totales / Completados / En progreso / Certificados obtenidos'],
        ['Próximo curso', 'Card del curso en progreso más reciente con botón de continuar'],
        ['Cursos en progreso', 'Lista de cursos activos con barra de progreso individual'],
        ['Logros recientes', 'Certificados obtenidos recientemente'],
    ]
    rows_ed = [[Paragraph(emp_dash[0][0], st['table_header']),
                Paragraph(emp_dash[0][1], st['table_header'])]]
    for r in emp_dash[1:]:
        rows_ed.append([Paragraph(r[0], ParagraphStyle('be', parent=st['table_cell'],
                        fontName='Helvetica-Bold', textColor=NAVY)),
                        Paragraph(r[1], st['table_cell'])])
    story.append(feature_table(rows_ed, [5*cm, TW-5*cm], st))

    # 5.2 MIS CURSOS / VISOR
    story.append(Paragraph('5.2 Mis Cursos y Visor de Cursos', st['h2']))
    story.append(Paragraph('<b>Rutas:</b> /employee/courses · /employee/course/:id', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'Listado de cursos asignados y visor interactivo de contenido.',
        st['body']
    ))
    visor_items = [
        ['Funcionalidad', 'Detalle'],
        ['Lista de cursos', 'Grid con estado (pendiente/en progreso/completado) y progreso visual'],
        ['Diapositivas', 'Navegación entre slides con texto e imágenes extraídas del PPTX'],
        ['Diapositivas visuales', 'Slides con solo imágenes se muestran en modo visual ampliado'],
        ['Evaluación final', 'Quiz de opción múltiple al completar todas las diapositivas'],
        ['Puntaje mínimo', 'Configurado al crear el curso (ej. 70%). Si no aprueba puede reintentar'],
        ['Certificado automático', 'Se emite automáticamente al aprobar la evaluación'],
        ['Progreso guardado', 'El avance se guarda en Supabase en tiempo real'],
    ]
    rows_v = [[Paragraph(visor_items[0][0], st['table_header']),
               Paragraph(visor_items[0][1], st['table_header'])]]
    for r in visor_items[1:]:
        rows_v.append([Paragraph(r[0], ParagraphStyle('bv', parent=st['table_cell'],
                       fontName='Helvetica-Bold', textColor=NAVY)),
                       Paragraph(r[1], st['table_cell'])])
    story.append(feature_table(rows_v, [5*cm, TW-5*cm], st))

    # 5.3 MIS CERTIFICADOS
    story.append(Paragraph('5.3 Mis Certificados', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /employee/certificates', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    cert2_items = [
        ['Funcionalidad', 'Detalle'],
        ['Listado de certificados', 'Todos los certificados obtenidos con fecha y puntaje'],
        ['Ver certificado', 'Previsualización del certificado digital con logo corporativo'],
        ['Descargar certificado', 'Descarga en formato imagen/PDF'],
        ['Verificar certificado', 'Ingresa un código de verificación para validar cualquier certificado'],
        ['Puntaje promedio', 'Promedio de todos los puntajes obtenidos'],
        ['Estadísticas', 'Total certificados / Puntaje más alto / Promedio general'],
    ]
    rows_c2 = [[Paragraph(cert2_items[0][0], st['table_header']),
                Paragraph(cert2_items[0][1], st['table_header'])]]
    for r in cert2_items[1:]:
        rows_c2.append([Paragraph(r[0], ParagraphStyle('bc2', parent=st['table_cell'],
                        fontName='Helvetica-Bold', textColor=NAVY)),
                        Paragraph(r[1], st['table_cell'])])
    story.append(feature_table(rows_c2, [5*cm, TW-5*cm], st))

    # 5.4 MI PERFIL
    story.append(Paragraph('5.4 Mi Perfil', st['h2']))
    story.append(Paragraph('<b>Ruta:</b> /employee/profile', st['tag']))
    story.append(Spacer(1, 0.15*cm))
    story.append(Paragraph(
        'El empleado puede actualizar sus datos personales: nombre, email, y cambiar su contraseña.',
        st['body']
    ))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 6: QR DE ACCESO
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph('6. QR de Acceso y Compartir', st['h1']))
    story.append(ColorLine(TW, ORANGE, 1.5))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        'CapacitaPro incluye múltiples puntos de generación de QR para facilitar el acceso '
        'y compartir documentos desde dispositivos móviles.',
        st['body']
    ))
    story.append(Spacer(1, 0.3*cm))

    qr_types = [
        ['Tipo de QR', 'Ubicación', 'Contenido', 'Descarga PNG'],
        ['QR de la App', 'Header (ícono QR) + Asignaciones', 'https://capacita-pro.vercel.app', 'Sí — 1024x1024 con branding'],
        ['QR de documento', 'Repositorio > card de documento', 'URL pública del archivo', 'Sí — 1024x1024 con nombre'],
        ['QR de este manual', 'Este documento (portada)', 'https://capacita-pro.vercel.app', 'Incluido al imprimir'],
    ]
    rows_qr = [[Paragraph(qr_types[0][i], st['table_header']) for i in range(4)]]
    for r in qr_types[1:]:
        rows_qr.append([Paragraph(r[0], ParagraphStyle('bq', parent=st['table_cell'],
                        fontName='Helvetica-Bold', textColor=NAVY)),
                        Paragraph(r[1], st['table_cell']),
                        Paragraph(r[2], st['table_cell']),
                        Paragraph(r[3], st['table_cell'])])
    story.append(feature_table(rows_qr, [3.5*cm, 4*cm, 5*cm, TW-12.5*cm], st))

    story.append(Spacer(1, 0.4*cm))
    # QR grande centrado para imprimir
    qr_print_buf = make_qr_image('https://capacita-pro.vercel.app', 300)
    qr_print = Image(qr_print_buf, width=5*cm, height=5*cm)
    qr_print_table = Table([[qr_print, Paragraph(
        '<b>QR de Acceso a CapacitaPro</b><br/><br/>'
        'Escanea este código con la cámara de tu smartphone '
        'para acceder directamente a la plataforma.<br/><br/>'
        '<font color="#D15F3D"><b>https://capacita-pro.vercel.app</b></font><br/><br/>'
        'Disponible 24/7 · Compatible con iOS y Android',
        ParagraphStyle('qr_desc', parent=st['body'], leading=16)
    )]], colWidths=[6*cm, TW-6*cm])
    qr_print_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,-1), HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 1, HexColor('#E5E7EB')),
        ('LEFTPADDING', (0,0), (-1,-1), 16),
        ('RIGHTPADDING', (0,0), (-1,-1), 16),
        ('TOPPADDING', (0,0), (-1,-1), 16),
        ('BOTTOMPADDING', (0,0), (-1,-1), 16),
    ]))
    story.append(qr_print_table)

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 7: SEGURIDAD Y AUDITORÍA
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph('7. Seguridad y Auditoría', st['h1']))
    story.append(ColorLine(TW, ORANGE, 1.5))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        'La plataforma implementa múltiples capas de seguridad y un sistema de auditoría '
        'compatible con los requisitos de ISO 45001.',
        st['body']
    ))

    sec_items = [
        ['Medida de Seguridad', 'Descripción'],
        ['Autenticación Supabase', 'JWT tokens con expiración automática, refresh tokens'],
        ['RLS (Row Level Security)', 'Cada usuario solo accede a datos de su organización'],
        ['Rate Limiting', 'Límite de intentos de login para prevenir ataques de fuerza bruta'],
        ['Rutas protegidas', 'ProtectedRoute valida rol antes de renderizar cualquier página'],
        ['Recuperación de contraseña', 'Email seguro con token de expiración de 1 hora'],
        ['Audit Log (ISO 45001)', 'Registro de todas las acciones: login, cambios, certificados, asignaciones'],
        ['Supabase Edge Functions', 'Funciones serverless para operaciones sensibles sin exponer credenciales'],
        ['Cifrado en tránsito', 'HTTPS obligatorio en producción (Vercel + Supabase)'],
        ['Datos en reposo', 'Cifrado AES-256 en Supabase PostgreSQL y Storage'],
    ]
    rows_sec = [[Paragraph(sec_items[0][0], st['table_header']),
                 Paragraph(sec_items[0][1], st['table_header'])]]
    for r in sec_items[1:]:
        rows_sec.append([Paragraph(r[0], ParagraphStyle('bs', parent=st['table_cell'],
                         fontName='Helvetica-Bold', textColor=NAVY)),
                         Paragraph(r[1], st['table_cell'])])
    story.append(feature_table(rows_sec, [5.5*cm, TW-5.5*cm], st))
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 8: FAQ
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph('8. Preguntas Frecuentes', st['h1']))
    story.append(ColorLine(TW, ORANGE, 1.5))
    story.append(Spacer(1, 0.2*cm))

    faqs = [
        ('¿Puedo usar la plataforma desde mi celular?',
         'Sí. CapacitaPro está diseñado con enfoque mobile-first. Funciona en smartphones iOS y Android. '
         'Puedes escanear el QR de la portada para acceder directamente.'),
        ('¿Qué pasa si no apruebo la evaluación de un curso?',
         'Puedes reintentar la evaluación tantas veces como sea necesario. El sistema guarda tu mejor puntaje.'),
        ('¿Cómo sé si un empleado completó su capacitación?',
         'En el Dashboard verás el estado en tiempo real. En la Matriz de Capacitaciones puedes ver '
         'el estado de cada empleado por curso. También recibirás una notificación automática.'),
        ('¿Los certificados son válidos externamente?',
         'Los certificados incluyen un código único de verificación. Cualquier persona puede verificar '
         'la autenticidad ingresando el código en la sección "Verificar Certificado".'),
        ('¿Puedo subir documentos que no sean PPTX?',
         'Para crear cursos con IA se requiere PPTX. Para el Repositorio Documental puedes subir '
         'PDF, DOCX, XLSX, PPTX, JPG y PNG.'),
        ('¿Cuántos empleados puede manejar la plataforma?',
         'No hay límite técnico. La paginación y la Matriz de Capacitaciones están optimizadas '
         'para organizaciones de cualquier tamaño.'),
        ('¿La plataforma funciona sin internet?',
         'No. Requiere conexión a internet para sincronizar con Supabase. Sin embargo, el modo '
         'offline mantiene temporalmente los datos en localStorage del navegador.'),
        ('¿Cómo agrego múltiples empleados a la vez?',
         'En Asignaciones, usa el checkbox "Asignar a todos los empleados" al crear una nueva '
         'asignación. También existe el endpoint /import-workers para importación masiva.'),
        ('¿Dónde se almacenan los documentos subidos?',
         'En Supabase Storage (bucket "documents"), con URL pública para descarga. Los metadatos '
         'se guardan en la base de datos y en localStorage como respaldo.'),
        ('¿Cómo recupero mi contraseña?',
         'Haz clic en "¿Olvidaste tu contraseña?" en la pantalla de login. Ingresa tu email '
         'registrado y recibirás un enlace de recuperación válido por 1 hora.'),
    ]

    for i, (q, a) in enumerate(faqs):
        faq_data = [[
            Paragraph(f'<b>P{i+1}:</b> {q}', ParagraphStyle('fq', parent=st['body'],
                      textColor=NAVY, fontName='Helvetica-Bold')),
        ], [
            Paragraph(f'{a}', st['body']),
        ]]
        t = Table(faq_data, colWidths=[TW])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), HexColor('#EFF6FF')),
            ('BACKGROUND', (0,1), (-1,1), HexColor('#F9FAFB')),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LINEBEFORE', (0,0), (-1,-1), 3, ORANGE),
            ('LINEBELOW', (0,-1), (-1,-1), 0.5, HexColor('#E5E7EB')),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.15*cm))

    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════════
    # SECCIÓN 9: GLOSARIO
    # ═══════════════════════════════════════════════════════════════════════════
    story.append(Paragraph('9. Glosario', st['h1']))
    story.append(ColorLine(TW, ORANGE, 1.5))
    story.append(Spacer(1, 0.2*cm))

    glosario = [
        ('Asignación', 'Relación entre un curso y un empleado. Puede estar Pendiente, En Progreso o Completada.'),
        ('Bucket', 'Contenedor de archivos en Supabase Storage. El bucket "documents" almacena todos los archivos del repositorio.'),
        ('Certificado', 'Documento digital emitido automáticamente al aprobar la evaluación de un curso.'),
        ('Curso', 'Contenido de capacitación creado desde un PPTX, compuesto por módulos, diapositivas y evaluación.'),
        ('DeepSeek AI', 'Modelo de inteligencia artificial usado para generar preguntas de evaluación a partir del contenido del PPTX.'),
        ('Edge Function', 'Función serverless de Supabase que ejecuta lógica en el servidor sin exponer credenciales.'),
        ('ISO 45001', 'Norma internacional de seguridad y salud en el trabajo. El audit log de CapacitaPro apoya su cumplimiento.'),
        ('JWT', 'JSON Web Token. Mecanismo de autenticación segura usado por Supabase.'),
        ('Módulo', 'Agrupación de diapositivas dentro de un curso (ej. un módulo por sección del PPTX).'),
        ('PPTX', 'Formato de archivo PowerPoint. Es el formato fuente para crear cursos con IA.'),
        ('QR', 'Código de respuesta rápida. Permite acceder a URLs escaneando con la cámara del smartphone.'),
        ('Rate Limiting', 'Límite de solicitudes por tiempo para prevenir abusos y ataques automatizados.'),
        ('RLS', 'Row Level Security. Política de Supabase que restringe el acceso a datos por usuario/organización.'),
        ('Repositorio', 'Sección /admin/repository donde se almacenan y gestionan documentos corporativos.'),
        ('Supabase', 'Plataforma backend open-source usada para base de datos, autenticación y almacenamiento de archivos.'),
        ('Tasa de Completación', 'Porcentaje de asignaciones con estado "Completado" respecto al total.'),
        ('Verificación de Certificado', 'Sistema para validar la autenticidad de un certificado mediante código único.'),
    ]

    glos_data = [[
        Paragraph('<b>Término</b>', st['table_header']),
        Paragraph('<b>Definición</b>', st['table_header']),
    ]]
    for term, defi in glosario:
        glos_data.append([
            Paragraph(f'<b>{term}</b>', ParagraphStyle('gt', parent=st['table_cell'],
                      fontName='Helvetica-Bold', textColor=NAVY)),
            Paragraph(defi, st['table_cell']),
        ])
    story.append(feature_table(glos_data, [4.5*cm, TW-4.5*cm], st))
    story.append(Spacer(1, 0.5*cm))

    # ── Pie final ─────────────────────────────────────────────────────────────
    story.append(ColorLine(TW, ORANGE, 1))
    story.append(Spacer(1, 0.3*cm))

    final_data = [[
        Paragraph(
            '<b>CapacitaPro</b> · Manual de Usuario v2.0<br/>'
            'SoldesP S.A. / Boilercomp S.A. · Junio 2026<br/>'
            '<font color="#D15F3D">https://capacita-pro.vercel.app</font>',
            ParagraphStyle('fin', parent=st['footer'], alignment=TA_LEFT, fontSize=9,
                           textColor=HexColor('#374151'))
        ),
        Paragraph(
            'Documento <b>CONFIDENCIAL</b><br/>'
            'Uso interno exclusivo<br/>'
            'No distribuir sin autorización',
            ParagraphStyle('fin2', parent=st['footer'], alignment=TA_RIGHT, fontSize=9,
                           textColor=HexColor('#374151'))
        ),
    ]]
    ft = Table(final_data, colWidths=[TW/2, TW/2])
    ft.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(ft)

    return story


# ── MAIN ──────────────────────────────────────────────────────────────────────
def main():
    output_path = '/Volumes/PortableSSD/07_APLICACIONES/Capacita PRO/Manual_CapacitaPro_v2.pdf'

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=1.8*cm,
        bottomMargin=1.5*cm,
        title='Manual Completo CapacitaPro',
        author='SoldesP S.A.',
        subject='Manual de Usuario v2.0 - Plataforma de Capacitación Corporativa',
        creator='CapacitaPro Generator',
    )

    styles = build_styles()
    story = build_story(styles)

    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_page)
    print(f'PDF generado: {output_path}')
    size = os.path.getsize(output_path)
    print(f'Tamaño: {size/1024:.1f} KB')


if __name__ == '__main__':
    main()
