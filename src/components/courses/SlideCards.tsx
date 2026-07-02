// Slide Components para CourseViewer — extraídos para reducir el tamaño del archivo principal.
// Todos los componentes de slides individuales + el dispatcher SlideCard + la utilidad seededShuffle.
import React, { useState } from 'react';
import { Slide } from '@/types';
import {
  Lightbulb,
  ClipboardList,
  CheckCircle,
  ShieldCheck,
  BookOpen,
  AlertTriangle,
  ListChecks,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

// Deterministic shuffle using a seed string (Mulberry32 PRNG)
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  const rand = () => {
    h |= 0; h = h + 0x6D2B79F5 | 0;
    let t = Math.imul(h ^ h >>> 15, 1 | h);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ─── Slide Components por tipo ────────────────────────────────────────────────

const ConceptSlide: React.FC<{ slide: Slide }> = ({ slide }) => (
  <div className="h-full flex flex-col bg-gradient-to-br from-[#0F1E3C] via-[#0D1B35] to-[#111827] rounded-2xl border border-blue-500/20 p-8 overflow-y-auto">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl">
        <Lightbulb className="w-5 h-5 text-blue-400" />
      </div>
      <span className="text-xs text-blue-400 font-bold uppercase tracking-widest">Concepto Teórico</span>
    </div>

    <h2 className="text-2xl md:text-3xl font-bold text-white mb-5 leading-tight">{slide.title}</h2>
    <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8">{slide.content}</p>

    {slide.keyPoints && slide.keyPoints.length > 0 && (
      <div>
        <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Puntos Clave</p>
        <div className="space-y-2.5">
          {slide.keyPoints.map((point, i) => (
            <div key={i} className="flex items-start gap-3 p-3.5 bg-blue-500/10 rounded-xl border border-blue-500/20 hover:border-blue-400/40 transition-colors">
              <div className="w-6 h-6 rounded-full bg-blue-500/30 border border-blue-400/40 text-blue-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <span className="text-gray-200 text-sm md:text-base">{point}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const ExampleSlide: React.FC<{ slide: Slide }> = ({ slide }) => (
  <div className="h-full flex flex-col bg-gradient-to-br from-[#2D1500] via-[#1E1000] to-[#111827] rounded-2xl border border-orange-500/20 p-8 overflow-y-auto">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-orange-500/20 border border-orange-500/30 rounded-xl">
        <ClipboardList className="w-5 h-5 text-orange-400" />
      </div>
      <span className="text-xs text-orange-400 font-bold uppercase tracking-widest">Caso Real</span>
    </div>

    <h2 className="text-2xl md:text-3xl font-bold text-white mb-5 leading-tight">{slide.title}</h2>
    {slide.content && (
      <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6">{slide.content}</p>
    )}

    <div className="flex flex-col gap-4 mt-auto">
      {slide.scenario && (
        <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/25">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-4 bg-orange-400 rounded-full" />
            <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">Escenario</p>
          </div>
          <p className="text-gray-200 text-sm md:text-base leading-relaxed">{slide.scenario}</p>
        </div>
      )}
      {slide.outcome && (
        <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/25">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Resultado y Lección</p>
          </div>
          <p className="text-gray-200 text-sm md:text-base leading-relaxed">{slide.outcome}</p>
        </div>
      )}
    </div>
  </div>
);

const TipSlide: React.FC<{ slide: Slide }> = ({ slide }) => (
  <div className="h-full flex flex-col bg-gradient-to-br from-[#002B1A] via-[#001F12] to-[#111827] rounded-2xl border border-emerald-500/20 p-8 overflow-y-auto">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
      </div>
      <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Consejo Práctico</span>
    </div>

    <h2 className="text-2xl md:text-3xl font-bold text-white mb-5 leading-tight">{slide.title}</h2>
    <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8">{slide.content}</p>

    {slide.highlight && (
      <div className="mt-auto p-5 bg-gradient-to-r from-emerald-500/15 to-teal-500/10 rounded-2xl border border-emerald-500/30">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1.5">Recuerda siempre</p>
            <p className="text-emerald-200 font-semibold text-base md:text-lg leading-relaxed">{slide.highlight}</p>
          </div>
        </div>
      </div>
    )}
  </div>
);

const SummarySlide: React.FC<{ slide: Slide }> = ({ slide }) => (
  <div className="h-full flex flex-col bg-gradient-to-br from-[#1a1200] via-[#141000] to-[#111827] rounded-2xl border border-amber-500/20 p-8 overflow-y-auto">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl">
        <ListChecks className="w-5 h-5 text-amber-400" />
      </div>
      <span className="text-xs text-amber-400 font-bold uppercase tracking-widest">Resumen del Módulo</span>
    </div>

    <h2 className="text-2xl md:text-3xl font-bold text-white mb-5 leading-tight">{slide.title}</h2>
    <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8">{slide.content}</p>

    {slide.keyPoints && slide.keyPoints.length > 0 && (
      <div>
        <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Lo que aprendiste en este módulo</p>
        <div className="space-y-2.5">
          {slide.keyPoints.map((point, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="text-gray-200 text-sm md:text-base">{point}</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const ContentSlide: React.FC<{ slide: Slide }> = ({ slide }) => (
  <div className="h-full flex flex-col bg-gradient-to-br from-[#0D1B2A] via-[#0A1520] to-[#111827] rounded-2xl border border-white/10 p-8 overflow-y-auto">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-hsl(var(--brand))/15 border border-hsl(var(--brand))/30 rounded-xl">
        <BookOpen className="w-5 h-5 text-hsl(var(--brand))" />
      </div>
      <span className="text-xs text-hsl(var(--brand)) font-bold uppercase tracking-widest">Contenido</span>
    </div>

    <h2 className="text-2xl md:text-3xl font-bold text-white mb-5 leading-tight">{slide.title}</h2>
    <div className="text-gray-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap mb-6">{slide.content}</div>

    {slide.keyPoints && slide.keyPoints.length > 0 && (
      <div className="mt-auto space-y-2.5">
        {slide.keyPoints.map((point, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-hsl(var(--brand)) mt-2 shrink-0" />
            <span className="text-gray-300 text-sm md:text-base">{point}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const VisualSlide: React.FC<{ slide: Slide }> = ({ slide }) => {
  const [activeImg, setActiveImg] = useState(0);
  const images = slide.imageData || [];
  const hasText = slide.keyPoints && slide.keyPoints.length > 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0D1321] via-[#080E18] to-[#050A0F] rounded-2xl border border-hsl(var(--brand))/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-3 shrink-0">
        <div className="p-2 bg-hsl(var(--brand))/20 border border-hsl(var(--brand))/30 rounded-lg">
          <FileText className="w-4 h-4 text-hsl(var(--brand))" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg md:text-xl font-bold text-white leading-tight truncate">{slide.title}</h2>
        </div>
        {images.length > 1 && (
          <span className="text-xs text-slate-500 shrink-0">{activeImg + 1}/{images.length}</span>
        )}
      </div>

      {/* Main image — fills available space */}
      {images.length > 0 && (
        <div className="flex-1 mx-4 mb-3 bg-black/50 rounded-xl border border-white/8 overflow-hidden flex items-center justify-center min-h-0">
          <img
            key={activeImg}
            src={images[activeImg]}
            alt={`${slide.title} — imagen ${activeImg + 1}`}
            className="max-w-full max-h-full object-contain select-none"
            draggable={false}
          />
        </div>
      )}

      {/* Thumbnails row — only when multiple images */}
      {images.length > 1 && (
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto shrink-0">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImg(idx)}
              className={`shrink-0 w-16 h-11 rounded-lg border-2 overflow-hidden transition-all ${
                idx === activeImg
                  ? 'border-hsl(var(--brand)) opacity-100'
                  : 'border-white/15 opacity-50 hover:opacity-80 hover:border-white/40'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Key points below if present */}
      {hasText && (
        <div className="px-4 pb-4 space-y-1.5 shrink-0 max-h-28 overflow-y-auto">
          {slide.keyPoints!.map((point, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
              <span className="w-1 h-1 rounded-full bg-hsl(var(--brand)) mt-1.5 shrink-0" />
              {point}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const ImageSlide: React.FC<{ slide: Slide }> = ({ slide }) => (
  <div className="h-full flex flex-col bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] rounded-2xl border border-sky-500/20 p-8 overflow-y-auto">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2.5 bg-sky-500/20 border border-sky-500/30 rounded-xl">
        <ImageIcon className="w-5 h-5 text-sky-400" />
      </div>
      <span className="text-xs text-sky-400 font-bold uppercase tracking-widest">Ilustración Visual</span>
    </div>

    <h2 className="text-2xl md:text-3xl font-bold text-white mb-5 leading-tight">{slide.title}</h2>
    
    {slide.imageUrl && (
      <div className="flex-1 min-h-[200px] flex items-center justify-center mb-6 bg-black/30 rounded-xl border border-sky-500/10 overflow-hidden">
        <img 
          src={slide.imageUrl} 
          alt={slide.title} 
          className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
          loading="lazy"
        />
      </div>
    )}

    {slide.content && (
      <p className="text-gray-300 text-base md:text-lg leading-relaxed mt-auto">{slide.content}</p>
    )}
  </div>
);

// Dispatcher por tipo
const SlideCard: React.FC<{ slide: Slide; animKey: string }> = ({ slide, animKey }) => {
  const inner = (() => {
    // Slides with embedded PPTX images take priority regardless of type
    if (slide.imageData && slide.imageData.length > 0) return <VisualSlide slide={slide} />;
    switch (slide.type) {
      case 'concept': return <ConceptSlide slide={slide} />;
      case 'example': return <ExampleSlide slide={slide} />;
      case 'tip':     return <TipSlide slide={slide} />;
      case 'summary': return <SummarySlide slide={slide} />;
      case 'image':   return <ImageSlide slide={slide} />;
      default:        return <ContentSlide slide={slide} />;
    }
  })();

  return (
    <div
      key={animKey}
      className="w-full h-full min-h-[480px]"
      style={{ animation: 'slideEnter 0.25s ease-out' }}
    >
      {inner}
    </div>
  );
};

export default SlideCard;
