import { describe, it, expect, vi, beforeAll } from 'vitest';
import JSZip from 'jszip';
import { parsePptx } from './pptxParser';

// Minimal 1x1 red PNG in base64
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

// Mock browser APIs used by compressImage (Image, canvas)
beforeAll(() => {
  // Mock Image constructor so compressImage resolves immediately
  class MockImage {
    width = 100;
    height = 100;
    src = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;

    constructor() {
      // Trigger onload asynchronously after src is set
      const self = this;
      const originalSrcDescriptor = {
        set(value: string) {
          self._src = value;
          if (self.onload) setTimeout(() => self.onload!(), 0);
        },
        get() {
          return self._src || '';
        },
      };
      Object.defineProperty(this, 'src', originalSrcDescriptor);
    }
    private _src = '';
  }
  vi.stubGlobal('Image', MockImage);

  // Mock document.createElement for canvas
  const mockCtx = {
    drawImage: vi.fn(),
  };
  const mockCanvas = {
    width: 0,
    height: 0,
    getContext: () => mockCtx,
    toDataURL: (mime: string, _q: number) => `data:${mime};base64,mock`,
  };
  const origCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string, options?: any) => {
    if (tag === 'canvas') return mockCanvas as any;
    return origCreateElement(tag, options);
  });
});

// --- Helpers to build minimal PPTX zips ---

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`;

const PRESENTATION_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst>
</p:presentation>`;

const PRESENTATION_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
</Relationships>`;

function makeSlideXml(textContent?: string): string {
  if (!textContent) {
    // Slide with no text shapes at all
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:spTree><p:nvGrpSpPr/><p:grpSpPr/></p:spTree></p:cSld>
</p:sld>`;
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:spTree><p:nvGrpSpPr/><p:grpSpPr/>
    <p:sp>
      <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
      <p:spPr/>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>${textContent}</a:t></a:r></a:p></p:txBody>
    </p:sp>
  </p:spTree></p:cSld>
</p:sld>`;
}

function makeSlideRels(relationships: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${relationships}
</Relationships>`;
}

async function buildPptxFile(zip: JSZip): Promise<File> {
  const buf = await zip.generateAsync({ type: 'arraybuffer' });
  return new File([buf], 'test.pptx', {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
}

function addBaseFiles(zip: JSZip): void {
  zip.file('[Content_Types].xml', CONTENT_TYPES_XML);
  zip.file('ppt/presentation.xml', PRESENTATION_XML);
  zip.file('ppt/_rels/presentation.xml.rels', PRESENTATION_RELS);
}

// --- Tests ---

describe('pptxParser — extractSlideImages regression', () => {
  it('extracts images when Target comes before Type (bug case)', async () => {
    const zip = new JSZip();
    addBaseFiles(zip);
    zip.file('ppt/slides/slide1.xml', makeSlideXml());
    zip.file(
      'ppt/slides/_rels/slide1.xml.rels',
      makeSlideRels(
        `<Relationship Id="rId1" Target="../media/image1.png" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"/>`
      )
    );
    zip.file('ppt/media/image1.png', TINY_PNG_B64, { base64: true });

    const file = await buildPptxFile(zip);
    const slides = await parsePptx(file);

    expect(slides).toHaveLength(1);
    expect(slides[0].images.length).toBeGreaterThan(0);
  });

  it('extracts images when Type comes before Target (normal case)', async () => {
    const zip = new JSZip();
    addBaseFiles(zip);
    zip.file('ppt/slides/slide1.xml', makeSlideXml());
    zip.file(
      'ppt/slides/_rels/slide1.xml.rels',
      makeSlideRels(
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>`
      )
    );
    zip.file('ppt/media/image1.png', TINY_PNG_B64, { base64: true });

    const file = await buildPptxFile(zip);
    const slides = await parsePptx(file);

    expect(slides).toHaveLength(1);
    expect(slides[0].images.length).toBeGreaterThan(0);
  });

  it('returns empty images array for slide with no images', async () => {
    const zip = new JSZip();
    addBaseFiles(zip);
    zip.file('ppt/slides/slide1.xml', makeSlideXml('Slide without images'));
    zip.file('ppt/slides/_rels/slide1.xml.rels', makeSlideRels(''));

    const file = await buildPptxFile(zip);
    const slides = await parsePptx(file);

    expect(slides).toHaveLength(1);
    expect(slides[0].images).toEqual([]);
  });
});

describe('pptxParser — text extraction', () => {
  it('extracts bullets and rawText from slide with text content', async () => {
    const zip = new JSZip();
    addBaseFiles(zip);

    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld><p:spTree><p:nvGrpSpPr/><p:grpSpPr/>
    <p:sp>
      <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
      <p:spPr/>
      <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Safety Training</a:t></a:r></a:p></p:txBody>
    </p:sp>
    <p:sp>
      <p:nvSpPr><p:cNvPr id="3" name="Content"/><p:cNvSpPr/><p:nvPr><p:ph type="body"/></p:nvPr></p:nvSpPr>
      <p:spPr/>
      <p:txBody><a:bodyPr/><a:lstStyle/>
        <a:p><a:r><a:t>Always wear PPE</a:t></a:r></a:p>
        <a:p><a:r><a:t>Follow procedures</a:t></a:r></a:p>
      </p:txBody>
    </p:sp>
  </p:spTree></p:cSld>
</p:sld>`;

    zip.file('ppt/slides/slide1.xml', slideXml);
    zip.file('ppt/slides/_rels/slide1.xml.rels', makeSlideRels(''));

    const file = await buildPptxFile(zip);
    const slides = await parsePptx(file);

    expect(slides).toHaveLength(1);
    expect(slides[0].title).toBe('Safety Training');
    expect(slides[0].bullets).toContain('Always wear PPE');
    expect(slides[0].bullets).toContain('Follow procedures');
    expect(slides[0].rawText).not.toMatch(/^\[Diapositiva/);
  });

  it('uses visual placeholder rawText for slide with only images, no text', async () => {
    const zip = new JSZip();
    addBaseFiles(zip);
    // Slide with no text shapes at all
    zip.file('ppt/slides/slide1.xml', makeSlideXml());
    zip.file(
      'ppt/slides/_rels/slide1.xml.rels',
      makeSlideRels(
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>`
      )
    );
    zip.file('ppt/media/image1.png', TINY_PNG_B64, { base64: true });

    const file = await buildPptxFile(zip);
    const slides = await parsePptx(file);

    expect(slides).toHaveLength(1);
    expect(slides[0].rawText).toContain('contenido visual');
    expect(slides[0].bullets).toHaveLength(0);
    expect(slides[0].images.length).toBeGreaterThan(0);
  });
});
