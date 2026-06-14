// Visor de Cursos con Diapositivas
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourses } from '@/contexts/CourseContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Button, Badge, ProgressBar } from '@/components/ui/Card';
import CertificateView from '@/pages/employee/CertificateView';
import { Quiz, Question, Certificate } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle,
  ArrowLeft,
  FileText,
  Award
} from 'lucide-react';

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
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isFinalEvalOpen, setIsFinalEvalOpen] = useState(false);
  const [showModuleList, setShowModuleList] = useState(true);
  const [certificateToShow, setCertificateToShow] = useState<Certificate | null>(null);
  const [finalEvalFailed, setFinalEvalFailed] = useState<number | null>(null);

  const course = getCourse(courseId || '');
  const assignment = user && courseId ? getAssignmentForCourse(user.id, courseId) : undefined;
  const existingCertificate = user && course
    ? getUserCertificates(user.id).find(c => c.courseId === course.id)
    : undefined;

  // Estado de avance de cada módulo (un módulo sin quiz se completa viendo todas sus diapositivas)
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

  // Registrar la diapositiva actual como vista
  useEffect(() => {
    if (!course || !user) return;
    const module = course.modules?.[currentModuleIndex];
    const slide = module?.slides?.[currentSlideIndex];
    if (module && slide) {
      saveModuleProgress(user.id, course.id, module.id, [slide.id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModuleIndex, currentSlideIndex, course?.id, user?.id]);

  // Sincronizar el progreso con la asignación real
  useEffect(() => {
    if (!assignment || assignment.status === 'completed') return;
    if (assignment.progress !== courseProgress) {
      updateAssignmentProgress(assignment.id, courseProgress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseProgress, assignment?.id]);

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Curso no encontrado</h2>
          <Button onClick={() => navigate('/employee')}>Volver al inicio</Button>
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Curso no asignado</h2>
          <p className="text-slate-500 mb-6">No tienes autorización para acceder a este curso.</p>
          <Button onClick={() => navigate('/employee')}>Volver al inicio</Button>
        </Card>
      </div>
    );
  }

  const currentModule = course.modules?.[currentModuleIndex];
  const currentSlide = currentModule?.slides?.[currentSlideIndex];
  const totalSlides = currentModule?.slides?.length || 0;
  const currentModuleCompleted = moduleStatus[currentModuleIndex]?.completed;

  // Evaluación final: preguntas de todos los quizzes del curso (máx. 20)
  const buildFinalEvaluation = (): Quiz => {
    const allQuestions: Question[] = course.modules.flatMap(m => m.quiz?.questions || []);
    const selected = [...allQuestions].sort(() => Math.random() - 0.5).slice(0, 20);
    return {
      id: `final-${course.id}`,
      moduleId: '',
      title: `Evaluación Final: ${course.title}`,
      passingScore: course.passingScore || 70,
      questions: selected
    };
  };

  const goToSlide = (index: number) => {
    if (currentModule && index >= 0 && index < totalSlides) {
      setCurrentSlideIndex(index);
    }
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

  // Resultado del quiz de módulo
  const handleQuizComplete = (scorePct: number) => {
    setIsQuizOpen(false);
    if (!user || !currentModule) return;

    const passing = currentModule.quiz?.passingScore ?? 70;
    const passed = scorePct >= passing;
    saveQuizResult(user.id, course.id, currentModule.id, scorePct, passed);

    if (passed && currentModuleIndex < totalModules - 1) {
      goToNextModule();
    }
  };

  // Resultado de la evaluación final
  const handleFinalEvalComplete = (scorePct: number) => {
    setIsFinalEvalOpen(false);
    if (!user) return;

    const passing = course.passingScore || 70;
    if (scorePct >= passing) {
      const cert = existingCertificate || issueCertificate(course.id, user.id, scorePct);
      if (assignment) {
        updateAssignmentProgress(assignment.id, 100, true);
      }
      setFinalEvalFailed(null);
      setCertificateToShow(cert);
    } else {
      setFinalEvalFailed(scorePct);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/employee')}>
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="font-semibold text-slate-900">{course.title}</h1>
              <p className="text-sm text-slate-500">
                Módulo {currentModuleIndex + 1} de {totalModules} · {completedModules} completados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ProgressBar value={courseProgress} size="sm" className="w-32" />
            {(allModulesCompleted || existingCertificate) && (
              <Button
                size="sm"
                onClick={() => {
                  if (existingCertificate) {
                    setCertificateToShow(existingCertificate);
                  } else {
                    setIsFinalEvalOpen(true);
                  }
                }}
              >
                <Award className="w-4 h-4" />
                {existingCertificate ? 'Ver Certificado' : 'Evaluación Final'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowModuleList(!showModuleList)}>
              <FileText className="w-4 h-4" />
              Módulos
            </Button>
          </div>
        </div>
      </header>

      {/* Aviso de evaluación final reprobada */}
      {finalEvalFailed !== null && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-sm text-red-700">
              Obtuviste {finalEvalFailed}% en la evaluación final. Necesitas {course.passingScore || 70}% para aprobar.
              Repasa los módulos e inténtalo de nuevo.
            </p>
            <Button size="sm" variant="outline" onClick={() => setIsFinalEvalOpen(true)}>
              Reintentar
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Sidebar - Module List */}
        {showModuleList && (
          <aside className="w-80 bg-white border-r border-slate-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 mb-4">Contenido del Curso</h3>
              <div className="space-y-2">
                {course.modules?.map((module, idx) => (
                  <button
                    key={module.id}
                    onClick={() => {
                      setCurrentModuleIndex(idx);
                      setCurrentSlideIndex(0);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      idx === currentModuleIndex
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        moduleStatus[idx]?.completed
                          ? 'bg-green-500 text-white'
                          : idx === currentModuleIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {moduleStatus[idx]?.completed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${idx === currentModuleIndex ? 'text-blue-900' : 'text-slate-900'}`}>
                          {module.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          {module.slides?.length || 0} diapositivas
                          {moduleStatus[idx]?.quizScore !== undefined && ` · Quiz: ${moduleStatus[idx].quizScore}%`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}

                {/* Evaluación final en la lista */}
                <div className={`w-full p-3 rounded-lg border ${allModulesCompleted ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${existingCertificate ? 'bg-green-500 text-white' : 'bg-amber-400 text-white'}`}>
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">Evaluación Final</p>
                      <p className="text-xs text-slate-500">
                        {existingCertificate
                          ? `Aprobada · ${existingCertificate.score}%`
                          : allModulesCompleted
                          ? 'Disponible'
                          : 'Completa todos los módulos'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content - Slides */}
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-4xl">
            {/* Slide Content */}
            <Card className="p-8 mb-6 min-h-[500px]">
              {/* Slide Header */}
              <div className="flex items-center justify-between mb-6">
                <Badge variant="info">
                  {currentSlide?.type === 'summary' ? 'Resumen' : `Diapositiva ${currentSlideIndex + 1}`}
                </Badge>
                <span className="text-sm text-slate-500">
                  {currentSlideIndex + 1} / {totalSlides}
                </span>
              </div>

              {/* Slide Title */}
              <h2 className="text-2xl font-bold text-slate-900 mb-6">{currentSlide?.title}</h2>

              {/* Slide Content */}
              <div className="prose max-w-none">
                <div className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {currentSlide?.content}
                </div>
              </div>

              {/* Slide Type Indicator */}
              {currentSlide?.type === 'summary' && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Has completado la revisión de este módulo
                  </p>
                </div>
              )}
            </Card>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={prevSlide}
                disabled={currentModuleIndex === 0 && currentSlideIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              <div className="flex items-center gap-2">
                {currentModule?.slides?.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToSlide(idx)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      idx === currentSlideIndex
                        ? 'bg-blue-600'
                        : idx < currentSlideIndex
                        ? 'bg-green-500'
                        : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>

              {currentSlideIndex === totalSlides - 1 ? (
                <div className="flex items-center gap-2">
                  {currentModule?.quiz && !currentModuleCompleted && (
                    <Button onClick={() => setIsQuizOpen(true)}>
                      <FileText className="w-4 h-4" />
                      Hacer Quiz
                    </Button>
                  )}
                  {currentModuleCompleted && currentModuleIndex < totalModules - 1 && (
                    <Button onClick={goToNextModule}>
                      Siguiente Módulo
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                  {currentModuleCompleted && currentModuleIndex === totalModules - 1 && !existingCertificate && (
                    <Button onClick={() => setIsFinalEvalOpen(true)}>
                      <Award className="w-4 h-4" />
                      Evaluación Final
                    </Button>
                  )}
                  {!currentModule?.quiz && !currentModuleCompleted && currentModuleIndex < totalModules - 1 && (
                    <Button onClick={goToNextModule}>
                      Siguiente Módulo
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <Button onClick={nextSlide}>
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Quiz del módulo */}
      {isQuizOpen && currentModule?.quiz && (
        <QuizModal
          quiz={currentModule.quiz}
          onClose={() => setIsQuizOpen(false)}
          onComplete={handleQuizComplete}
        />
      )}

      {/* Evaluación final */}
      {isFinalEvalOpen && (
        <QuizModal
          quiz={buildFinalEvaluation()}
          onClose={() => setIsFinalEvalOpen(false)}
          onComplete={handleFinalEvalComplete}
        />
      )}

      {/* Certificado obtenido */}
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
  );
};

// Quiz Modal Component
interface QuizModalProps {
  quiz: Quiz;
  onClose: () => void;
  onComplete: (scorePct: number) => void;
}

const QuizModal: React.FC<QuizModalProps> = ({ quiz, onClose, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const question = quiz.questions[currentQuestion];
  const totalQuestions = quiz.questions.length;
  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
  const scorePct = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = scorePct >= (quiz.passingScore ?? 70);

  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
    setShowExplanation(true);

    if (index === question.correctAnswer) {
      setEarnedPoints(prev => prev + question.points);
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
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-8 text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
            {passed
              ? <CheckCircle className="w-10 h-10 text-green-600" />
              : <FileText className="w-10 h-10 text-red-500" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {passed ? '¡Aprobado!' : 'No aprobado'}
          </h2>
          <p className="text-slate-600 mb-1">Tu puntuación: <span className="font-bold">{scorePct}%</span></p>
          <p className="text-sm text-slate-500 mb-6">
            Puntuación mínima requerida: {quiz.passingScore ?? 70}%
          </p>
          <Button className="w-full" onClick={() => onComplete(scorePct)}>
            {passed ? 'Continuar' : 'Cerrar'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">{quiz.title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-sm text-slate-500">
              {currentQuestion + 1} / {totalQuestions}
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          <p className="text-lg font-medium text-slate-900 mb-6">
            {question.question}
          </p>

          <div className="space-y-3">
            {question.options.map((option: string, idx: number) => {
              let bgColor = 'bg-white hover:bg-slate-50';
              let borderColor = 'border-slate-200';

              if (showExplanation) {
                if (idx === question.correctAnswer) {
                  bgColor = 'bg-green-50 border-green-500';
                  borderColor = 'border-green-500';
                } else if (idx === selectedAnswer && idx !== question.correctAnswer) {
                  bgColor = 'bg-red-50 border-red-500';
                  borderColor = 'border-red-500';
                }
              } else if (selectedAnswer === idx) {
                bgColor = 'bg-blue-50 border-blue-500';
                borderColor = 'border-blue-500';
              }

              return (
                <button
                  key={idx}
                  onClick={() => !showExplanation && handleAnswerSelect(idx)}
                  disabled={showExplanation}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all ${bgColor} ${borderColor}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold ${
                      showExplanation && idx === question.correctAnswer
                        ? 'bg-green-500 text-white border-green-500'
                        : showExplanation && idx === selectedAnswer && idx !== question.correctAnswer
                        ? 'bg-red-500 text-white border-red-500'
                        : 'border-slate-300'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`mt-4 p-4 rounded-lg ${
              selectedAnswer === question.correctAnswer
                ? 'bg-green-50 text-green-700'
                : 'bg-yellow-50 text-yellow-700'
            }`}>
              <p className="font-medium mb-1">
                {selectedAnswer === question.correctAnswer ? '¡Correcto!' : 'Incorrecto'}
              </p>
              <p className="text-sm">{question.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end">
          <Button onClick={nextQuestion} disabled={!showExplanation}>
            {currentQuestion < totalQuestions - 1 ? 'Siguiente' : 'Ver Resultado'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
