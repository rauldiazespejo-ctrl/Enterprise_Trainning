// Página para subir documentos y generar cursos
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Button, Input, Select, ProgressBar } from '@/components/ui/Card';
import { useCourses } from '@/contexts/CourseContext';
import { generateCourseFromDocument, parseDocument } from '@/lib/documentParser';
import { generateCourseWithAI, isAIConfigured } from '@/lib/aiGenerator';
import {
  Upload,
  FileText,
  File,
  CheckCircle,
  Loader2,
  BookOpen,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';

const DocumentUpload: React.FC = () => {
  const navigate = useNavigate();
  const { createCourse } = useCourses();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [generatedCourse, setGeneratedCourse] = useState<any>(null);
  const [error, setError] = useState('');

  // Estados del formulario
  const [courseConfig, setCourseConfig] = useState({
    title: '',
    category: 'general',
    difficulty: 'beginner',
    numModules: 4
  });

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const validTypes = ['.pdf', '.txt', '.doc', '.docx'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validTypes.includes(extension)) {
      setError('Solo se permiten archivos PDF, TXT o DOC');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Auto-generar título basado en el nombre del archivo
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    setCourseConfig(prev => ({ ...prev, title: fileName }));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const processDocument = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setError('');

    try {
      setProcessingStatus('Extrayendo texto del documento...');
      setProcessingProgress(15);
      const text = await parseDocument(selectedFile);

      if (text.length < 200) {
        throw new Error('El documento no contiene suficiente texto para generar un curso.');
      }

      let generated;

      if (isAIConfigured()) {
        // Generación real con IA (DeepSeek)
        setProcessingStatus('Generando curso con IA (DeepSeek)... esto puede tardar un minuto');
        setProcessingProgress(40);
        try {
          generated = await generateCourseWithAI(text, (status) => setProcessingStatus(status));
          setProcessingProgress(90);
        } catch (aiError) {
          // Si la IA falla, avisar y usar el generador básico
          console.error('Fallo la generación con IA, usando generador básico:', aiError);
          setProcessingStatus('La IA no respondió; usando generador básico...');
          setProcessingProgress(60);
          generated = await generateCourseFromDocument(selectedFile);
          setError(`Aviso: la generación con IA falló (${aiError instanceof Error ? aiError.message : 'error desconocido'}). Se usó el generador básico.`);
        }
      } else {
        setProcessingStatus('Generando módulos (sin IA: configura DeepSeek en Configuración)...');
        setProcessingProgress(60);
        generated = await generateCourseFromDocument(selectedFile);
      }

      setProcessingStatus('Finalizando...');
      setProcessingProgress(100);

      setGeneratedCourse(generated);
      setCourseConfig(prev => ({ ...prev, title: generated.title || prev.title }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el documento. Por favor intenta de nuevo.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const saveCourse = () => {
    if (!generatedCourse) return;

    const course = createCourse({
      title: courseConfig.title || generatedCourse.title,
      description: generatedCourse.description,
      modules: generatedCourse.modules.map((m: any, idx: number) => ({
        id: `mod-${Date.now()}-${idx}`,
        courseId: '',
        title: m.title,
        description: m.description,
        order: idx + 1,
        estimatedDuration: 15,
        slides: m.slides.map((s: any, sIdx: number) => ({
          id: `slide-${Date.now()}-${idx}-${sIdx}`,
          moduleId: '',
          title: s.title,
          content: s.content,
          order: sIdx + 1,
          type: s.type,
          keyPoints: s.keyPoints,
          scenario: s.scenario,
          outcome: s.outcome,
          highlight: s.highlight,
        })),
        quiz: {
          id: `quiz-${Date.now()}-${idx}`,
          moduleId: '',
          title: m.quiz.title,
          passingScore: 70,
          timeLimit: 10,
          questions: m.quiz.questions.map((q: any, qIdx: number) => ({
            id: `q-${Date.now()}-${idx}-${qIdx}`,
            quizId: '',
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points
          }))
        }
      })),
      category: courseConfig.category,
      difficulty: courseConfig.difficulty as 'beginner' | 'intermediate' | 'advanced',
      status: 'published',
      passingScore: 70,
      estimatedDuration: generatedCourse.estimatedDuration
    });

    navigate('/admin/courses');
  };

  const removeFile = () => {
    setSelectedFile(null);
    setGeneratedCourse(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <MainLayout title="Subir Documento" subtitle="Genera cursos automáticamente desde documentos" isAdmin>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Estado de la IA */}
        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
          isAIConfigured()
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-amber-50 border border-amber-200 text-amber-700'
        }`}>
          <Sparkles className="w-4 h-4 shrink-0" />
          {isAIConfigured()
            ? 'Generación con IA activa (DeepSeek): los cursos se crearán con contenido real del documento.'
            : 'IA no configurada: se usará el generador básico. Configura tu API key de DeepSeek en Configuración → Inteligencia Artificial para obtener cursos de calidad.'}
        </div>

        {/* Upload Area */}
        <Card className="p-6">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 hover:border-blue-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Arrastra tu documento aquí
                </h3>
                <p className="text-slate-500 mb-4">
                  o haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Formatos aceptados: PDF, TXT, DOC, DOCX
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  Seleccionar Archivo
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{selectedFile.name}</p>
                <p className="text-sm text-slate-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={removeFile}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </Card>

        {/* Course Configuration */}
        {selectedFile && !generatedCourse && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuración del Curso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Título del Curso"
                value={courseConfig.title}
                onChange={(e) => setCourseConfig({ ...courseConfig, title: e.target.value })}
                placeholder="Nombre del curso"
              />
              <Select
                label="Categoría"
                value={courseConfig.category}
                onChange={(e) => setCourseConfig({ ...courseConfig, category: e.target.value })}
                options={categories}
              />
              <Select
                label="Dificultad"
                value={courseConfig.difficulty}
                onChange={(e) => setCourseConfig({ ...courseConfig, difficulty: e.target.value })}
                options={difficulties}
              />
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <Button variant="outline" onClick={removeFile}>
                Cancelar
              </Button>
              <Button onClick={processDocument} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generar Curso
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="font-medium text-slate-900">{processingStatus}</p>
                <ProgressBar value={processingProgress} showLabel />
              </div>
            </div>
          </Card>
        )}

        {/* Generated Course Preview */}
        {generatedCourse && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-slate-900">Curso Generado Exitosamente</h3>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-slate-900 mb-2">{generatedCourse.title}</h4>
              <p className="text-sm text-slate-600 mb-2">{generatedCourse.description}</p>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {generatedCourse.modules.length} módulos
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {generatedCourse.estimatedDuration} min duración estimada
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <h5 className="font-medium text-slate-700">Contenido generado:</h5>
              {generatedCourse.modules.map((module: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{module.title}</p>
                    <p className="text-sm text-slate-500">
                      {module.slides.length} diapositivas • {module.quiz.questions.length} preguntas
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setGeneratedCourse(null)}>
                Regenerar
              </Button>
              <Button onClick={saveCourse}>
                <CheckCircle className="w-4 h-4" />
                Guardar Curso
              </Button>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default DocumentUpload;