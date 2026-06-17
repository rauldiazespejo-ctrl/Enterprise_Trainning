import JSZip from 'jszip';

export interface PptxSlide {
  slideNumber: number;
  title: string;
  bullets: string[];
  rawText: string;
  images: string[];  // base64 data URLs of embedded images (compressed)
}

const DISPLAYABLE_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

async function compressImage(dataUrl: string, maxWidth = 1200, quality = 0.80): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= maxWidth) { resolve(dataUrl); return; }
      const scale = maxWidth / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function extractSlideImages(zip: JSZip, slidePath: string): Promise<string[]> {
  const slideFileName = slidePath.split('/').pop()!;
  const relsPath = `ppt/slides/_rels/${slideFileName}.rels`;
  const relsFile = zip.files[relsPath];
  if (!relsFile) return [];

  const relsXml = await relsFile.async('string');
  const imageTargets: string[] = [];

  const relRe = /<Relationship\s[^>]*>/gi;
  let rm = relRe.exec(relsXml);
  while (rm) {
    const tag = rm[0];
    if (/Type="[^"]*\/image"/i.test(tag)) {
      const targetMatch = tag.match(/Target="([^"]+)"/i);
      if (targetMatch) imageTargets.push(targetMatch[1]);
    }
    rm = relRe.exec(relsXml);
  }

  const images: string[] = [];
  for (const target of imageTargets.slice(0, 6)) {
    const resolved = target.startsWith('../')
      ? 'ppt/' + target.slice(3)
      : 'ppt/slides/' + target;

    const ext = resolved.split('.').pop()?.toLowerCase() || '';
    const mime = DISPLAYABLE_MIME[ext];
    if (!mime) continue;

    const imgFile = zip.files[resolved];
    if (!imgFile) continue;

    try {
      const b64 = await imgFile.async('base64');
      if (b64.length < 200) continue;
      const compressed = await compressImage(`data:${mime};base64,${b64}`);
      images.push(compressed);
    } catch { /* ignore */ }
  }
  return images;
}

function extractSlideNumber(filename: string): number {
  const match = filename.match(/\d+/g);
  return match ? parseInt(match[match.length - 1], 10) : 0;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)));
}

function extractAllText(xml: string): string[] {
  const results: string[] = [];

  const re1 = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  let m = re1.exec(xml);
  while (m) {
    const t = decodeEntities(m[1]).trim();
    if (t) results.push(t);
    m = re1.exec(xml);
  }

  if (results.length > 0) return results;

  const re2 = /<t[^>]*>([\s\S]*?)<\/t>/g;
  let m2 = re2.exec(xml);
  while (m2) {
    const t = decodeEntities(m2[1]).trim();
    if (t && t.length < 500) results.push(t);
    m2 = re2.exec(xml);
  }

  if (results.length > 0) return results;

  const stripped = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (stripped.length > 2 && stripped.length < 10000) results.push(stripped);

  return results;
}

// ── Table extraction: preserves row/column structure ──────────────────────────

function extractTableText(xml: string): string[] {
  const tables: string[] = [];
  const tblOpen = '<a:tbl';
  const tblClose = '</a:tbl>';
  let pos = 0;

  while (true) {
    const start = xml.indexOf(tblOpen, pos);
    if (start === -1) break;
    const end = xml.indexOf(tblClose, start);
    if (end === -1) break;
    const tblXml = xml.slice(start, end + tblClose.length);
    pos = end + tblClose.length;

    const rows: string[][] = [];
    const trOpen = '<a:tr';
    const trClose = '</a:tr>';
    let rpos = 0;

    while (true) {
      const rs = tblXml.indexOf(trOpen, rpos);
      if (rs === -1) break;
      const re = tblXml.indexOf(trClose, rs);
      if (re === -1) break;
      const rowXml = tblXml.slice(rs, re + trClose.length);
      rpos = re + trClose.length;

      const cells: string[] = [];
      const tcOpen = '<a:tc';
      const tcClose = '</a:tc>';
      let cpos = 0;

      while (true) {
        const cs = rowXml.indexOf(tcOpen, cpos);
        if (cs === -1) break;
        const ce = rowXml.indexOf(tcClose, cs);
        if (ce === -1) break;
        const cellXml = rowXml.slice(cs, ce + tcClose.length);
        cpos = ce + tcClose.length;

        const cellTexts = extractAllText(cellXml);
        cells.push(cellTexts.join(' '));
      }

      if (cells.some(c => c.trim())) rows.push(cells);
    }

    if (rows.length > 0) {
      const formatted = rows.map(row => row.join(' | ')).join('\n');
      tables.push(formatted);
    }
  }

  return tables;
}

// ── Chart extraction: titles, categories, series labels ──────────────────────

async function extractChartTexts(zip: JSZip, slidePath: string): Promise<string[]> {
  const slideFileName = slidePath.split('/').pop()!;
  const relsPath = `ppt/slides/_rels/${slideFileName}.rels`;
  const relsFile = zip.files[relsPath];
  if (!relsFile) return [];

  const relsXml = await relsFile.async('string');
  const chartTargets: string[] = [];
  const re = /<Relationship[^>]+Type="[^"]*\/(chart|chart2021)"[^>]+Target="([^"]+)"/gi;
  let m = re.exec(relsXml);
  while (m) { chartTargets.push(m[2]); m = re.exec(relsXml); }

  const results: string[] = [];
  for (const target of chartTargets) {
    const resolved = target.startsWith('../')
      ? 'ppt/' + target.slice(3)
      : 'ppt/slides/' + target;

    const chartFile = zip.files[resolved];
    if (!chartFile) continue;

    try {
      const chartXml = await chartFile.async('string');

      // Chart title
      const titleMatch = chartXml.match(/<c:chart[\s\S]*?<c:title[\s\S]*?<a:t[^>]*>([\s\S]*?)<\/a:t>/);
      if (titleMatch) results.push('[Gráfico: ' + decodeEntities(titleMatch[1].trim()) + ']');

      // Category labels (<c:cat> → <c:v>)
      const catValues: string[] = [];
      const catRe = /<c:cat>[\s\S]*?<c:strRef>[\s\S]*?<c:strCache>([\s\S]*?)<\/c:strCache>/g;
      let cm = catRe.exec(chartXml);
      while (cm) {
        const vRe = /<c:v>([\s\S]*?)<\/c:v>/g;
        let vm = vRe.exec(cm[1]);
        while (vm) {
          const v = decodeEntities(vm[1].trim());
          if (v && !catValues.includes(v)) catValues.push(v);
          vm = vRe.exec(cm[1]);
        }
        cm = catRe.exec(chartXml);
      }
      if (catValues.length > 0) results.push('Categorías: ' + catValues.join(', '));

      // Series names (<c:tx> → <c:v>)
      const seriesNames: string[] = [];
      const serRe = /<c:tx>[\s\S]*?<c:strRef>[\s\S]*?<c:strCache>[\s\S]*?<c:v>([\s\S]*?)<\/c:v>/g;
      let sm = serRe.exec(chartXml);
      while (sm) {
        const v = decodeEntities(sm[1].trim());
        if (v && !seriesNames.includes(v)) seriesNames.push(v);
        sm = serRe.exec(chartXml);
      }
      if (seriesNames.length > 0) results.push('Series: ' + seriesNames.join(', '));

      // Fallback: any <a:t> text in the chart
      if (results.length === 0) {
        const allChartText = extractAllText(chartXml);
        results.push(...allChartText.slice(0, 5));
      }
    } catch { /* ignore */ }
  }

  return results;
}

// ── SmartArt/diagram extraction per slide via relationships ──────────────────

async function extractDiagramTexts(zip: JSZip, slidePath: string): Promise<string[]> {
  const slideFileName = slidePath.split('/').pop()!;
  const relsPath = `ppt/slides/_rels/${slideFileName}.rels`;
  const relsFile = zip.files[relsPath];
  if (!relsFile) return [];

  const relsXml = await relsFile.async('string');
  const diagramTargets: string[] = [];
  const re = /<Relationship[^>]+Type="[^"]*\/diagramData"[^>]+Target="([^"]+)"/gi;
  let m = re.exec(relsXml);
  while (m) { diagramTargets.push(m[1]); m = re.exec(relsXml); }

  const results: string[] = [];
  for (const target of diagramTargets) {
    const resolved = target.startsWith('../')
      ? 'ppt/' + target.slice(3)
      : 'ppt/slides/' + target;

    const dgmFile = zip.files[resolved];
    if (!dgmFile) continue;

    try {
      const dgmXml = await dgmFile.async('string');
      results.push(...extractAllText(dgmXml));
    } catch { /* ignore */ }
  }

  return results;
}

// ── Extract text from graphicFrame, mc:AlternateContent, grpSp ──────────────

function extractFrameAndAlternateText(xml: string): string[] {
  const results: string[] = [];

  // mc:AlternateContent — Canva, newer Office versions wrap content here
  const mcRe = /<mc:AlternateContent>([\s\S]*?)<\/mc:AlternateContent>/g;
  let mcm = mcRe.exec(xml);
  while (mcm) {
    // Prefer mc:Fallback (simpler), then mc:Choice
    const fallbackMatch = mcm[1].match(/<mc:Fallback>([\s\S]*?)<\/mc:Fallback>/);
    const choiceMatch = mcm[1].match(/<mc:Choice[^>]*>([\s\S]*?)<\/mc:Choice>/);
    const source = fallbackMatch?.[1] || choiceMatch?.[1] || mcm[1];
    results.push(...extractAllText(source));
    mcm = mcRe.exec(xml);
  }

  // p:graphicFrame — Google Slides puts text in these
  const gfRe = /<p:graphicFrame>([\s\S]*?)<\/p:graphicFrame>/g;
  let gfm = gfRe.exec(xml);
  while (gfm) {
    // Skip if it's a table (handled separately) or chart (handled via rels)
    if (!gfm[1].includes('<a:tbl') && !gfm[1].includes('chart')) {
      results.push(...extractAllText(gfm[1]));
    }
    gfm = gfRe.exec(xml);
  }

  // grpSp (grouped shapes) — recursive text extraction
  const grpRe = /<p:grpSp>([\s\S]*?)<\/p:grpSp>/g;
  let grpm = grpRe.exec(xml);
  while (grpm) {
    results.push(...extractAllText(grpm[1]));
    grpm = grpRe.exec(xml);
  }

  return results;
}

// Parse <p:sp> blocks and detect title placeholders
function extractSpBlocks(xml: string): Array<{ block: string; isTitle: boolean }> {
  const results: Array<{ block: string; isTitle: boolean }> = [];
  const openTag = xml.includes('<p:sp') ? '<p:sp' : '<sp';
  const closeTag = xml.includes('</p:sp>') ? '</p:sp>' : '</sp>';
  let start = 0;
  while (true) {
    const open = xml.indexOf(openTag, start);
    if (open === -1) break;
    const close = xml.indexOf(closeTag, open);
    if (close === -1) break;
    const block = xml.slice(open, close + closeTag.length);
    const isTitle =
      block.includes('type="title"') ||
      block.includes('type="ctrTitle"') ||
      block.includes("type='title'") ||
      block.includes("type='ctrTitle'") ||
      block.includes('idx="0"');
    results.push({ block, isTitle });
    start = close + closeTag.length;
  }
  return results;
}

export async function parsePptx(file: File): Promise<PptxSlide[]> {
  const arrayBuffer = await file.arrayBuffer();
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch {
    throw new Error(
      'No se pudo abrir el archivo PPTX. Verifica que no esté dañado o protegido con contraseña.'
    );
  }

  let slideFiles = Object.keys(zip.files).filter(name =>
    /^ppt\/slides\/slide\d+\.xml$/.test(name)
  );
  if (slideFiles.length === 0) {
    slideFiles = Object.keys(zip.files).filter(
      name =>
        name.includes('slides/slide') &&
        name.endsWith('.xml') &&
        !name.includes('_rels')
    );
  }
  if (slideFiles.length === 0) {
    throw new Error(
      'No se encontraron diapositivas en el archivo. Asegúrate de que sea un archivo .pptx válido.'
    );
  }
  slideFiles.sort((a, b) => extractSlideNumber(a) - extractSlideNumber(b));

  // Pre-load orphan SmartArt diagram data (not linked via slide rels)
  const allDiagramFiles = Object.keys(zip.files).filter(
    name => name.includes('diagrams/data') && name.endsWith('.xml')
  );
  const orphanDiagramTexts: string[] = [];
  for (const df of allDiagramFiles) {
    try {
      const xml = await zip.files[df].async('string');
      orphanDiagramTexts.push(...extractAllText(xml));
    } catch { /* ignore */ }
  }

  const slides: PptxSlide[] = [];

  for (const slideName of slideFiles) {
    const slideNumber = extractSlideNumber(slideName);
    let xml: string;
    try {
      xml = await zip.files[slideName].async('string');
    } catch {
      continue;
    }

    // ── Pass 1: extract text from <p:sp> shape blocks ──────────────────────
    const spBlocks = extractSpBlocks(xml);
    let title = '';
    const bodyTexts: string[] = [];

    for (const { block, isTitle } of spBlocks) {
      const texts = extractAllText(block);
      if (texts.length === 0) continue;
      if (isTitle && !title) {
        title = texts.join(' ');
      } else {
        bodyTexts.push(...texts);
      }
    }

    // ── Pass 1b: tables with row/column structure ──────────────────────────
    const tableTexts = extractTableText(xml);
    if (tableTexts.length > 0) bodyTexts.push(...tableTexts);

    // ── Pass 1c: graphicFrame, mc:AlternateContent, grpSp ──────────────────
    const frameTexts = extractFrameAndAlternateText(xml);
    // Only add texts not already captured by Pass 1
    const existingSet = new Set([title, ...bodyTexts].map(t => t.trim().toLowerCase()));
    for (const ft of frameTexts) {
      if (ft.trim() && !existingSet.has(ft.trim().toLowerCase())) {
        bodyTexts.push(ft);
        existingSet.add(ft.trim().toLowerCase());
      }
    }

    // ── Pass 1d: SmartArt diagrams linked to this slide ────────────────────
    const dgmTexts = await extractDiagramTexts(zip, slideName);
    for (const dt of dgmTexts) {
      if (dt.trim() && !existingSet.has(dt.trim().toLowerCase())) {
        bodyTexts.push(dt);
        existingSet.add(dt.trim().toLowerCase());
      }
    }

    // ── Pass 1e: charts linked to this slide ───────────────────────────────
    const chartTexts = await extractChartTexts(zip, slideName);
    if (chartTexts.length > 0) bodyTexts.push(...chartTexts);

    // ── Pass 2: full-XML scan (catches anything missed above) ──────────────
    if (!title && bodyTexts.length === 0) {
      const allFromXml = extractAllText(xml);
      if (allFromXml.length > 0) {
        title = allFromXml[0];
        bodyTexts.push(...allFromXml.slice(1));
      }
    }

    // ── Pass 3: slide notes ─────────────────────────────────────────────────
    if (!title && bodyTexts.length === 0) {
      const noteName = `ppt/notesSlides/notesSlide${slideNumber}.xml`;
      const noteFile = zip.files[noteName];
      if (noteFile) {
        try {
          const noteXml = await noteFile.async('string');
          const noteTexts = extractAllText(noteXml);
          if (noteTexts.length > 0) {
            title = `Diapositiva ${slideNumber}`;
            bodyTexts.push(...noteTexts.slice(0, 10));
          }
        } catch { /* ignore */ }
      }
    }

    // ── Pass 4: orphan diagram texts (if slide is still empty) ─────────────
    if (!title && bodyTexts.length === 0 && orphanDiagramTexts.length > 0) {
      title = `Diapositiva ${slideNumber}`;
      bodyTexts.push(...orphanDiagramTexts.splice(0, 10));
    }

    // ── Build final slide ──────────────────────────────────────────────────
    const effectiveTitle = title || `Diapositiva ${slideNumber}`;
    const effectiveBullets = bodyTexts.filter(Boolean);
    const rawText =
      effectiveBullets.length > 0
        ? [effectiveTitle, ...effectiveBullets].join('\n')
        : `[${effectiveTitle} — contenido visual]`;

    const images = await extractSlideImages(zip, slideName);

    slides.push({
      slideNumber,
      title: effectiveTitle,
      bullets: effectiveBullets,
      rawText,
      images,
    });
  }

  if (slides.length === 0) {
    throw new Error(
      'No se encontraron diapositivas válidas en el archivo.'
    );
  }

  return slides.sort((a, b) => a.slideNumber - b.slideNumber);
}
