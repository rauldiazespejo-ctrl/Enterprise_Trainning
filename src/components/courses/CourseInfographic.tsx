import React from 'react';
import { BookOpen, CheckCircle, Lightbulb, PenTool, Image as ImageIcon, AlertTriangle, FileText, ChevronDown } from 'lucide-react';

interface Slide {
  title: string;
  type: 'concept' | 'example' | 'tip' | 'content' | 'summary' | 'image' | 'video';
  content?: string;
  imageUrl?: string;
  keyPoints?: string[];
  scenario?: string;
  outcome?: string;
  highlight?: string;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  slides: Slide[];
}

interface CourseInfographicProps {
  course: {
    title: string;
    description: string;
    modules: Module[];
    studyGuide?: {
      glossary: { term: string; definition: string }[];
      faq: { question: string; answer: string }[];
    };
  };
}

const CourseInfographic: React.FC<CourseInfographicProps> = ({ course }) => {
  const getSlideIcon = (type: string) => {
    switch (type) {
      case 'concept': return <BookOpen className="w-5 h-5 text-blue-400" />;
      case 'example': return <PenTool className="w-5 h-5 text-orange-400" />;
      case 'tip': return <AlertTriangle className="w-5 h-5 text-emerald-400" />;
      case 'summary': return <CheckCircle className="w-5 h-5 text-purple-400" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-sky-400" />;
      default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSlideColor = (type: string) => {
    switch (type) {
      case 'concept': return 'border-blue-500/30 bg-blue-500/5';
      case 'example': return 'border-orange-500/30 bg-orange-500/5';
      case 'tip': return 'border-emerald-500/30 bg-emerald-500/5';
      case 'summary': return 'border-purple-500/30 bg-purple-500/5';
      case 'image': return 'border-sky-500/30 bg-sky-500/5';
      default: return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  return (
    <div className="bg-[#0A0E1A] min-h-screen p-6 md:p-12 font-sans text-gray-200">
      <div className="max-w-4xl mx-auto">
        {/* Infographic Header */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-brand/20 to-transparent blur-3xl -z-10 rounded-full opacity-50" />
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            {course.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto border-l-4 border-brand pl-4 text-left italic">
            "{course.description}"
          </p>
        </div>

        {/* Timeline */}
        <div className="relative border-l-2 border-white/10 ml-4 md:ml-8 space-y-16">
          {course.modules.map((module, mIdx) => (
            <div key={module.id || mIdx} className="relative pl-8 md:pl-12">
              {/* Module Node */}
              <div className="absolute -left-[17px] top-0 w-8 h-8 bg-[#0D1321] border-4 border-brand rounded-full flex items-center justify-center shadow-[0_0_15px_hsl(var(--brand) / )]">
                <span className="text-xs font-bold text-white">{mIdx + 1}</span>
              </div>

              {/* Module Header */}
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{module.title}</h2>
                {module.description && <p className="text-gray-400">{module.description}</p>}
              </div>

              {/* Slides as Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {module.slides.map((slide, sIdx) => (
                  <div 
                    key={sIdx} 
                    className={`rounded-2xl p-5 border backdrop-blur-sm ${getSlideColor(slide.type)} transition-transform hover:-translate-y-1 hover:shadow-lg`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-[#0D1321] border border-white/5">
                        {getSlideIcon(slide.type)}
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight">{slide.title}</h3>
                    </div>

                    {slide.content && (
                      <p className="text-sm text-gray-300 mb-4 leading-relaxed">{slide.content}</p>
                    )}

                    {slide.highlight && (
                      <div className="bg-[#0D1321] border-l-2 border-emerald-500 p-3 rounded text-sm text-emerald-400 font-medium mb-4">
                        {slide.highlight}
                      </div>
                    )}

                    {slide.scenario && (
                      <div className="text-sm bg-white/5 p-3 rounded mb-2 border border-white/5">
                        <strong className="text-orange-300 block mb-1">Caso:</strong>
                        <span className="text-gray-300">{slide.scenario}</span>
                      </div>
                    )}
                    {slide.outcome && (
                      <div className="text-sm bg-[#0D1321] p-3 rounded border border-white/5">
                        <strong className="text-emerald-400 block mb-1">Resultado:</strong>
                        <span className="text-gray-300">{slide.outcome}</span>
                      </div>
                    )}

                    {slide.keyPoints && slide.keyPoints.length > 0 && (
                      <ul className="space-y-2 mt-4">
                        {slide.keyPoints.map((kp, kIdx) => (
                          <li key={kIdx} className="flex gap-2 text-sm text-gray-300 items-start">
                            <CheckCircle className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                            <span>{kp}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Study Guide Section (NotebookLM Style) */}
        {course.studyGuide && (
          <div className="mt-24 border-t border-white/10 pt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Guía de Estudio</h2>
              <p className="text-gray-400">Conceptos clave y preguntas frecuentes para repasar</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Glossary */}
              <div>
                <h3 className="text-xl font-bold text-brand mb-6 flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  Glosario
                </h3>
                <div className="space-y-4">
                  {course.studyGuide.glossary.map((item, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4">
                      <h4 className="text-white font-bold mb-1">{item.term}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{item.definition}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div>
                <h3 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6" />
                  Preguntas Frecuentes
                </h3>
                <div className="space-y-4">
                  {course.studyGuide.faq.map((item, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-4">
                      <h4 className="text-white font-bold mb-2 flex items-start gap-2">
                        <span className="text-blue-400">Q.</span>
                        {item.question}
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed flex items-start gap-2">
                        <span className="text-brand font-bold">A.</span>
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 text-center text-gray-500 flex flex-col items-center">
          <CheckCircle className="w-8 h-8 text-emerald-500 mb-3 opacity-50" />
          <p>Fin de la Infografía</p>
        </div>
      </div>
    </div>
  );
};

export default CourseInfographic;
