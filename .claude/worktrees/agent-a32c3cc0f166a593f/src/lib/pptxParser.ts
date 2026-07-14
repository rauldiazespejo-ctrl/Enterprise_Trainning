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

function extractTextsFromXml(xml: string): string[] {
  const matches = [...xml.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)];
  return matches.map(m => m[1].trim()).filter(Boolean);
}

function extractSpBlocks(xml: string): string[] {
  const blocks: string[] = [];
  let start = 0;
  while (true) {
    const open = xml.indexOf('<p:sp>', start);
    if (open === -1) break;
    const close = xml.indexOf('</p:sp>', open);
    if (close === -1) break;
    blocks.push(xml.slice(open, close + 7));
    start = close + 7;
  }
  return blocks;
}

function isTitleShape(block: string): boolean {
  return (
    block.includes('type="title"') ||
    block.includes('type="ctrTitle"') ||
    block.includes("type='title'") ||
    block.includes("type='ctrTitle'")
  );
}

export async function parsePptx(file: File): Promise<PptxSlide[]> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const slideFiles = Object.keys(zip.files).filter(name =>
    /^ppt\/slides\/slide\d+\.xml$/.test(name)
  );

  slideFiles.sort((a, b) => extractSlideNumber(a) - extractSlideNumber(b));

  const slides: PptxSlide[] = [];

  for (const slideName of slideFiles) {
    const slideNumber = extractSlideNumber(slideName);
    const xml = await zip.files[slideName].async('string');

    const spBlocks = extractSpBlocks(xml);

    let title = '';
    const bodyTexts: string[] = [];

    for (const block of spBlocks) {
      const texts = extractTextsFromXml(block);
      if (texts.length === 0) continue;

      if (isTitleShape(block)) {
        title = texts.join(' ');
      } else {
        bodyTexts.push(...texts);
      }
    }

    const allTexts = [title, ...bodyTexts].filter(Boolean);
    if (allTexts.length === 0) continue;

    const bullets = bodyTexts.filter(Boolean);
    const rawText = allTexts.join('\n');

    slides.push({ slideNumber, title, bullets, rawText });
  }

  return slides.sort((a, b) => a.slideNumber - b.slideNumber);
}
