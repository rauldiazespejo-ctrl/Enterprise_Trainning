import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Input, Select } from '@/components/ui/Card';
import { useCourses } from '@/contexts/CourseContext';
import { parsePptx, PptxSlide } from '@/lib/pptxParser';
import { generateQuestionsWithAI } from '@/lib/aiGenerator';
import { GeneratedQuestion } from '@/types';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Save,
  FileText,
  ImageIcon,
} from 'lucide-react';

const categories = [
  { value: 'general', label: 'General' },
  { value: 'seguridad', label: 'Seguridad' },
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'liderazgo', label: 'Liderazgo' },
  { value: 'comunicacion', label: 'Comunicación' },
  { value: 'hr', label: 'Recursos Humanos' },
];

const difficulties = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
];

const numQuestionsOptions = [
  { value: '5', label: '5 preguntas' },
  { value: '10', label: '10 preguntas' },
  { value: '15', label: '15 preguntas' },
  { value: '20', label: '20 preguntas' },
];

const DocumentUpload: React.FC = () => {
  const navigate = useNavigate();
  const { createCourse } = useCourses();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceDocRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingSource, setIsDraggingSource] = useState(false);
  const [sourceDoc, setSourceDoc] = useState<File | null>(null);
  const [sourceDocText, setSourceDocText] = useState('');
  const [isParsingSource, setIsParsingSource] = useState(false);
  const [sourceDocError, setSourceDocError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [slides, setSlides] = useState<PptxSlide[]>([]);
  const [parseError, setParseError] = useState('');
  const [showSlidesPreview, setShowSlidesPreview] = useState(true);

  const [courseConfig, setCourseConfig] = useState({
    title: '',
    category: 'general',
    difficulty: 'beginner',
    numQuestions: 10,
    passingScore: 70,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [generateError, setGenerateError] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const totalChars = slides.reduce((acc, s) => acc + s.rawText.length, 0);
  // True when at least one slide has extractable XML text (not image-only placeholders)
  const hasRealContent = slides.some(
    s =>
      s.bullets.length > 0 ||
      (!s.rawText.startsWith('[') && s.rawText.replace(/\s+/g, '').length > 20)
  );

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) processFile(e.target.files[0]);
  };

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pptx') {
      setParseError('Solo se permiten archivos .PPTX');
      return;
    }
    setSelectedFile(file);
    setParseError('');
    setSlides([]);
    setGeneratedQuestions(null);
    setGenerateError('');
    setSaveError('');
    setIsParsing(true);
    try {
      const parsed = await parsePptx(file);
      setSlides(parsed);
      // Use filename as title when first slide has no real title (placeholder)
      const autoTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const firstTitle = parsed[0]?.title || '';
      const isPlaceholderTitle = /^diapositiva\s*\d+$/i.test(firstTitle.trim());
      setCourseConfig(prev => ({ ...prev, title: isPlaceholderTitle ? autoTitle : (firstTitle || autoTitle) }));
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
    setSourceDoc(null);
    setSourceDocText('');
    setSourceDocError('');
    if (sourceDocRef.current) sourceDocRef.current.value = '';
  };

  const processSourceDoc = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      setSourceDocError('Solo se permiten archivos PDF o DOCX');
      return;
    }
    setSourceDoc(file);
    setSourceDocError('');
    setSourceDocText('');
    setIsParsingSource(true);
    try {
      let text = '';
      if (ext === 'pdf') {
        const { parsePdf } = await import('@/lib/pdfParser');
        text = await parsePdf(file);
      } else {
        const { parseDocx } = await import('@/lib/docxParser');
        text = await parseDocx(file);
      }
      // Truncate to ~20 000 chars — enough context for question generation
      setSourceDocText(text.slice(0, 20000));
    } catch (err) {
      setSourceDocError(err instanceof Error ? err.message : 'Error al leer el documento.');
      setSourceDoc(null);
    } finally {
      setIsParsingSource(false);
    }
  };

  const removeSourceDoc = () => {
    setSourceDoc(null);
    setSourceDocText('');
    setSourceDocError('');
    if (sourceDocRef.current) sourceDocRef.current.value = '';
  };

  const handleGenerateQuestions = async () => {
    if (slides.length === 0) return;
    setIsGenerating(true);
    setGenerateError('');
    setGeneratedQuestions(null);

    // Prefer source document (PDF/DOCX) text over PPTX slide text
    let contentText = sourceDocText;

    if (!contentText) {
      // Build text from slides — skip generic image-only placeholders
      const GENERIC_PLACEHOLDER = /^\[diapositiva\s*\d+\s*[—-]/i;
      const slideParts: string[] = [];
      for (const s of slides) {
        if (s.bullets.length > 0) {
          slideParts.push([s.title, ...s.bullets].filter(Boolean).join('\n'));
        } else if (!s.rawText.startsWith('[')) {
          slideParts.push(s.rawText);
        } else if (!GENERIC_PLACEHOLDER.test(s.rawText)) {
          const titleMatch = s.rawText.match(/^\[(.+?)\s*[—-]/);
          if (titleMatch) slideParts.push(titleMatch[1].trim());
        }
      }
      contentText = slideParts.join('\n\n');
    }

    const topic = courseConfig.title || selectedFile?.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || '';

    try {
      const questions = await generateQuestionsWithAI(contentText, courseConfig.numQuestions, {
        difficulty: courseConfig.difficulty,
        category: courseConfig.category,
        topic,
      });
      setGeneratedQuestions(questions);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Error al generar preguntas. Intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const buildCoursePayload = (status: 'draft' | 'published') => {
    const quizQuestions: GeneratedQuestion[] = generatedQuestions ?? [];
    return {
      title: courseConfig.title || selectedFile?.name.replace(/\.[^/.]+$/, '') || 'Nuevo Curso',
      description: slides[0]?.bullets.slice(0, 2).join(' ') || '',
      category: courseConfig.category,
      difficulty: courseConfig.difficulty as 'beginner' | 'intermediate' | 'advanced',
      status,
      passingScore: Number(courseConfig.passingScore),
      estimatedDuration: slides.length * 2,
      modules: [{
        id: `mod-${Date.now()}`,
        courseId: '',
        title: 'Contenido de la Presentación',
        description: '',
        order: 1,
        estimatedDuration: slides.length * 2,
        slides: slides.map((s, i) => ({
          id: `slide-${i}`,
          moduleId: '',
          title: s.title || `Diapositiva ${s.slideNumber}`,
          content: s.bullets.join('\n') || s.rawText,
          order: s.slideNumber,
          type: 'content' as const,
          keyPoints: s.bullets.length > 0 ? s.bullets : undefined,
          imageData: s.images.length > 0 ? s.images : undefined,
        })),
        quiz: {
          id: `quiz-${Date.now()}`,
          moduleId: '',
          title: 'Evaluación',
          passingScore: Number(courseConfig.passingScore),
          timeLimit: 20,
          questions: quizQuestions.map((q, qi) => ({
            id: `q-${qi}`,
            quizId: '',
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || '',
            points: q.points || 10,
          })),
        },
      }],
    };
  };

  const uploadDocToStorage = async (file: File): Promise<string> => {
    const safeName = file.name.replace(/[^a-z0-9._-]/gi, '_');
    const path = `source-docs/${Date.now()}_${safeName}`;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const contentType = ext === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file, { contentType, upsert: false });
    if (error) throw new Error(`Error subiendo documento: ${error.message}`);
    if (!data) throw new Error('No se recibió respuesta del servidor al subir documento');
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const uploadPptxToStorage = async (file: File): Promise<string> => {
    const safeName = file.name.replace(/[^a-z0-9._-]/gi, '_');
    const path = `pptx/${Date.now()}_${safeName}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file, {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        upsert: false,
      });
    if (error) throw new Error(`Error subiendo PPTX: ${error.message}`);
    if (!data) throw new Error('No se recibió respuesta del servidor al subir PPTX');
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const uploadBase64ToStorage = async (
    dataUrl: string,
    slideIndex: number,
    imgIndex: number
  ): Promise<string> => {
    const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return dataUrl;

    const mime = match[1];
    const ext = mime.split('/')[1] === 'jpeg' ? 'jpg' : mime.split('/')[1];
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });

    const path = `slide-images/${Date.now()}_s${slideIndex}_img${imgIndex}.${ext}`;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, blob, { contentType: mime, upsert: false });

    if (error) throw new Error(`Error subiendo imagen de diapositiva: ${error.message}`);
    if (!data) throw new Error('No se recibió respuesta al subir imagen');
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const uploadAllSlideImages = async <T extends ReturnType<typeof buildCoursePayload>>(
    payload: T,
    onProgress?: (done: number, total: number) => void,
  ): Promise<T> => {
    const module = payload.modules[0];
    if (!module) return payload;

    let totalImages = 0;
    let uploadedImages = 0;
    for (const slide of module.slides) {
      totalImages += slide.imageData?.length ?? 0;
    }
    if (totalImages === 0) return payload;

    const updatedSlides = await Promise.all(
      module.slides.map(async (slide, si) => {
        if (!slide.imageData || slide.imageData.length === 0) return slide;

        const uploadedUrls = await Promise.all(
          slide.imageData.map(async (b64, ii) => {
            const url = await uploadBase64ToStorage(b64, si, ii);
            uploadedImages++;
            onProgress?.(uploadedImages, totalImages);
            return url;
          })
        );
        return { ...slide, imageData: uploadedUrls };
      })
    );

    return {
      ...payload,
      modules: [{ ...module, slides: updatedSlides }],
    } as T;
  };

  const [imageUploadProgress, setImageUploadProgress] = useState<{ done: number; total: number } | null>(null);

  const saveCourse = async (status: 'draft' | 'published') => {
    if (slides.length === 0) return;
    setIsSaving(true);
    setSaveError('');
    setImageUploadProgress(null);
    try {
      const pptxUrl = selectedFile ? await uploadPptxToStorage(selectedFile) : undefined;
      const sourceDocUrl = sourceDoc ? await uploadDocToStorage(sourceDoc) : undefined;
      let payload = {
        ...buildCoursePayload(status),
        pptxUrl,
        sourceDocUrl,
        sourceDocName: sourceDoc?.name,
      };

      payload = await uploadAllSlideImages(payload, (done, total) => {
        setImageUploadProgress({ done, total });
      });

      await createCourse(payload);
      navigate('/admin/courses');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar el curso. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
      setImageUploadProgress(null);
    }
  };

  return (
    <MainLayout title="Subir Presentación" subtitle="Crea una capacitación desde PPTX + documento de referencia PDF o Word" isAdmin>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Upload zone */}
        <Card className="p-6">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                isDragging ? 'border-brand bg-brand/10' : 'border-slate-600 hover:border-brand/60'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-brand/20 rounded-full flex items-center justify-center text-3xl">
                  📊
                </div>
                <h3 className="text-lg font-semibold text-white">Sube tu presentación .PPTX</h3>
                <p className="text-slate-400 text-sm">Arrastra aquí o haz clic para seleccionar</p>
                <input ref={fileInputRef} type="file" accept=".pptx" onChange={handleFileInputChange} className="hidden" />
                <Button>Seleccionar PPTX</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700">
              <div className="w-12 h-12 bg-brand/20 rounded-lg flex items-center justify-center text-2xl shrink-0">📊</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{selectedFile.name}</p>
                <p className="text-sm text-slate-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  {isParsing && ' • Analizando diapositivas...'}
                  {!isParsing && slides.length > 0 && ` • ${slides.length} diapositivas • ${totalChars.toLocaleString()} caracteres`}
                </p>
              </div>
              {isParsing
                ? <Loader2 className="w-5 h-5 text-brand animate-spin shrink-0" />
                : <button onClick={removeFile} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"><X className="w-5 h-5" /></button>
              }
            </div>
          )}

          {parseError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}
        </Card>

        {/* Source Document — shown once PPTX slides are loaded */}
        {slides.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-brand" />
              <h3 className="font-semibold text-white">
                Documento de Referencia{' '}
                <span className="text-slate-400 font-normal text-sm">(opcional)</span>
              </h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Sube el PDF o Word del material del curso. La IA usará este texto para generar preguntas más
              precisas que con solo las diapositivas.
            </p>

            {!sourceDoc ? (
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  isDraggingSource
                    ? 'border-brand bg-brand/10'
                    : 'border-slate-600 hover:border-brand/60'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDraggingSource(true); }}
                onDragLeave={() => setIsDraggingSource(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingSource(false);
                  if (e.dataTransfer.files.length > 0) processSourceDoc(e.dataTransfer.files[0]);
                }}
                onClick={() => sourceDocRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <p className="text-slate-400 text-sm">Arrastra tu PDF o DOCX aquí, o</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); sourceDocRef.current?.click(); }}
                  >
                    Seleccionar archivo
                  </Button>
                  <input
                    ref={sourceDocRef}
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => { if (e.target.files && e.target.files.length > 0) processSourceDoc(e.target.files[0]); }}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-xl shrink-0">
                  {sourceDoc.name.toLowerCase().endsWith('.pdf') ? '📕' : '📘'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{sourceDoc.name}</p>
                  <p className="text-sm text-slate-400">
                    {(sourceDoc.size / 1024 / 1024).toFixed(2)} MB
                    {isParsingSource && ' • Extrayendo texto...'}
                    {!isParsingSource && sourceDocText && ` • ${sourceDocText.length.toLocaleString()} caracteres extraídos`}
                  </p>
                </div>
                {isParsingSource ? (
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
                ) : (
                  <>
                    {sourceDocText && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
                    <button
                      onClick={removeSourceDoc}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            )}

            {sourceDocError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{sourceDocError}</span>
              </div>
            )}
          </Card>
        )}

        {/* Main content: slides preview + config */}
        {slides.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Slides preview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand" />
                  <h3 className="font-semibold text-white">{slides.length} diapositivas extraídas</h3>
                </div>
                <button onClick={() => setShowSlidesPreview(v => !v)} className="text-slate-400 hover:text-white">
                  {showSlidesPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {showSlidesPreview && (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {slides.map(slide => (
                    <div key={slide.slideNumber} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                      <p className="text-sm font-medium text-white">
                        <span className="text-brand mr-2">#{slide.slideNumber}</span>
                        {slide.title || '(sin título)'}
                      </p>
                      {slide.bullets.length > 0 && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {slide.bullets[0]}
                          {slide.bullets.length > 1 && ` +${slide.bullets.length - 1} más`}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Config panel */}
            <Card className="p-6">
              <h3 className="font-semibold text-white mb-4">Configuración</h3>
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
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="N° de preguntas"
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
              </div>
            </Card>
          </div>
        )}

        {/* Generate questions with AI */}
        {slides.length > 0 && (
          <Card className="p-6">
            {/* Source doc active — best quality */}
            {sourceDocText && !generatedQuestions && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-2 text-emerald-300 text-sm">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  La IA usará el texto de <strong>{sourceDoc?.name}</strong> como fuente principal para
                  generar preguntas de alta calidad.
                </span>
              </div>
            )}

            {/* Warning when PPTX has no extractable text and no source doc */}
            {!hasRealContent && !sourceDocText && !generatedQuestions && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-2 text-blue-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Las diapositivas contienen imágenes sin texto extraíble. La IA generará las preguntas
                  basándose en el <strong>título del curso</strong>: "<em>{courseConfig.title}</em>".
                  Sube un PDF o Word arriba para obtener mejores resultados.
                </span>
              </div>
            )}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-brand mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-white">
                    {generatedQuestions
                      ? `✓ ${generatedQuestions.length} preguntas generadas`
                      : 'Generar Evaluación con IA (opcional)'}
                  </p>
                  <p className="text-sm text-slate-400">
                    {generatedQuestions
                      ? 'La evaluación se incluirá al guardar el curso.'
                      : sourceDocText
                      ? `Genera ${courseConfig.numQuestions} preguntas basadas en el documento de referencia.`
                      : hasRealContent
                      ? `Genera ${courseConfig.numQuestions} preguntas basadas en el contenido de las ${slides.length} diapositivas.`
                      : `Genera ${courseConfig.numQuestions} preguntas sobre el tema del curso usando IA.`}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                variant="secondary"
              >
                {isGenerating
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Generando...</>
                  : generatedQuestions
                  ? <><Sparkles className="w-4 h-4" />Regenerar</>
                  : <><Sparkles className="w-4 h-4" />Generar preguntas</>}
              </Button>
            </div>

            {generateError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{generateError}</span>
              </div>
            )}

            {generatedQuestions && generatedQuestions.length > 0 && (
              <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                {generatedQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-sm text-slate-300">
                    <span className="text-brand font-medium mr-2">{idx + 1}.</span>
                    {q.question}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Save buttons — available as soon as slides are ready */}
        {slides.length > 0 && (
          <Card className="p-6">
            {!generatedQuestions && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2 text-amber-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Sin evaluación generada. Puedes guardar el curso ahora y agregar preguntas después desde el editor,
                  o generar las preguntas con IA arriba antes de guardar.
                </span>
              </div>
            )}

            {saveError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{saveError}</span>
              </div>
            )}

            {imageUploadProgress && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                <ImageIcon className="w-4 h-4" />
                <span>Subiendo imágenes: {imageUploadProgress.done}/{imageUploadProgress.total}</span>
                <div className="flex-1 bg-amber-200 rounded-full h-2 max-w-xs">
                  <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${(imageUploadProgress.done / imageUploadProgress.total) * 100}%` }} />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 flex-wrap">
              <Button variant="outline" onClick={() => saveCourse('draft')} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" />Guardar como Borrador</>}
              </Button>
              <Button onClick={() => saveCourse('published')} disabled={isSaving}>
                {isSaving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><CheckCircle className="w-4 h-4" />Publicar Ahora</>}
              </Button>
            </div>
          </Card>
        )}

      </div>
    </MainLayout>
  );
};

export default DocumentUpload;
