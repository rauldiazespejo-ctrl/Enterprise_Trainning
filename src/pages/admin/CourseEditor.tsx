// Editor completo de cursos - CapacitaPro
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Input, Select, Badge } from '@/components/ui/Card';
import { useCourses } from '@/contexts/CourseContext';
import { Course, Module, Slide, Quiz, Question } from '@/types';
import {
  ChevronDown,
  ChevronRight,
  Save,
  ArrowLeft,
  BookOpen,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';
import { storage } from '@/lib/supabase';

// ─── Toast simple ────────────────────────────────────────────────────────────
interface ToastState {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

// ─── Deep-clone helpers ───────────────────────────────────────────────────────
// We keep a local mutable draft of the course so every keystroke doesn't
// trigger a context re-render.  We only push to context when the user saves.

type SlideType = Slide['type'];

const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  content: 'Contenido',
  image: 'Imagen',
  video: 'Video',
  summary: 'Resumen',
  concept: 'Concepto',
  example: 'Ejemplo',
  tip: 'Consejo',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SlideEditorProps {
  slide: Slide;
  onChange: (updated: Slide) => void;
}

const SlideEditor: React.FC<SlideEditorProps> = ({ slide, onChange }) => {
  const update = useCallback(
    (patch: Partial<Slide>) => onChange({ ...slide, ...patch }),
    [slide, onChange]
  );

  const handleKeyPointChange = (idx: number, value: string) => {
    const pts = [...(slide.keyPoints ?? [])];
    pts[idx] = value;
    update({ keyPoints: pts });
  };

  const addKeyPoint = () => update({ keyPoints: [...(slide.keyPoints ?? []), ''] });

  const removeKeyPoint = (idx: number) => {
    const pts = [...(slide.keyPoints ?? [])];
    pts.splice(idx, 1);
    update({ keyPoints: pts });
  };

  return (
    <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
      {/* Title + type badge */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            label="Título de la diapositiva"
            value={slide.title}
            onChange={e => update({ title: e.target.value })}
          />
        </div>
        <div className="pt-6">
          <Badge variant="info">{SLIDE_TYPE_LABELS[slide.type]}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">Contenido</label>
        <textarea
          value={slide.content}
          onChange={e => update({ content: e.target.value })}
          rows={4}
          className="input-modern w-full resize-y"
        />
      </div>

      {/* keyPoints (shown for any slide that has them or for content/summary/concept) */}
      {(slide.keyPoints !== undefined || ['content', 'summary', 'concept'].includes(slide.type)) && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">Puntos clave</label>
          {(slide.keyPoints ?? []).map((pt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                value={pt}
                onChange={e => handleKeyPointChange(idx, e.target.value)}
                className="input-modern flex-1"
                placeholder={`Punto ${idx + 1}`}
              />
              <button
                type="button"
                onClick={() => removeKeyPoint(idx)}
                className="text-red-400 hover:text-red-300 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addKeyPoint}>
            <Plus className="w-4 h-4" />
            Agregar punto
          </Button>
        </div>
      )}

      {/* Example-specific fields */}
      {slide.type === 'example' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">Escenario</label>
            <textarea
              value={slide.scenario ?? ''}
              onChange={e => update({ scenario: e.target.value })}
              rows={3}
              className="input-modern w-full resize-y"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300">Resultado esperado</label>
            <textarea
              value={slide.outcome ?? ''}
              onChange={e => update({ outcome: e.target.value })}
              rows={3}
              className="input-modern w-full resize-y"
            />
          </div>
        </div>
      )}

      {/* Tip-specific field */}
      {slide.type === 'tip' && (
        <Input
          label="Destacado"
          value={slide.highlight ?? ''}
          onChange={e => update({ highlight: e.target.value })}
        />
      )}
    </div>
  );
};

// ─── Question editor ──────────────────────────────────────────────────────────

interface QuestionEditorProps {
  question: Question;
  index: number;
  onChange: (updated: Question) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, index, onChange }) => {
  const update = (patch: Partial<Question>) => onChange({ ...question, ...patch });

  const handleOptionChange = (optIdx: number, value: string) => {
    const opts = [...question.options];
    opts[optIdx] = value;
    update({ options: opts });
  };

  return (
    <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
      <p className="text-sm font-semibold text-slate-300">Pregunta {index + 1}</p>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">Texto de la pregunta</label>
        <textarea
          value={question.question}
          onChange={e => update({ question: e.target.value })}
          rows={2}
          className="input-modern w-full resize-y"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((opt, optIdx) => (
          <Input
            key={optIdx}
            label={`Opción ${optIdx + 1}`}
            value={opt}
            onChange={e => handleOptionChange(optIdx, e.target.value)}
          />
        ))}
      </div>

      <Select
        label="Respuesta correcta"
        value={String(question.correctAnswer)}
        onChange={e => update({ correctAnswer: Number(e.target.value) })}
        options={question.options.map((opt, idx) => ({
          value: String(idx),
          label: `Opción ${idx + 1}: ${opt.slice(0, 40) || '(vacía)'}`,
        }))}
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">Explicación</label>
        <textarea
          value={question.explanation ?? ''}
          onChange={e => update({ explanation: e.target.value })}
          rows={2}
          className="input-modern w-full resize-y"
        />
      </div>
    </div>
  );
};

// ─── Module editor ────────────────────────────────────────────────────────────

interface ModuleEditorProps {
  mod: Module;
  moduleIndex: number;
  onChange: (updated: Module) => void;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({ mod, moduleIndex, onChange }) => {
  const [expanded, setExpanded] = useState(moduleIndex === 0);
  const [activeTab, setActiveTab] = useState<'slides' | 'quiz'>('slides');

  const update = (patch: Partial<Module>) => onChange({ ...mod, ...patch });

  const handleSlideChange = (idx: number, updated: Slide) => {
    const slides = [...mod.slides];
    slides[idx] = updated;
    update({ slides });
  };

  const handleQuestionChange = (idx: number, updated: Question) => {
    if (!mod.quiz) return;
    const questions = [...mod.quiz.questions];
    questions[idx] = updated;
    update({ quiz: { ...mod.quiz, questions } });
  };

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      {/* Module header – accordion toggle */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-800 hover:bg-slate-750 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-white">
            Módulo {moduleIndex + 1}: {mod.title || '(sin título)'}
          </span>
          <span className="text-xs text-slate-400">
            {mod.slides.length} diapositiva{mod.slides.length !== 1 ? 's' : ''}
            {mod.quiz ? ` · ${mod.quiz.questions.length} preguntas` : ''}
          </span>
        </div>
        {expanded
          ? <ChevronDown className="w-5 h-5 text-slate-400" />
          : <ChevronRight className="w-5 h-5 text-slate-400" />
        }
      </button>

      {expanded && (
        <div className="p-5 space-y-5">
          {/* Module basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Título del módulo"
              value={mod.title}
              onChange={e => update({ title: e.target.value })}
            />
            <Input
              label="Descripción"
              value={mod.description}
              onChange={e => update({ description: e.target.value })}
            />
          </div>

          {/* Tab switch */}
          <div className="flex border-b border-slate-700">
            {(['slides', 'quiz'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
                  ${activeTab === tab
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
              >
                {tab === 'slides' ? 'Diapositivas' : 'Quiz'}
              </button>
            ))}
          </div>

          {/* Slides tab */}
          {activeTab === 'slides' && (
            <div className="space-y-4">
              {mod.slides.length === 0 && (
                <p className="text-sm text-slate-400">Este módulo no tiene diapositivas.</p>
              )}
              {mod.slides.map((slide, idx) => (
                <div key={slide.id}>
                  <p className="text-xs text-slate-500 mb-1">Diapositiva {idx + 1}</p>
                  <SlideEditor
                    slide={slide}
                    onChange={updated => handleSlideChange(idx, updated)}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Quiz tab */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              {!mod.quiz && (
                <p className="text-sm text-slate-400">Este módulo no tiene quiz.</p>
              )}
              {mod.quiz && (
                <>
                  <Input
                    label="Título del quiz"
                    value={mod.quiz.title}
                    onChange={e =>
                      update({ quiz: mod.quiz ? { ...mod.quiz, title: e.target.value } : mod.quiz })
                    }
                  />
                  {mod.quiz.questions.length === 0 && (
                    <p className="text-sm text-slate-400">Este quiz no tiene preguntas.</p>
                  )}
                  {mod.quiz.questions.map((q, idx) => (
                    <QuestionEditor
                      key={q.id}
                      question={q}
                      index={idx}
                      onChange={updated => handleQuestionChange(idx, updated)}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main CourseEditor page ───────────────────────────────────────────────────

const CourseEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { getCourse, updateCourse } = useCourses();

  const [draft, setDraft] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '', type: 'success' });

  // Load course into local draft
  useEffect(() => {
    if (!courseId) return;
    const found = getCourse(courseId);
    // Deep-clone so local edits don't mutate context directly
    setDraft(found ? JSON.parse(JSON.stringify(found)) : null);
    setIsLoading(false);
  }, [courseId]); // intentionally not including getCourse to avoid infinite loop

  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const handleSave = (overrideStatus?: Course['status']) => {
    if (!draft || !courseId) return;
    const updates: Partial<Course> = {
      title: draft.title,
      description: draft.description,
      status: overrideStatus ?? draft.status,
      difficulty: draft.difficulty,
      category: draft.category,
      passingScore: draft.passingScore,
      estimatedDuration: draft.estimatedDuration,
      modules: draft.modules,
    };
    updateCourse(courseId, updates);
    if (overrideStatus) {
      setDraft(d => d ? { ...d, status: overrideStatus } : d);
    }
    showToast(overrideStatus === 'published' ? 'Curso publicado correctamente' : 'Cambios guardados');
  };

  const handleModuleChange = (idx: number, updated: Module) => {
    if (!draft) return;
    const modules = [...draft.modules];
    modules[idx] = updated;
    setDraft({ ...draft, modules });
  };

  const updateField = <K extends keyof Course>(key: K, value: Course[K]) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
  };

  // ── Render states ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <MainLayout title="Editor de Curso" isAdmin>
        <div className="flex items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!draft) {
    return (
      <MainLayout title="Editor de Curso" isAdmin>
        <div className="text-center py-24">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Curso no encontrado</h2>
          <p className="text-slate-400 mb-6">El curso que intentas editar no existe.</p>
          <Button variant="outline" onClick={() => navigate('/admin/courses')}>
            <ArrowLeft className="w-4 h-4" />
            Volver a Cursos
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Editar: ${draft.title}`} subtitle="Editor completo de contenido" isAdmin>
      <div className="space-y-6">

        {/* ── Action bar ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/courses')}>
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/courses')}>
              Cancelar
            </Button>
            <Button variant="secondary" onClick={() => handleSave()}>
              <Save className="w-4 h-4" />
              Guardar cambios
            </Button>
            <Button onClick={() => handleSave('published')}>
              <CheckCircle className="w-4 h-4" />
              Publicar
            </Button>
          </div>
        </div>

        {/* ── Toast notification ── */}
        {toast.visible && (
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
              ${toast.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
          >
            {toast.type === 'success'
              ? <CheckCircle className="w-4 h-4" />
              : <AlertCircle className="w-4 h-4" />
            }
            {toast.message}
          </div>
        )}

        {/* ── Section 1: Course info ── */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Información del Curso</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Input
                label="Título del curso"
                value={draft.title}
                onChange={e => updateField('title', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-slate-300">Descripción</label>
              <textarea
                value={draft.description}
                onChange={e => updateField('description', e.target.value)}
                rows={3}
                className="input-modern w-full resize-y"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-slate-300">Miniatura del Curso</label>
              <div className="flex items-center gap-4">
                {draft.thumbnail && (
                  <img src={draft.thumbnail} alt="Thumbnail" className="w-24 h-24 object-cover rounded-lg border border-slate-700" />
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    id="thumbnail-upload"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const path = `thumbnails/${Date.now()}_${file.name}`;
                        const url = await storage.uploadFile('assets', path, file);
                        updateField('thumbnail', url);
                        showToast('Imagen subida correctamente');
                      } catch (err) {
                        console.error(err);
                        showToast('Error al subir la imagen', 'error');
                      }
                    }}
                  />
                  <label htmlFor="thumbnail-upload" className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors border border-slate-600">
                    <Upload className="w-4 h-4" />
                    Subir Imagen
                  </label>
                  <p className="text-xs text-slate-400 mt-2">Formatos recomendados: JPG, PNG. Tamaño máximo: 2MB.</p>
                </div>
              </div>
            </div>
            <Select
              label="Estado"
              value={draft.status}
              onChange={e => updateField('status', e.target.value as Course['status'])}
              options={[
                { value: 'draft', label: 'Borrador' },
                { value: 'published', label: 'Publicado' },
                { value: 'archived', label: 'Archivado' },
              ]}
            />
            <Select
              label="Dificultad"
              value={draft.difficulty ?? 'beginner'}
              onChange={e => updateField('difficulty', e.target.value as Course['difficulty'])}
              options={[
                { value: 'beginner', label: 'Principiante' },
                { value: 'intermediate', label: 'Intermedio' },
                { value: 'advanced', label: 'Avanzado' },
              ]}
            />
            <Input
              label="Categoría"
              value={draft.category ?? ''}
              onChange={e => updateField('category', e.target.value)}
              placeholder="Ej: Gestión, Seguridad, Tecnología"
            />
            <Input
              label="Puntaje de aprobación (%)"
              type="number"
              min={0}
              max={100}
              value={draft.passingScore}
              onChange={e => updateField('passingScore', Number(e.target.value))}
            />
          </div>
        </Card>

        {/* ── Section 2: Modules ── */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-5">
            Módulos ({draft.modules.length})
          </h2>
          {draft.modules.length === 0 && (
            <p className="text-sm text-slate-400">Este curso no tiene módulos todavía.</p>
          )}
          <div className="space-y-3">
            {draft.modules.map((mod, idx) => (
              <ModuleEditor
                key={mod.id}
                mod={mod}
                moduleIndex={idx}
                onChange={updated => handleModuleChange(idx, updated)}
              />
            ))}
          </div>
        </Card>

        {/* ── Bottom action bar (repeat for convenience) ── */}
        <div className="flex flex-wrap justify-end gap-2 pb-8">
          <Button variant="outline" onClick={() => navigate('/admin/courses')}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={() => handleSave()}>
            <Save className="w-4 h-4" />
            Guardar cambios
          </Button>
          <Button onClick={() => handleSave('published')}>
            <CheckCircle className="w-4 h-4" />
            Publicar
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default CourseEditor;
