import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Input, Select } from '@/components/ui/Card';
import { useCourses } from '@/contexts/CourseContext';
import { parsePptx, PptxSlide } from '@/lib/pptxParser';
import { generateQuestionsWithAI } from '@/lib/aiGenerator';
import { GeneratedQuestion } from '@/types';
import {
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const categories = [
  { value: 'general', label: 'General' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'liderazgo', label: 'Liderazgo' },
  { value: 'comunicacion', label: 'Comunicación' },
  { value: 'hr', label: 'Recursos Humanos' }
];

const difficulties = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' }
];

const numQuestionsOptions = [
  { value: '5', label: '5 preguntas' },
  { value: '10', label: '10 preguntas' },
  { value: '15', label: '15 preguntas' },
  { value: '20', label: '20 preguntas' }
];

const DocumentUpload: React.FC = () => {
  const navigate = useNavigate();
  const { createCourse } = useCourses();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [slides, setSlides] = useState<PptxSlide[]>([]);
  const [parseError, setParseError] = useState('');

  const [courseConfig, setCourseConfig] = useState({
    title: '',
    category: 'general',
    difficulty: 'beginner',
    numQuestions: 10,
    passingScore: 70
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [generateError, setGenerateError] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showSlidesPreview, setShowSlidesPreview] = useState(true);

  const totalChars = slides.reduce((acc, s) => acc + s.rawText.length, 0);
  const hasWarning = slides.length < 3 || totalChars < 200;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) processFile(files[0]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processFile(files[0]);
  };

  const processFile = async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (ext !== '.pptx') {
      setParseError('Solo se permiten archivos .PPTX');
      return;
    }

    setSelectedFile(file);
    setParseError('');
    setSlides([]);
    setGeneratedQuestions(null);
    setGenerateError('');
    setIsParsing(true);

    try {
      const parsed = await parsePptx(file);
      setSlides(parsed);
      const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setCourseConfig(prev => ({
        ...prev,
        title: parsed[0]?.title || autoTitle
      }));
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Error al leer el archivo PPTX.');
    } finally {
      setIsParsing(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setSlides([]);
    setGeneratedQuestions(null);
    setParseError('');
    setGenerateError('');
    setSaveError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateQuestions = async () => {
    if (slides.length === 0) return;
    setIsGenerating(true);
    setGenerateError('');
    setGeneratedQuestions(null);

    const allText = slides.map(s => s.rawText).join('\n\n---\n\n');
    try {
      const questions = await generateQuestionsWithAI(allText, courseConfig.numQuestions, {
        difficulty: courseConfig.difficulty,
        category: courseConfig.category
      });
      setGeneratedQuestions(questions);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Error al generar preguntas.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveCourse = async (status: 'draft' | 'published') => {
    if (!generatedQuestions || slides.length === 0) return;
    setIsSaving(true);
    setSaveError('');

    const numericPassingScore = Number(courseConfig.passingScore);

    try {
      await createCourse({
        title: courseConfig.title,
        description: slides[0]?.bullets.join(' ') || '',
        category: courseConfig.category,
        difficulty: courseConfig.difficulty as 'beginner' | 'intermediate' | 'advanced',
        status,
        passingScore: numericPassingScore,
        modules: [{
          id: `mod-${Date.now()}`,
          courseId: '',
          title: 'Contenido',
          description: '',
          order: 1,
          estimatedDuration: slides.length * 2,
          slides: slides.map((s, i) => ({
            id: `slide-${i}`,
            moduleId: '',
            title: s.title,
            content: s.bullets.join('\n'),
            order: s.slideNumber,
            type: 'content' as const,
            keyPoints: s.bullets
          })),
          quiz: {
            id: `quiz-${Date.now()}`,
            moduleId: '',
            title: 'Evaluación',
            passingScore: numericPassingScore,
            timeLimit: 20,
            questions: generatedQuestions.map((q, qi) => ({
              id: `q-${qi}`,
              quizId: '',
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              points: q.points
            }))
          }
        }]
      });
      navigate('/admin/courses');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar el curso.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout title="Subir Presentación" subtitle="Genera evaluaciones desde un archivo PPTX" isAdmin>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Upload zone */}
        <Card className="p-6">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-[#D15F3D] bg-[#D15F3D]/10'
                  : 'border-slate-600 hover:border-[#D15F3D]/60'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-[#D15F3D]/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Sube tu presentación .PPTX
                </h3>
                <p className="text-slate-400 mb-4 text-sm">
                  Arrastra el archivo aquí o haz clic para seleccionar
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pptx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Button variant="accent">Seleccionar PPTX</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700">
              <div className="w-12 h-12 bg-[#D15F3D]/20 rounded-lg flex items-center justify-center text-2xl">
                📊
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{selectedFile.name}</p>
                <p className="text-sm text-slate-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  {slides.length > 0 && ` • ${slides.length} diapositivas extraídas`}
                </p>
              </div>
              {isParsing ? (
                <Loader2 className="w-5 h-5 text-[#D15F3D] animate-spin shrink-0" />
              ) : (
                <button
                  onClick={removeFile}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {parseError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {parseError}
            </div>
          )}
        </Card>

        {/* Slides preview + config panel */}
        {slides.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Slides preview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">
                  Diapositivas extraídas
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {slides.length} slides • {totalChars.toLocaleString()} chars
                  </span>
                  <button
                    onClick={() => setShowSlidesPreview(v => !v)}
                    className="text-slate-400 hover:text-white"
                  >
                    {showSlidesPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {hasWarning && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2 text-amber-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {slides.length < 3
                    ? 'Se extrajeron menos de 3 diapositivas. El curso puede quedar incompleto.'
                    : 'El texto extraído es muy corto. Verifica que la presentación tenga contenido de texto.'}
                </div>
              )}

              {showSlidesPreview && (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {slides.map(slide => (
                    <div
                      key={slide.slideNumber}
                      className="p-3 bg-slate-800 rounded-lg border border-slate-700"
                    >
                      <p className="text-sm font-medium text-white">
                        <span className="text-[#D15F3D] mr-2">#{slide.slideNumber}</span>
                        {slide.title || '(sin título)'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {slide.bullets.length} bullets
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Config panel */}
            <Card className="p-6">
              <h3 className="font-semibold text-white mb-4">Configuración del Curso</h3>
              <div className="space-y-4">
                <Input
                  label="Título del Curso"
                  value={courseConfig.title}
                  onChange={e => setCourseConfig(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nombre del curso"
                />
                <Select
                  label="Categoría"
                  value={courseConfig.category}
                  onChange={e => setCourseConfig(prev => ({ ...prev, category: e.target.value }))}
                  options={categories}
                />
                <Select
                  label="Dificultad"
                  value={courseConfig.difficulty}
                  onChange={e => setCourseConfig(prev => ({ ...prev, difficulty: e.target.value }))}
                  options={difficulties}
                />
                <Select
                  label="Número de preguntas"
                  value={String(courseConfig.numQuestions)}
                  onChange={e => setCourseConfig(prev => ({ ...prev, numQuestions: Number(e.target.value) }))}
                  options={numQuestionsOptions}
                />
                <Input
                  label="Puntaje mínimo (%)"
                  type="number"
                  min={1}
                  max={100}
                  value={String(courseConfig.passingScore)}
                  onChange={e => setCourseConfig(prev => ({ ...prev, passingScore: Number(e.target.value) }))}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Generate questions button */}
        {slides.length > 0 && !generatedQuestions && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#D15F3D]" />
                <div>
                  <p className="font-medium text-white">Generar Preguntas con IA</p>
                  <p className="text-sm text-slate-400">
                    Se generarán {courseConfig.numQuestions} preguntas a partir del contenido de las {slides.length} diapositivas
                  </p>
                </div>
              </div>
              <Button
                variant="accent"
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generar Preguntas
                  </>
                )}
              </Button>
            </div>

            {generateError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {generateError}
              </div>
            )}
          </Card>
        )}

        {/* Generated questions preview */}
        {generatedQuestions && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">
                  {generatedQuestions.length} preguntas generadas
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Regenerar'}
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-6">
              {generatedQuestions.map((q, idx) => (
                <div key={idx} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-sm text-slate-300">
                    <span className="text-[#D15F3D] font-medium mr-2">{idx + 1}.</span>
                    {q.question}
                  </p>
                </div>
              ))}
            </div>

            {saveError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {saveError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => saveCourse('draft')}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar como Borrador'}
              </Button>
              <Button
                variant="accent"
                onClick={() => saveCourse('published')}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Publicar ahora
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

      </div>
    </MainLayout>
  );
};

export default DocumentUpload;
