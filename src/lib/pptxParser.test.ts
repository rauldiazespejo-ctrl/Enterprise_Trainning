import { describe, it, expect, vi, beforeAll } from 'vitest';
import JSZip from 'jszip';

beforeAll(() => {
  vi.stubGlobal('Image', class {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_: string) { Promise.resolve().then(() => this.onload?.()); }
    width = 100;
    height = 100;
  });

  vi.stubGlobal('document', {
    createElement: () => ({
      width: 0, height: 0,
      getContext: () => ({ drawImage: () => {} }),
      toDataURL: () => 'data:image/jpeg;base64,mock',
    }),
  });
});

function fakeImageData(size = 400): Uint8Array {
  return new Uint8Array(size).fill(0xFF);
}

async function buildZipFile(relsXml: string): Promise<File> {
  const zip = new JSZip();
  zip.file('ppt/slides/slide1.xml', '<p:sld><p:cSld><p:spTree></p:spTree></p:cSld></p:sld>');
  zip.file('ppt/slides/_rels/slide1.xml.rels', relsXml);
  zip.file('ppt/media/image1.png', fakeImageData());
  zip.file('ppt/media/image2.jpeg', fakeImageData());
  zip.file('[Content_Types].xml', `<?xml version="1.0"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>`);
  zip.file('ppt/presentation.xml', `<?xml version="1.0"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst><p:sldId id="256" r:id="rId2"/></p:sldIdLst>
</p:presentation>`);
  zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
</Relationships>`);
  const blob = await zip.generateAsync({ type: 'blob' });
  return new File([blob], 'test.pptx', { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
}

describe('pptxParser – extractSlideImages regression', () => {
  it('extracts images when Type comes before Target', async () => {
    const rels = `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image2.jpeg"/>
</Relationships>`;
    const file = await buildZipFile(rels);
    const { parsePptx } = await import('./pptxParser');
    const slides = await parsePptx(file);
    expect(slides).toHaveLength(1);
    expect(slides[0].images.length).toBe(2);
  });

  it('extracts images when Target comes before Type (regression)', async () => {
    const rels = `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Target="../media/image1.png" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"/>
  <Relationship Id="rId2" Target="../media/image2.jpeg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"/>
</Relationships>`;
    const file = await buildZipFile(rels);
    const { parsePptx } = await import('./pptxParser');
    const slides = await parsePptx(file);
    expect(slides).toHaveLength(1);
    expect(slides[0].images.length).toBe(2);
  });

  it('ignores non-image relationships', async () => {
    const rels = `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Target="../media/image1.png" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"/>
</Relationships>`;
    const file = await buildZipFile(rels);
    const { parsePptx } = await import('./pptxParser');
    const slides = await parsePptx(file);
    expect(slides).toHaveLength(1);
    expect(slides[0].images.length).toBe(1);
  });
});
