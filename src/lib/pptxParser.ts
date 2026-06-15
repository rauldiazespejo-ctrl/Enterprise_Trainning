import JSZip from 'jszip';

export interface PptxSlide {
  slideNumber: number;
  title: string;
  bullets: string[];
  rawText: string;
}

function extractSlideNumber(filename: string): number {
  const match = filename.match(/slide(\d+)\.xml$/);
  return match ? parseInt(match[1], 10) : 0;
}

function extractAllText(xml: string): string[] {
  // Handle both <a:t>text</a:t> and <a:t xml:space="preserve">text</a:t>
  const results: string[] = [];
  // Primary: namespace-prefixed tags
  const re1 = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
  let m = re1.exec(xml);
  while (m) {
    const t = m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
    if (t) results.push(t);
    m = re1.exec(xml);
  }
  // Fallback: no-prefix <t> tags if nothing found
  if (results.length === 0) {
    const re2 = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let m2 = re2.exec(xml);
    while (m2) {
      const t = m2[1].trim();
      if (t && t.length < 500) results.push(t);
      m2 = re2.exec(xml);
    }
  }
  return results;
}

function extractSpBlocks(xml: string): Array<{ block: string; isTitle: boolean }> {
  const results: Array<{ block: string; isTitle: boolean }> = [];
  let start = 0;
  // Try <p:sp> first, fall back to <sp>
  const openTag = xml.includes('<p:sp') ? '<p:sp' : '<sp';
  const closeTag = xml.includes('</p:sp>') ? '</p:sp>' : '</sp>';

  while (true) {
    const open = xml.indexOf(openTag, start);
    if (open === -1) break;
    // Find the matching close tag
    const close = xml.indexOf(closeTag, open);
    if (close === -1) break;
    const block = xml.slice(open, close + closeTag.length);
    const isTitle =
      block.includes('type="title"') ||
      block.includes('type="ctrTitle"') ||
      block.includes("type='title'") ||
      block.includes("type='ctrTitle'") ||
      block.includes('idx="0"') && (block.indexOf('idx="0"') < block.indexOf('<a:t'));
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
    throw new Error('No se pudo abrir el archivo PPTX. Verifica que no esté dañado o protegido con contraseña.');
  }

  const slideFiles = Object.keys(zip.files).filter(name =>
    /^ppt\/slides\/slide\d+\.xml$/.test(name)
  );

  if (slideFiles.length === 0) {
    // Try alternative PPTX structures
    const altFiles = Object.keys(zip.files).filter(name =>
      name.includes('slides/slide') && name.endsWith('.xml') && !name.includes('_rels')
    );
    if (altFiles.length === 0) {
      throw new Error('No se encontraron diapositivas en el archivo. Asegúrate de que sea un archivo .pptx válido.');
    }
    slideFiles.push(...altFiles);
  }

  slideFiles.sort((a, b) => extractSlideNumber(a) - extractSlideNumber(b));

  const slides: PptxSlide[] = [];

  for (const slideName of slideFiles) {
    const slideNumber = extractSlideNumber(slideName);
    const xml = await zip.files[slideName].async('string');

    const spBlocks = extractSpBlocks(xml);

    let title = '';
    const bodyTexts: string[] = [];

    if (spBlocks.length > 0) {
      for (const { block, isTitle } of spBlocks) {
        const texts = extractAllText(block);
        if (texts.length === 0) continue;
        if (isTitle && !title) {
          title = texts.join(' ');
        } else {
          bodyTexts.push(...texts);
        }
      }
    } else {
      // Fallback: extract ALL text from slide without shape distinction
      const allTexts = extractAllText(xml);
      if (allTexts.length > 0) {
        title = allTexts[0];
        bodyTexts.push(...allTexts.slice(1));
      }
    }

    const allTexts = [title, ...bodyTexts].filter(Boolean);
    if (allTexts.length === 0) continue;

    slides.push({
      slideNumber,
      title: title || `Diapositiva ${slideNumber}`,
      bullets: bodyTexts.filter(Boolean),
      rawText: allTexts.join('\n'),
    });
  }

  if (slides.length === 0) {
    throw new Error(
      'No se pudo extraer texto de las diapositivas. El archivo puede tener solo imágenes o estar en un formato incompatible.'
    );
  }

  return slides.sort((a, b) => a.slideNumber - b.slideNumber);
}
