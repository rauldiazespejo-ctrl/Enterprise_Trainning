// Visor de Cursos — Dark Immersive Theme con slides visuales por tipo
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourses } from '@/contexts/CourseContext';
import { useAuth } from '@/contexts/AuthContext';
import CertificateView from '@/pages/employee/CertificateView';
import CourseInfographic from '@/components/courses/CourseInfographic';
import { Slide, Quiz, Question, Certificate } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ArrowLeft,
  Award,
  Lightbulb,
  ClipboardList,
  ShieldCheck,
  FileText,
  BookOpen,
  AlertTriangle,
  ListChecks,
  Menu,
  X,
  Image as ImageIcon,
  Lock,
  Download,
} from 'lucide-react';

// Deterministic shuffle using a seed string (Mulberry32 PRNG)
function seededShuffle<T>(arr: T[], seed: string): T[] {
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
      <div className="p-2.5 bg-[#D15F3D]/15 border border-[#D15F3D]/30 rounded-xl">
        <BookOpen className="w-5 h-5 text-[#D15F3D]" />
      </div>
      <span className="text-xs text-[#D15F3D] font-bold uppercase tracking-widest">Contenido</span>
    </div>

    <h2 className="text-2xl md:text-3xl font-bold text-white mb-5 leading-tight">{slide.title}</h2>
    <div className="text-gray-300 text-base md:text-lg leading-relaxed whitespace-pre-wrap mb-6">{slide.content}</div>

    {slide.keyPoints && slide.keyPoints.length > 0 && (
      <div className="mt-auto space-y-2.5">
        {slide.keyPoints.map((point, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D15F3D] mt-2 shrink-0" />
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
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0D1321] via-[#080E18] to-[#050A0F] rounded-2xl border border-[#D15F3D]/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-5 pb-3 shrink-0">
        <div className="p-2 bg-[#D15F3D]/20 border border-[#D15F3D]/30 rounded-lg">
          <FileText className="w-4 h-4 text-[#D15F3D]" />
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
                  ? 'border-[#D15F3D] opacity-100'
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
              <span className="w-1 h-1 rounded-full bg-[#D15F3D] mt-1.5 shrink-0" />
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

// ─── Main CourseViewer ────────────────────────────────────────────────────────

const CourseViewer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const {
    getCourse,
    getAssignmentForCourse,
    updateAssignmentProgress,
    saveModuleProgress,
    getModuleProgress,
    saveQuizResult,
    issueCertificate,
    getUserCertificates
  } = useCourses();
  const { user } = useAuth();

  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'slides' | 'infographic' | 'pptx'>('slides');
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isFinalEvalOpen, setIsFinalEvalOpen] = useState(false);
  const [showModuleList, setShowModuleList] = useState(true);
  const [certificateToShow, setCertificateToShow] = useState<Certificate | null>(null);
  const [finalEvalFailed, setFinalEvalFailed] = useState<number | null>(null);
  const [finalEvalAttempts, setFinalEvalAttempts] = useState(0);

  const course = getCourse(courseId || '');
  const assignment = user && courseId ? getAssignmentForCourse(user.id, courseId) : undefined;
  const existingCertificate = user && course
    ? getUserCertificates(user.id).find(c => c.courseId === course.id)
    : undefined;

  const moduleStatus = useMemo(() => {
    if (!course || !user) return [];
    return course.modules.map(module => {
      const prog = getModuleProgress(user.id, course.id, module.id);
      const slidesViewed = prog?.completedSlides.length || 0;
      const allSlidesViewed = slidesViewed >= (module.slides?.length || 0);
      const completed = module.quiz ? !!prog?.completed : allSlidesViewed;
      return { quizScore: prog?.quizScore, allSlidesViewed, completed };
    });
  }, [course, user, getModuleProgress]);

  const completedModules = moduleStatus.filter(s => s.completed).length;
  const totalModules = course?.modules?.length || 0;
  const allModulesCompleted = totalModules > 0 && completedModules === totalModules;
  const courseProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  useEffect(() => {
    if (!course || !user) return;
    const module = course.modules?.[currentModuleIndex];
    const slide = module?.slides?.[currentSlideIndex];
    if (module && slide) saveModuleProgress(user.id, course.id, module.id, [slide.id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModuleIndex, currentSlideIndex, course?.id, user?.id]);

  useEffect(() => {
    if (!assignment || assignment.status === 'completed') return;
    if (assignment.progress !== courseProgress) updateAssignmentProgress(assignment.id, courseProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseProgress, assignment?.id]);

  if (!course) return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="text-center">
        <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-4">Curso no encontrado</h2>
        <button onClick={() => navigate('/employee')} className="px-6 py-2.5 bg-[#D15F3D] text-white rounded-xl font-medium hover:bg-[#B34E2D] transition-colors">Volver al inicio</button>
      </div>
    </div>
  );

  if (!assignment && user?.role !== 'admin' && user?.role !== 'super_admin') return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
      <div className="text-center">
        <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Curso no asignado</h2>
        <p className="text-gray-400 mb-6">No tienes autorización para acceder a este curso.</p>
        <button onClick={() => navigate('/employee')} className="px-6 py-2.5 bg-[#D15F3D] text-white rounded-xl font-medium hover:bg-[#B34E2D] transition-colors">Volver</button>
      </div>
    </div>
  );

  const currentModule = course.modules?.[currentModuleIndex];
  const currentSlide = currentModule?.slides?.[currentSlideIndex];
  const totalSlides = currentModule?.slides?.length || 0;
  const currentModuleCompleted = moduleStatus[currentModuleIndex]?.completed;

  const buildFinalEvaluation = useCallback((): Quiz => {
    if (course.finalEvaluation) {
      return course.finalEvaluation;
    }
    const allQuestions: Question[] = course.modules.flatMap(m => m.quiz?.questions || []);
    const seed = `${course.id}-${user?.id || 'anon'}`;
    const shuffled = seededShuffle(allQuestions, seed);
    const selected = shuffled.slice(0, Math.min(20, shuffled.length));
    return {
      id: `final-${course.id}`,
      moduleId: '',
      title: `Evaluación Final: ${course.title}`,
      passingScore: course.passingScore || 70,
      maxAttempts: 3,
      questions: selected
    };
  }, [course, user?.id]);

  const goToSlide = (index: number) => {
    if (currentModule && index >= 0 && index < totalSlides) setCurrentSlideIndex(index);
  };

  const nextSlide = () => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else if (currentModuleIndex < totalModules - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentSlideIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    } else if (currentModuleIndex > 0) {
      const prevModule = course.modules?.[currentModuleIndex - 1];
      setCurrentModuleIndex(currentModuleIndex - 1);
      setCurrentSlideIndex((prevModule?.slides?.length || 1) - 1);
    }
  };

  const goToNextModule = () => {
    if (currentModuleIndex < totalModules - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setCurrentSlideIndex(0);
    }
  };

  const handleQuizComplete = (scorePct: number) => {
    setIsQuizOpen(false);
    if (!user || !currentModule) return;
    const passing = currentModule.quiz?.passingScore ?? 70;
    const passed = scorePct >= passing;
    saveQuizResult(user.id, course.id, currentModule.id, scorePct, passed);
    if (passed && currentModuleIndex < totalModules - 1) goToNextModule();
  };

  const handleFinalEvalComplete = async (scorePct: number) => {
    setIsFinalEvalOpen(false);
    setFinalEvalAttempts(prev => prev + 1);
    if (!user) return;
    const passing = course.passingScore || 70;
    if (scorePct >= passing) {
      const cert = existingCertificate || await issueCertificate(course.id, user.id, scorePct);
      if (assignment) await updateAssignmentProgress(assignment.id, 100, true);
      setFinalEvalFailed(null);
      setCertificateToShow(cert);
    } else {
      setFinalEvalFailed(scorePct);
    }
  };

  // Slide type dot colors
  const typeDotColor = (type?: string) => {
    switch (type) {
      case 'concept': return 'bg-blue-500';
      case 'example': return 'bg-orange-500';
      case 'tip':     return 'bg-emerald-500';
      case 'summary': return 'bg-amber-500';
      case 'image':   return 'bg-sky-500';
      default:        return 'bg-[#D15F3D]';
    }
  };

  const slideTypeName = (type?: string) => {
    switch (type) {
      case 'concept': return 'Concepto';
      case 'example': return 'Ejemplo';
      case 'tip':     return 'Consejo';
      case 'summary': return 'Resumen';
      case 'image':   return 'Imagen';
      default:        return 'Contenido';
    }
  };

  return (
    <>
      {/* CSS animation keyframe via style tag */}
      <style>{`
        @keyframes slideEnter {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="min-h-screen bg-[#0A0E1A] flex flex-col">
        {/* ── Header ── */}
        <header className="bg-[#0D1321] border-b border-white/10 px-4 py-3 shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => user?.role === 'admin' ? navigate(`/admin/courses/${courseId}/edit`) : navigate('/employee')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl text-sm font-medium transition-all border border-white/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </button>
              <div>
                <h1 className="font-semibold text-white text-sm md:text-base line-clamp-1">{course.title}</h1>
                <p className="text-xs text-gray-400">
                  Módulo {currentModuleIndex + 1}/{totalModules} · {completedModules} completado{completedModules !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress bar */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-28 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#D15F3D] to-[#E87A58] rounded-full transition-all duration-700"
                    style={{ width: `${courseProgress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 font-medium">{courseProgress}%</span>
              </div>

              {(allModulesCompleted || existingCertificate) && (
                <button
                  onClick={() => existingCertificate ? setCertificateToShow(existingCertificate) : setIsFinalEvalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 rounded-xl text-sm font-medium transition-all"
                >
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">{existingCertificate ? 'Certificado' : 'Evaluación Final'}</span>
                </button>
              )}

              {/* View Mode Toggle */}
              <div className="flex bg-[#0A0E1A] rounded-xl p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('slides')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    viewMode === 'slides' ? 'bg-[#D15F3D] text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Por diapositiva
                </button>
                {course.pptxUrl && (
                  <button
                    onClick={() => setViewMode('pptx')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      viewMode === 'pptx' ? 'bg-[#D15F3D] text-white shadow-md' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Presentación
                  </button>
                )}
                <button
                  onClick={() => setViewMode('infographic')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    viewMode === 'infographic' ? 'bg-[#D15F3D] text-white shadow-md' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Infografía
                </button>
              </div>

              <button
                onClick={() => setShowModuleList(!showModuleList)}
                className="p-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                title="Mostrar/Ocultar Menú"
              >
                {showModuleList ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* ── Failed eval banner ── */}
        {finalEvalFailed !== null && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <p className="text-sm text-red-400">
                Obtuviste {finalEvalFailed}% — necesitas {course.passingScore || 70}% para aprobar.
                {(() => {
                  const maxAtt = buildFinalEvaluation().maxAttempts;
                  const remaining = maxAtt !== undefined ? maxAtt - finalEvalAttempts : undefined;
                  if (remaining !== undefined && remaining <= 0) return ' Sin intentos restantes.';
                  if (remaining !== undefined) return ` ${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}.`;
                  return ' Repasa los módulos e intenta de nuevo.';
                })()}
              </p>
              {(() => {
                const maxAtt = buildFinalEvaluation().maxAttempts;
                const canRetry = maxAtt === undefined || finalEvalAttempts < maxAtt;
                return canRetry
                  ? <button onClick={() => setIsFinalEvalOpen(true)} className="text-xs text-red-400 underline hover:text-red-300 ml-4 shrink-0">Reintentar</button>
                  : <span className="text-xs text-gray-500 ml-4 shrink-0 flex items-center gap-1"><Lock className="w-3 h-3" />Bloqueado</span>;
              })()}
            </div>
          </div>
        )}

        {/* ── Body ── */}
        {viewMode === 'infographic' ? (
          <div className="flex-1 overflow-y-auto">
            <CourseInfographic course={course} />
          </div>
        ) : viewMode === 'pptx' && course.pptxUrl ? (
          <div className="flex-1 flex flex-col bg-[#050A0F]">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(course.pptxUrl)}`}
              className="flex-1 w-full border-0"
              title={`${course.title} — Presentación`}
              allow="fullscreen"
            />
          </div>
        ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* ── Sidebar ── */}
          {showModuleList && (
            <aside className="w-72 shrink-0 bg-[#0D1321] border-r border-white/10 overflow-y-auto">
              <div className="p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 px-1">Contenido del Curso</p>
                <div className="space-y-1.5">
                  {course.modules?.map((module, idx) => {
                    const status = moduleStatus[idx];
                    const isActive = idx === currentModuleIndex;
                    return (
                      <button
                        key={module.id}
                        onClick={() => { setCurrentModuleIndex(idx); setCurrentSlideIndex(0); }}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-[#D15F3D]/15 border border-[#D15F3D]/30'
                            : 'border border-transparent hover:bg-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            status?.completed
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                              : isActive
                              ? 'bg-[#D15F3D]/20 border border-[#D15F3D]/40 text-[#D15F3D]'
                              : 'bg-white/5 border border-white/10 text-gray-500'
                          }`}>
                            {status?.completed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                              {module.title}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {module.slides?.length || 0} slides
                              {status?.quizScore != null && ` · ${status.quizScore}%`}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Evaluación final */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    allModulesCompleted
                      ? existingCertificate
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-amber-500/30 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10'
                      : 'border-white/5 bg-white/2 opacity-40'
                  }`}
                    onClick={() => allModulesCompleted && !existingCertificate && setIsFinalEvalOpen(true)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        existingCertificate
                          ? 'bg-emerald-500/20 border border-emerald-500/40'
                          : 'bg-amber-500/20 border border-amber-500/40'
                      }`}>
                        <Award className={`w-4 h-4 ${existingCertificate ? 'text-emerald-400' : 'text-amber-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Evaluación Final</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {existingCertificate
                            ? `✓ Aprobada · ${existingCertificate.score}%`
                            : allModulesCompleted
                            ? 'Disponible'
                            : 'Completa todos los módulos'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Material de Apoyo — download links */}
                {(course.pptxUrl || course.sourceDocUrl) && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3 px-1">Material de Apoyo</p>
                    <div className="space-y-1.5">
                      {course.pptxUrl && (
                        <a
                          href={course.pptxUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/10 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-300 group-hover:text-white truncate">Presentación PPTX</p>
                            <p className="text-[11px] text-gray-500">Descargar diapositivas</p>
                          </div>
                          <Download className="w-4 h-4 text-gray-500 group-hover:text-[#D15F3D] shrink-0" />
                        </a>
                      )}
                      {course.sourceDocUrl && (
                        <a
                          href={course.sourceDocUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-transparent hover:bg-white/5 hover:border-white/10 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                              {course.sourceDocName || 'Documento de referencia'}
                            </p>
                            <p className="text-[11px] text-gray-500">Descargar documento</p>
                          </div>
                          <Download className="w-4 h-4 text-gray-500 group-hover:text-[#D15F3D] shrink-0" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* ── Main Slide Area ── */}
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Slide */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
              {currentSlide ? (
                <div className="max-w-4xl mx-auto">
                  {/* Type + counter bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${typeDotColor(currentSlide.type)}`} />
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {slideTypeName(currentSlide.type)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      {currentSlideIndex + 1} / {totalSlides}
                    </span>
                  </div>

                  {/* Slide card */}
                  <SlideCard
                    slide={currentSlide}
                    animKey={`${currentModuleIndex}-${currentSlideIndex}`}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <BookOpen className="w-12 h-12 opacity-30" />
                </div>
              )}
            </div>

            {/* ── Navigation ── */}
            <div className="shrink-0 bg-[#0D1321] border-t border-white/10 px-4 py-4">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                {/* Prev */}
                <button
                  onClick={prevSlide}
                  disabled={currentModuleIndex === 0 && currentSlideIndex === 0}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-sm font-medium transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>

                {/* Slide dots */}
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {currentModule?.slides?.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToSlide(idx)}
                      title={slideTypeName(s.type)}
                      className={`transition-all rounded-full ${
                        idx === currentSlideIndex
                          ? `w-5 h-2.5 ${typeDotColor(s.type)}`
                          : idx < currentSlideIndex
                          ? `w-2.5 h-2.5 ${typeDotColor(s.type)} opacity-60`
                          : 'w-2.5 h-2.5 bg-white/20'
                      }`}
                    />
                  ))}
                </div>

                {/* Next / Action */}
                <div className="flex items-center gap-2">
                  {currentSlideIndex === totalSlides - 1 ? (
                    <>
                      {currentModule?.quiz && !currentModuleCompleted && (
                        <button
                          onClick={() => setIsQuizOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#D15F3D] text-white hover:bg-[#B34E2D] rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#D15F3D]/20"
                        >
                          <FileText className="w-4 h-4" />
                          Quiz del Módulo
                        </button>
                      )}
                      {currentModuleCompleted && currentModuleIndex < totalModules - 1 && (
                        <button
                          onClick={goToNextModule}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#D15F3D] text-white hover:bg-[#B34E2D] rounded-xl text-sm font-semibold transition-all"
                        >
                          Siguiente Módulo
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                      {currentModuleCompleted && currentModuleIndex === totalModules - 1 && !existingCertificate && (
                        <button
                          onClick={() => setIsFinalEvalOpen(true)}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 text-black hover:bg-amber-400 rounded-xl text-sm font-semibold transition-all"
                        >
                          <Award className="w-4 h-4" />
                          Evaluación Final
                        </button>
                      )}
                      {!currentModule?.quiz && !currentModuleCompleted && currentModuleIndex < totalModules - 1 && (
                        <button
                          onClick={goToNextModule}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#D15F3D] text-white hover:bg-[#B34E2D] rounded-xl text-sm font-semibold transition-all"
                        >
                          Siguiente Módulo
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={nextSlide}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-[#D15F3D] text-white hover:bg-[#B34E2D] rounded-xl text-sm font-semibold transition-all"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
        )}

        {/* ── Quiz Modal ── */}
        {isQuizOpen && currentModule?.quiz && (
          <QuizModal
            quiz={currentModule.quiz}
            onClose={() => setIsQuizOpen(false)}
            onComplete={handleQuizComplete}
            previousAttempts={user ? (getModuleProgress(user.id, course.id, currentModule.id)?.quizAttempts ?? 0) : 0}
          />
        )}

        {/* ── Evaluación Final ── */}
        {isFinalEvalOpen && (
          <QuizModal
            quiz={buildFinalEvaluation()}
            onClose={() => setIsFinalEvalOpen(false)}
            onComplete={handleFinalEvalComplete}
            isFinal
            previousAttempts={finalEvalAttempts}
          />
        )}

        {/* ── Certificado ── */}
        {certificateToShow && user && (
          <CertificateView
            userName={user.name}
            courseName={course.title}
            completionDate={new Date(certificateToShow.issuedAt).toLocaleDateString('es-ES')}
            certificateId={certificateToShow.verificationCode}
            score={certificateToShow.score}
            onClose={() => setCertificateToShow(null)}
          />
        )}
      </div>
    </>
  );
};

// ─── Quiz Modal (Dark Theme) ─────────────────────────────────────────────────

interface QuizModalProps {
  quiz: Quiz;
  onClose: () => void;
  onComplete: (scorePct: number) => void;
  isFinal?: boolean;
  previousAttempts?: number;
}

const QuizModal: React.FC<QuizModalProps> = ({ quiz, onClose, onComplete, isFinal = false, previousAttempts = 0 }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const maxAttempts = quiz.maxAttempts;
  const currentAttempt = previousAttempts + 1;
  const attemptsExhausted = maxAttempts !== undefined && currentAttempt > maxAttempts;

  const question = quiz.questions[currentQuestion];
  const totalQuestions = quiz.questions.length;
  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const scorePct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = scorePct >= (quiz.passingScore ?? 70);
  const progressPct = ((currentQuestion + 1) / totalQuestions) * 100;

  if (attemptsExhausted) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#111827] border border-white/10 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl"
          style={{ animation: 'slideEnter 0.3s ease-out' }}>
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 border-4 border-red-500 bg-red-500/10">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Intentos agotados</h2>
          <p className="text-gray-400 text-sm mb-1">
            Has usado {maxAttempts} de {maxAttempts} intentos permitidos.
          </p>
          <p className="text-gray-500 text-xs mb-7">
            Contacta a tu administrador si necesitas más intentos.
          </p>
          <button onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === question.correctAnswer) {
      setEarnedPoints(prev => prev + question.points);
      setCorrectCount(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div
          className="bg-[#111827] border border-white/10 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl"
          style={{ animation: 'slideEnter 0.3s ease-out' }}
        >
          {/* Score circle */}
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-5 border-4 ${
            passed ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10'
          }`}>
            <span className={`text-2xl font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>{scorePct}%</span>
          </div>

          <h2 className={`text-2xl font-bold mb-1 ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {passed ? '¡Aprobado!' : 'No aprobado'}
          </h2>
          <p className="text-gray-400 text-sm mb-1">
            {correctCount} de {totalQuestions} respuestas correctas
          </p>
          <p className="text-gray-500 text-xs mb-2">
            Puntaje mínimo requerido: {quiz.passingScore ?? 70}%
          </p>
          {maxAttempts !== undefined && (
            <p className="text-gray-500 text-xs mb-5">
              Intento {currentAttempt} de {maxAttempts}
              {!passed && currentAttempt >= maxAttempts && ' — sin intentos restantes'}
              {!passed && currentAttempt < maxAttempts && ` — ${maxAttempts - currentAttempt} restante${maxAttempts - currentAttempt !== 1 ? 's' : ''}`}
            </p>
          )}
          {!maxAttempts && <div className="mb-5" />}

          {isFinal && !passed && currentAttempt < (maxAttempts ?? Infinity) && (
            <p className="text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-5">
              Repasa los módulos para reforzar los conceptos y vuelve a intentarlo.
            </p>
          )}
          {isFinal && !passed && maxAttempts !== undefined && currentAttempt >= maxAttempts && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5">
              No quedan intentos. Contacta a tu administrador para solicitar una nueva oportunidad.
            </p>
          )}

          <button
            onClick={() => onComplete(scorePct)}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              passed
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
            }`}
          >
            {passed ? (isFinal ? 'Ver Certificado' : 'Continuar') : 'Cerrar'}
          </button>
        </div>
      </div>
    );
  }

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-[#111827] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
        style={{ animation: 'slideEnter 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                {isFinal && <Award className="w-4 h-4 text-amber-400" />}
                <h2 className="text-base font-bold text-white">{quiz.title}</h2>
              </div>
              <p className="text-xs text-gray-500">
                Pregunta {currentQuestion + 1} de {totalQuestions}
                {maxAttempts !== undefined && <span className="ml-2">· Intento {currentAttempt}/{maxAttempts}</span>}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Progress */}
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D15F3D] to-[#E87A58] rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Question + Options */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="text-white text-base md:text-lg font-medium leading-relaxed mb-5">{question.question}</p>

          <div className="space-y-2.5">
            {question.options.map((option: string, idx: number) => {
              const isCorrect = idx === question.correctAnswer;
              const isSelected = idx === selectedAnswer;
              const revealed = showExplanation;

              let cls = 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20';
              if (revealed) {
                if (isCorrect) cls = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200';
                else if (isSelected) cls = 'bg-red-500/15 border-red-500/50 text-red-300';
                else cls = 'bg-white/3 border-white/5 text-gray-500';
              } else if (isSelected) {
                cls = 'bg-[#D15F3D]/15 border-[#D15F3D]/40 text-white';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={revealed}
                  className={`w-full p-3.5 text-left border rounded-xl transition-all flex items-center gap-3 ${cls}`}
                >
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    revealed && isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' :
                    revealed && isSelected ? 'bg-red-500 border-red-500 text-white' :
                    isSelected ? 'bg-[#D15F3D] border-[#D15F3D] text-white' :
                    'border-white/20 text-gray-400'
                  }`}>
                    {optionLetters[idx]}
                  </div>
                  <span className="text-sm md:text-base">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div
              className={`mt-4 p-4 rounded-xl border text-sm leading-relaxed ${
                selectedAnswer === question.correctAnswer
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
              }`}
              style={{ animation: 'slideEnter 0.2s ease-out' }}
            >
              <p className="font-semibold mb-1">
                {selectedAnswer === question.correctAnswer ? '✓ ¡Correcto!' : '✗ Incorrecto'}
              </p>
              <p className="text-gray-300">{question.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-white/10 shrink-0 flex justify-end">
          <button
            onClick={nextQuestion}
            disabled={!showExplanation}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#D15F3D] disabled:bg-white/10 disabled:text-gray-500 text-white hover:bg-[#B34E2D] rounded-xl text-sm font-semibold transition-all disabled:cursor-not-allowed"
          >
            {currentQuestion < totalQuestions - 1 ? 'Siguiente pregunta' : 'Ver resultado'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
