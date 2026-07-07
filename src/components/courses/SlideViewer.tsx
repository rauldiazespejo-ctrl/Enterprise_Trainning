import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PptxSlide } from '@/lib/pptxParser';

interface SlideViewerProps {
  slides: PptxSlide[];
  onComplete: () => void;
  courseName: string;
}

const SlideViewer: React.FC<SlideViewerProps> = ({ slides, onComplete, courseName }) => {
  const [current, setCurrent] = useState(0);

  if (slides.length === 0) {
    return (
      <div className="w-full min-h-[500px] bg-[#0D1321] rounded-xl flex items-center justify-center">
        <p className="text-slate-400 text-lg">No se pudieron extraer diapositivas</p>
      </div>
    );
  }

  const slide = slides[current];
  const isFirst = current === 0;
  const isLast = current === slides.length - 1;
  const progress = ((current + 1) / slides.length) * 100;

  return (
    <div className="w-full min-h-[500px] bg-[#0D1321] rounded-xl flex flex-col">
      {/* Top bar */}
      <div className="px-8 pt-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-sm">{courseName}</span>
          <span className="text-slate-400 text-sm">
            Diapositiva {current + 1} de {slides.length}
          </span>
        </div>
        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Slide content */}
      <div className="flex-1 px-8 py-6 flex flex-col">
        <h2 className="text-3xl font-bold text-white mb-6 leading-tight">
          {slide.title || `Diapositiva ${slide.slideNumber}`}
        </h2>

        {slide.bullets.length > 0 && (
          <ul className="space-y-3">
            {slide.bullets.map((bullet, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="mt-2 shrink-0 w-2 h-2 rounded-full bg-brand" />
                <span className="text-gray-300 text-base leading-relaxed">{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="px-8 pb-6 pt-4 border-t border-slate-700/50 flex items-center justify-between">
        <button
          onClick={() => setCurrent(c => c - 1)}
          disabled={isFirst}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              aria-label={`Diapositiva ${idx + 1}`}
              aria-current={idx === current ? 'step' : undefined}
              className={`rounded-full transition-all ${
                idx === current
                  ? 'w-6 h-2 bg-brand'
                  : 'w-2 h-2 bg-slate-600 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        {isLast ? (
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-brand text-white font-medium hover:bg-[brand] transition-colors"
          >
            Ir a la Evaluación
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setCurrent(c => c + 1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SlideViewer;
