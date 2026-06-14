// Contexto para gestión de cursos
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Course, Module, CourseAssignment, Certificate, CourseProgress } from '@/types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

interface CourseContextType {
  courses: Course[];
  assignments: CourseAssignment[];
  certificates: Certificate[];
  currentCourse: Course | null;
  currentModule: Module | null;
  progress: Record<string, CourseProgress[]>;

  // Cursos
  createCourse: (course: Partial<Course>) => Course;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  getCourse: (id: string) => Course | undefined;
  setCurrentCourse: (course: Course | null) => void;

  // Módulos
  addModule: (courseId: string, module: Partial<Module>) => Module;
  setCurrentModule: (module: Module | null) => void;

  // Asignaciones
  assignCourse: (courseId: string, userId: string, assignedBy: string, dueDate?: Date) => CourseAssignment;
  getUserAssignments: (userId: string) => CourseAssignment[];
  getAssignmentForCourse: (userId: string, courseId: string) => CourseAssignment | undefined;
  updateAssignmentProgress: (assignmentId: string, progress: number, completed?: boolean) => void;

  // Certificados
  issueCertificate: (courseId: string, userId: string, score: number) => Certificate;
  getUserCertificates: (userId: string) => Certificate[];
  verifyCertificate: (code: string) => Certificate | undefined;

  // Progreso
  saveModuleProgress: (userId: string, courseId: string, moduleId: string, completedSlides: string[]) => void;
  getModuleProgress: (userId: string, courseId: string, moduleId: string) => CourseProgress | undefined;
  saveQuizResult: (userId: string, courseId: string, moduleId: string, score: number, passed?: boolean) => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

// Cursos de demostración
const demoCourses: Course[] = [
  {
    id: 'course-001',
    title: 'Fundamentos de Gestión Empresarial',
    description: 'Aprende los conceptos básicos de administración y gestión de empresas.',
    thumbnail: '',
    createdBy: 'admin-001',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
    status: 'published',
    passingScore: 70,
    estimatedDuration: 120,
    category: 'Gestión',
    difficulty: 'beginner',
    modules: [
      {
        id: 'mod-001',
        courseId: 'course-001',
        title: 'Introducción a la Gestión',
        description: 'Conceptos fundamentales de la administración',
        order: 1,
        estimatedDuration: 30,
        slides: [
          { id: 'slide-001', moduleId: 'mod-001', title: '¿Qué es la Gestión?', content: 'La gestión es el proceso de planificar, organizar, dirigir y controlar los recursos de una organización.', order: 1, type: 'content' },
          { id: 'slide-002', moduleId: 'mod-001', title: 'Funciones del Gerente', content: 'Las cuatro funciones principales son: Planificación, Organización, Dirección y Control.', order: 2, type: 'content' },
          { id: 'slide-003', moduleId: 'mod-001', title: 'Resumen', content: 'La gestión empresarial es esencial para el éxito de cualquier organización.', order: 3, type: 'summary' }
        ],
        quiz: {
          id: 'quiz-001',
          moduleId: 'mod-001',
          title: 'Quiz: Introducción a la Gestión',
          passingScore: 70,
          timeLimit: 10,
          questions: [
            { id: 'q-001', quizId: 'quiz-001', question: '¿Cuál no es una función del gerente?', options: ['Planificación', 'Espionaje', 'Dirección', 'Control'], correctAnswer: 1, explanation: 'Espionaje no es una función de gestión', points: 20 },
            { id: 'q-002', quizId: 'quiz-001', question: 'La gestión implica:', options: ['Solo planificar', 'Administrar recursos', 'Ignorar empleados', 'Evitar cambios'], correctAnswer: 1, explanation: 'La gestión implica administrar recursos', points: 20 }
          ]
        }
      },
      {
        id: 'mod-002',
        courseId: 'course-001',
        title: 'Planificación Estratégica',
        description: 'Aprende a desarrollar planes estratégicos efectivos',
        order: 2,
        estimatedDuration: 30,
        slides: [
          { id: 'slide-004', moduleId: 'mod-002', title: '¿Qué es la Planificación?', content: 'La planificación es el proceso de establecer objetivos y determinar las acciones necesarias para alcanzarlos.', order: 1, type: 'content' },
          { id: 'slide-005', moduleId: 'mod-002', title: 'Tipos de Planificación', content: 'Existe planificación estratégica, táctica y operativa.', order: 2, type: 'content' },
          { id: 'slide-006', moduleId: 'mod-002', title: 'Resumen', content: 'La planificación es crucial para el éxito organizacional.', order: 3, type: 'summary' }
        ],
        quiz: {
          id: 'quiz-002',
          moduleId: 'mod-002',
          title: 'Quiz: Planificación Estratégica',
          passingScore: 70,
          timeLimit: 10,
          questions: [
            { id: 'q-003', quizId: 'quiz-002', question: 'La planificación estratégica se enfoca en:', options: ['Corto plazo', 'Largo plazo', 'Día a día', 'Pasado'], correctAnswer: 1, explanation: 'La planificación estratégica se enfoca en el largo plazo', points: 20 }
          ]
        }
      }
    ]
  },
  {
    id: 'course-002',
    title: 'Comunicación Efectiva en el Trabajo',
    description: 'Mejora tus habilidades de comunicación profesional.',
    thumbnail: '',
    createdBy: 'admin-001',
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
    status: 'published',
    passingScore: 70,
    estimatedDuration: 90,
    category: 'Habilidades Blandas',
    difficulty: 'beginner',
    modules: [
      {
        id: 'mod-003',
        courseId: 'course-002',
        title: 'Fundamentos de la Comunicación',
        description: 'Aprende los conceptos básicos de la comunicación efectiva',
        order: 1,
        estimatedDuration: 25,
        slides: [
          { id: 'slide-007', moduleId: 'mod-003', title: 'El Proceso Comunicativo', content: 'La comunicación implica emisor, mensaje, canal, receptor y retroalimentación.', order: 1, type: 'content' },
          { id: 'slide-008', moduleId: 'mod-003', title: 'Barreras de la Comunicación', content: 'Las barreras incluyen: ruido, falta de claridad, filtros, emociones.', order: 2, type: 'content' },
          { id: 'slide-009', moduleId: 'mod-003', title: 'Resumen', content: 'La comunicación efectiva requiere claridad y atención.', order: 3, type: 'summary' }
        ],
        quiz: {
          id: 'quiz-003',
          moduleId: 'mod-003',
          title: 'Quiz: Comunicación',
          passingScore: 70,
          timeLimit: 10,
          questions: [
            { id: 'q-004', quizId: 'quiz-003', question: '¿Cuál no es parte del proceso comunicativo?', options: ['Emisor', 'Receptor', 'Bloqueo', 'Mensaje'], correctAnswer: 2, explanation: 'Bloqueo no es un elemento del proceso', points: 20 }
          ]
        }
      }
    ]
  }
];

// Asignaciones de demostración
const demoAssignments: CourseAssignment[] = [
  {
    id: 'assign-001',
    courseId: 'course-001',
    userId: 'emp-001',
    assignedBy: 'admin-001',
    assignedAt: new Date('2026-03-01'),
    dueDate: new Date('2026-03-15'),
    status: 'in_progress',
    progress: 50
  },
  {
    id: 'assign-002',
    courseId: 'course-002',
    userId: 'emp-001',
    assignedBy: 'admin-001',
    assignedAt: new Date('2026-03-05'),
    dueDate: new Date('2026-03-20'),
    status: 'pending',
    progress: 0
  }
];

// Certificados de demostración
const demoCertificates: Certificate[] = [];

export const CourseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [courses, setCourses] = useState<Course[]>(() => loadFromStorage(STORAGE_KEYS.courses, demoCourses));
  const [assignments, setAssignments] = useState<CourseAssignment[]>(() => loadFromStorage(STORAGE_KEYS.assignments, demoAssignments));
  const [certificates, setCertificates] = useState<Certificate[]>(() => loadFromStorage(STORAGE_KEYS.certificates, demoCertificates));
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [progress, setProgress] = useState<Record<string, CourseProgress[]>>(() => loadFromStorage(STORAGE_KEYS.progress, {}));

  // Persistir todo el estado ante cualquier cambio
  useEffect(() => { saveToStorage(STORAGE_KEYS.courses, courses); }, [courses]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.assignments, assignments); }, [assignments]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.certificates, certificates); }, [certificates]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.progress, progress); }, [progress]);

  // Crear curso
  const createCourse = (courseData: Partial<Course>): Course => {
    const newCourse: Course = {
      id: uuidv4(),
      title: courseData.title || 'Nuevo Curso',
      description: courseData.description || '',
      thumbnail: courseData.thumbnail || '',
      createdBy: courseData.createdBy || 'admin-001',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: courseData.status || 'draft',
      passingScore: courseData.passingScore || 70,
      estimatedDuration: courseData.estimatedDuration || 60,
      category: courseData.category,
      difficulty: courseData.difficulty || 'beginner',
      modules: courseData.modules || []
    };

    setCourses(prev => [newCourse, ...prev]);
    return newCourse;
  };

  // Actualizar curso
  const updateCourse = (id: string, updates: Partial<Course>): void => {
    setCourses(prev =>
      prev.map(course =>
        course.id === id
          ? { ...course, ...updates, updatedAt: new Date() }
          : course
      )
    );

    if (currentCourse?.id === id) {
      setCurrentCourse(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  // Eliminar curso
  const deleteCourse = (id: string): void => {
    setCourses(prev => prev.filter(course => course.id !== id));
    if (currentCourse?.id === id) {
      setCurrentCourse(null);
    }
  };

  // Obtener curso
  const getCourse = (id: string): Course | undefined => {
    return courses.find(course => course.id === id);
  };

  // Agregar módulo
  const addModule = (courseId: string, moduleData: Partial<Module>): Module => {
    const newModule: Module = {
      id: uuidv4(),
      courseId,
      title: moduleData.title || 'Nuevo Módulo',
      description: moduleData.description || '',
      order: moduleData.order || 1,
      estimatedDuration: moduleData.estimatedDuration || 20,
      slides: moduleData.slides || [],
      quiz: moduleData.quiz
    };

    updateCourse(courseId, {
      modules: [...(getCourse(courseId)?.modules || []), newModule]
    });

    return newModule;
  };

  // Asignar curso
  const assignCourse = (courseId: string, userId: string, assignedBy: string, dueDate?: Date): CourseAssignment => {
    const newAssignment: CourseAssignment = {
      id: uuidv4(),
      courseId,
      userId,
      assignedBy,
      assignedAt: new Date(),
      dueDate,
      status: 'pending',
      progress: 0
    };

    setAssignments(prev => [newAssignment, ...prev]);
    return newAssignment;
  };

  // Obtener asignaciones de usuario
  const getUserAssignments = (userId: string): CourseAssignment[] => {
    return assignments.filter(a => a.userId === userId);
  };

  // Obtener la asignación de un usuario para un curso específico
  const getAssignmentForCourse = (userId: string, courseId: string): CourseAssignment | undefined => {
    return assignments.find(a => a.userId === userId && a.courseId === courseId);
  };

  // Actualizar progreso de asignación
  const updateAssignmentProgress = (assignmentId: string, progressValue: number, completed?: boolean): void => {
    setAssignments(prev =>
      prev.map(a =>
        a.id === assignmentId
          ? {
              ...a,
              progress: progressValue,
              status: completed ? 'completed' : 'in_progress',
              startedAt: a.startedAt || new Date(),
              completedAt: completed ? new Date() : undefined
            }
          : a
      )
    );
  };

  // Emitir certificado
  const issueCertificate = (courseId: string, userId: string, score: number): Certificate => {
    const certificate: Certificate = {
      id: uuidv4(),
      courseId,
      userId,
      issuedAt: new Date(),
      score,
      completedAt: new Date(),
      verificationCode: uuidv4().substring(0, 8).toUpperCase()
    };

    setCertificates(prev => [...prev, certificate]);
    return certificate;
  };

  // Obtener certificados de usuario
  const getUserCertificates = (userId: string): Certificate[] => {
    return certificates.filter(c => c.userId === userId);
  };

  // Verificar un certificado por su código
  const verifyCertificate = (code: string): Certificate | undefined => {
    const normalized = code.trim().toUpperCase();
    return certificates.find(c => c.verificationCode.toUpperCase() === normalized);
  };

  // Guardar progreso de módulo
  const saveModuleProgress = (userId: string, courseId: string, moduleId: string, completedSlides: string[]): void => {
    const key = `${userId}-${courseId}`;

    setProgress(prev => {
      const existing = prev[key] || [];
      const moduleProgress = existing.find(p => p.moduleId === moduleId);

      if (moduleProgress) {
        const merged = Array.from(new Set([...moduleProgress.completedSlides, ...completedSlides]));
        return {
          ...prev,
          [key]: existing.map(p => (p.moduleId === moduleId ? { ...p, completedSlides: merged } : p))
        };
      }

      return {
        ...prev,
        [key]: [...existing, { moduleId, completedSlides, completed: false }]
      };
    });
  };

  // Obtener progreso de módulo
  const getModuleProgress = (userId: string, courseId: string, moduleId: string): CourseProgress | undefined => {
    const key = `${userId}-${courseId}`;
    return progress[key]?.find(p => p.moduleId === moduleId);
  };

  // Guardar resultado de quiz (crea la entrada del módulo si aún no existe)
  const saveQuizResult = (userId: string, courseId: string, moduleId: string, score: number, passed?: boolean): void => {
    const key = `${userId}-${courseId}`;

    setProgress(prev => {
      const existing = prev[key] || [];
      const moduleProgress = existing.find(p => p.moduleId === moduleId);

      if (moduleProgress) {
        return {
          ...prev,
          [key]: existing.map(p =>
            p.moduleId === moduleId
              ? {
                  ...p,
                  quizScore: Math.max(score, p.quizScore || 0),
                  quizAttempts: (p.quizAttempts || 0) + 1,
                  completed: p.completed || !!passed
                }
              : p
          )
        };
      }

      return {
        ...prev,
        [key]: [
          ...existing,
          { moduleId, completedSlides: [], quizScore: score, quizAttempts: 1, completed: !!passed }
        ]
      };
    });
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        assignments,
        certificates,
        currentCourse,
        currentModule,
        progress,
        createCourse,
        updateCourse,
        deleteCourse,
        getCourse,
        setCurrentCourse,
        addModule,
        setCurrentModule,
        assignCourse,
        getUserAssignments,
        getAssignmentForCourse,
        updateAssignmentProgress,
        issueCertificate,
        getUserCertificates,
        verifyCertificate,
        saveModuleProgress,
        getModuleProgress,
        saveQuizResult
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourses = (): CourseContextType => {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;
};

export default CourseContext;