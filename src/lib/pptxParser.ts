import JSZip from 'jszip';

export interface PptxSlide {
  slideNumber: number;
  title: string;
  bullets: string[];
  rawText: string;
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

// Extract all text runs from any XML — handles <a:t>, <t>, and fld elements
function extractAllText(xml: string): string[] {
  const results: string[] = [];

  // Primary: <a:t ...>text</a:t>
  const re1 = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  let m = re1.exec(xml);
  while (m) {
    const t = decodeEntities(m[1]).trim();
    if (t) results.push(t);
    m = re1.exec(xml);
  }

  if (results.length > 0) return results;

  // Fallback A: bare <t>text</t> (some non-standard generators)
  const re2 = /<t[^>]*>([\s\S]*?)<\/t>/g;
  let m2 = re2.exec(xml);
  while (m2) {
    const t = decodeEntities(m2[1]).trim();
    if (t && t.length < 500) results.push(t);
    m2 = re2.exec(xml);
  }

  if (results.length > 0) return results;

  // Fallback B: strip all tags and collect remaining words (last resort)
  const stripped = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (stripped.length > 2 && stripped.length < 10000) results.push(stripped);

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
      block.includes("type='ctrTitle'");
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

  // Locate slide XML files
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

  // Pre-load SmartArt diagram data files (text stored outside slide XML)
  const diagramTexts: string[] = [];
  const diagramFiles = Object.keys(zip.files).filter(
    name => name.includes('diagrams/data') && name.endsWith('.xml')
  );
  for (const df of diagramFiles) {
    try {
      const xml = await zip.files[df].async('string');
      diagramTexts.push(...extractAllText(xml));
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

    // ── Pass 2: full-XML scan (catches tables, grpSp, graphicFrame, etc.) ──
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

    // ── Placeholder for image-only slides (never skip) ──────────────────────
    const effectiveTitle = title || `Diapositiva ${slideNumber}`;
    const effectiveBullets = bodyTexts.filter(Boolean);
    const rawText =
      effectiveBullets.length > 0
        ? [effectiveTitle, ...effectiveBullets].join('\n')
        : `[${effectiveTitle} — contenido visual]`;

    slides.push({
      slideNumber,
      title: effectiveTitle,
      bullets: effectiveBullets,
      rawText,
    });
  }

  if (slides.length === 0) {
    throw new Error(
      'No se encontraron diapositivas válidas en el archivo.'
    );
  }

  return slides.sort((a, b) => a.slideNumber - b.slideNumber);
}
