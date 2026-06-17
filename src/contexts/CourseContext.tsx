// Contexto para gestión de cursos
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Course, Module, CourseAssignment, Certificate, CourseProgress } from '@/types';
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '@/lib/storage';
import { db, supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

// ── Helper para audit log ISO 45001 ──────────────────────────────────────────
const logAuditEvent = async (
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> => {
  try {
    await supabase.functions.invoke('audit-log', {
      body: { action, resource_type: resourceType, resource_id: resourceId, details }
    });
  } catch (err) {
    console.warn('[Audit] Failed to log event:', err);
  }
};

const FALLBACK_ORG_ID = '00000000-0000-0000-0000-000000000001';
const FALLBACK_USER_ID = '00000000-0000-0000-0000-000000000001';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id: string) => UUID_REGEX.test(id);

interface CourseContextType {
  courses: Course[];
  assignments: CourseAssignment[];
  certificates: Certificate[];
  currentCourse: Course | null;
  currentModule: Module | null;
  progress: Record<string, CourseProgress[]>;

  // Cursos
  createCourse: (course: Partial<Course>) => Promise<Course>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  getCourse: (id: string) => Course | undefined;
  setCurrentCourse: (course: Course | null) => void;

  // Módulos
  addModule: (courseId: string, module: Partial<Module>) => Promise<Module>;
  setCurrentModule: (module: Module | null) => void;

  // Asignaciones
  assignCourse: (courseId: string, userId: string, assignedBy: string, dueDate?: Date) => Promise<CourseAssignment>;
  getUserAssignments: (userId: string) => CourseAssignment[];
  getAssignmentForCourse: (userId: string, courseId: string) => CourseAssignment | undefined;
  updateAssignmentProgress: (assignmentId: string, progress: number, completed?: boolean) => Promise<void>;

  // Certificados
  issueCertificate: (courseId: string, userId: string, score: number) => Promise<Certificate>;
  getUserCertificates: (userId: string) => Certificate[];
  verifyCertificate: (code: string) => Certificate | undefined;

  // Progreso
  saveModuleProgress: (userId: string, courseId: string, moduleId: string, completedSlides: string[]) => Promise<void>;
  getModuleProgress: (userId: string, courseId: string, moduleId: string) => CourseProgress | undefined;
  saveQuizResult: (userId: string, courseId: string, moduleId: string, score: number, passed?: boolean) => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helpers de mapping Supabase <-> TypeScript
// ---------------------------------------------------------------------------

function mapSupabaseToCourse(row: Record<string, unknown>): Course {
  const rawModules = (row.modules_data as any[]) || [];
  const realModules = rawModules.filter(m => !m.isFinalEvaluation && !m.isStudyGuide);
  const finalEvalModule = rawModules.find(m => m.isFinalEvaluation);
  const studyGuideModule = rawModules.find(m => m.isStudyGuide);

  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    thumbnail: '',
    createdBy: row.created_by as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    status: row.status as 'draft' | 'published' | 'archived',
    passingScore: row.passing_score as number,
    estimatedDuration: row.estimated_duration as number,
    category: row.category as string | undefined,
    difficulty: row.difficulty as 'beginner' | 'intermediate' | 'advanced' | undefined,
    modules: realModules as Module[],
    finalEvaluation: finalEvalModule ? finalEvalModule.quiz : undefined,
    studyGuide: studyGuideModule ? studyGuideModule.studyGuide : undefined,
    pptxUrl: (row.pptx_url as string) || undefined,
    sourceDocUrl: (row.source_doc_url as string) || undefined,
    sourceDocName: (row.source_doc_name as string) || undefined,
  };
}

function mapCourseToSupabase(
  course: Partial<Course>,
  organizationId?: string,
  createdBy?: string
): Record<string, unknown> {
  const modulesData = [...(course.modules || [])] as any[];
  if (course.finalEvaluation) {
    modulesData.push({
      id: 'final-evaluation',
      courseId: course.id || '',
      title: 'Evaluación Final',
      description: 'Evaluación Final',
      order: 9999,
      slides: [],
      quiz: course.finalEvaluation,
      estimatedDuration: 10,
      isFinalEvaluation: true
    });
  }
  
  if (course.studyGuide) {
    modulesData.push({
      id: 'study-guide',
      courseId: course.id || '',
      title: 'Guía de Estudio',
      description: 'Guía de Estudio',
      order: 10000,
      slides: [],
      studyGuide: course.studyGuide,
      estimatedDuration: 0,
      isStudyGuide: true
    });
  }

  return {
    ...(course.id && { id: course.id }),
    organization_id: organizationId || FALLBACK_ORG_ID,
    created_by: createdBy || course.createdBy || FALLBACK_USER_ID,
    title: course.title || 'Nuevo Curso',
    description: course.description || '',
    status: course.status || 'draft',
    passing_score: course.passingScore ?? 70,
    estimated_duration: course.estimatedDuration ?? 60,
    category: course.category || null,
    difficulty: course.difficulty || null,
    modules_data: modulesData,
    updated_at: new Date().toISOString(),
    ...(course.pptxUrl !== undefined && { pptx_url: course.pptxUrl }),
    ...(course.sourceDocUrl !== undefined && { source_doc_url: course.sourceDocUrl }),
    ...(course.sourceDocName !== undefined && { source_doc_name: course.sourceDocName }),
  };
}

function mapSupabaseToAssignment(row: Record<string, any>): CourseAssignment {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    assignedBy: row.assigned_by,
    assignedAt: new Date(row.assigned_at),
    dueDate: row.due_date ? new Date(row.due_date) : undefined,
    status: row.status,
    progress: row.progress,
    startedAt: row.started_at ? new Date(row.started_at) : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined
  };
}

function mapAssignmentToSupabase(a: CourseAssignment): Record<string, any> {
  return {
    id: a.id,
    course_id: a.courseId,
    user_id: a.userId,
    assigned_by: a.assignedBy,
    assigned_at: a.assignedAt.toISOString(),
    due_date: a.dueDate?.toISOString(),
    status: a.status,
    progress: a.progress,
    started_at: a.startedAt?.toISOString(),
    completed_at: a.completedAt?.toISOString()
  };
}

function mapSupabaseToCertificate(row: Record<string, any>): Certificate {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    issuedAt: new Date(row.issued_at),
    score: row.score,
    completedAt: new Date(row.issued_at), // In schema issued_at acts as completed_at
    verificationCode: row.verification_code
  };
}

function mapCertificateToSupabase(c: Certificate): Record<string, any> {
  return {
    id: c.id,
    course_id: c.courseId,
    user_id: c.userId,
    score: c.score,
    issued_at: c.issuedAt.toISOString(),
    verification_code: c.verificationCode
  };
}

// ---------------------------------------------------------------------------
// Cursos de demostración (usados cuando Supabase no está disponible)
// ---------------------------------------------------------------------------
// Certificados de demostración
const demoCertificates: Certificate[] = [];

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const CourseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>(() => loadFromStorage(STORAGE_KEYS.courses, []));
  const [assignments, setAssignments] = useState<CourseAssignment[]>(() => loadFromStorage(STORAGE_KEYS.assignments, []));
  const [certificates, setCertificates] = useState<Certificate[]>(() => loadFromStorage(STORAGE_KEYS.certificates, demoCertificates));
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [progress, setProgress] = useState<Record<string, CourseProgress[]>>(() => loadFromStorage(STORAGE_KEYS.progress, {}));

  // Carga inicial desde Supabase al montar el componente
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await db.getCoursesWithModules();
        if (error) throw error;
        const mapped = (data as Record<string, unknown>[] || []).map(mapSupabaseToCourse);
        if (mapped.length > 0) {
          setCourses(mapped);
        }
      } catch (err) {
        console.error('[CourseContext] No se pudo cargar cursos desde Supabase, usando localStorage como fallback.', err);
      }
    })();
  }, []);

  // Carga de datos específicos del usuario (asignaciones, progreso, certificados)
  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        // Cargar asignaciones
        const { data: assignData } = await db.getAssignmentsByUser(user.id);
        setAssignments((assignData || []).map(mapSupabaseToAssignment));

        // Cargar certificados
        const { data: certData } = await db.getCertificateByUser(user.id);
        if (certData && certData.length > 0) {
          setCertificates(certData.map(mapSupabaseToCertificate));
        }

        // Cargar progreso de módulos
        const { data: progData } = await db.getProgressByUser(user.id);
        if (progData && progData.length > 0) {
          const loadedProgress: Record<string, CourseProgress[]> = {};
          progData.forEach((p: any) => {
            const key = `${p.user_id}-${p.course_id}`;
            if (!loadedProgress[key]) loadedProgress[key] = [];
            loadedProgress[key].push({
              moduleId: p.module_id,
              completedSlides: p.completed_slides || [],
              quizScore: p.quiz_score,
              quizAttempts: p.quiz_attempts || 0,
              completed: p.completed || false
            });
          });
          setProgress(loadedProgress);
        }
      } catch (err) {
        console.warn('[CourseContext] Error cargando datos del usuario desde Supabase', err);
      }
    })();
  }, [user]);

  // Persistir en localStorage como cache / fallback offline
  useEffect(() => { saveToStorage(STORAGE_KEYS.courses, courses); }, [courses]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.assignments, assignments); }, [assignments]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.certificates, certificates); }, [certificates]);
  useEffect(() => { saveToStorage(STORAGE_KEYS.progress, progress); }, [progress]);

  // ---------------------------------------------------------------------------
  // beforeunload — flush pending progress to Supabase
  // ---------------------------------------------------------------------------
  const progressRef = useRef(progress);
  const assignmentsRef = useRef(assignments);
  const userRef = useRef(user);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { assignmentsRef.current = assignments; }, [assignments]);
  useEffect(() => { userRef.current = user; }, [user]);

  const flushProgressOnUnload = useCallback(() => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const currentProgress = progressRef.current;
    const rows: Record<string, unknown>[] = [];

    for (const [key, modules] of Object.entries(currentProgress)) {
      const [userId, courseId] = key.split('-', 2);
      if (userId !== currentUser.id) continue;
      for (const mod of modules) {
        rows.push({
          user_id: userId,
          course_id: courseId,
          module_id: mod.moduleId,
          completed_slides: mod.completedSlides,
          completed: mod.completed,
          quiz_score: mod.quizScore,
          quiz_attempts: mod.quizAttempts || 0,
          updated_at: new Date().toISOString()
        });
      }
    }

    if (rows.length === 0) return;

    const url = `${supabaseUrl}/rest/v1/course_progress`;
    const body = JSON.stringify(rows);
    const headers = {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'resolution=merge-duplicates'
    };

    const endpoint = `${url}?on_conflict=user_id,course_id,module_id`;

    // sendBeacon cannot send custom headers, so we use sync XHR as the
    // primary strategy (runs in the beforeunload handler, blocking is OK).
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, false);
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      xhr.send(body);
      return;
    } catch {
      // sync XHR failed — fall through to sendBeacon as last resort
    }

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('beforeunload', flushProgressOnUnload);
    return () => window.removeEventListener('beforeunload', flushProgressOnUnload);
  }, [flushProgressOnUnload]);

  // ---------------------------------------------------------------------------
  // Cursos
  // ---------------------------------------------------------------------------

  const createCourse = async (courseData: Partial<Course>): Promise<Course> => {
    const newId = uuidv4();
    const newCourse: Course = {
      id: newId,
      title: courseData.title || 'Nuevo Curso',
      description: courseData.description || '',
      thumbnail: courseData.thumbnail || '',
      createdBy: courseData.createdBy || user?.id || FALLBACK_USER_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: courseData.status || 'draft',
      passingScore: courseData.passingScore ?? 70,
      estimatedDuration: courseData.estimatedDuration ?? 60,
      category: courseData.category,
      difficulty: courseData.difficulty || 'beginner',
      modules: courseData.modules || []
    };

    // Intentar persistir en Supabase primero
    try {
      const row = mapCourseToSupabase(newCourse, user?.organizationId, user?.id);
      const { data, error } = await db.upsertCourse(row);
      if (error) throw error;
      if (data) {
        const saved = mapSupabaseToCourse(data as Record<string, unknown>);
        setCourses(prev => [saved, ...prev]);
        // Audit log: curso creado
        void logAuditEvent('create_course', 'course', saved.id, { title: saved.title });
        return saved;
      }
    } catch (err) {
      console.error('[CourseContext] Error al crear curso en Supabase, guardando solo en localStorage.', err);
    }

    // Fallback: guardar solo en estado local (localStorage via useEffect)
    setCourses(prev => [newCourse, ...prev]);
    return newCourse;
  };

  const updateCourse = async (id: string, updates: Partial<Course>): Promise<void> => {
    // Actualizar estado local inmediatamente para UI responsiva
    setCourses(prev =>
      prev.map(course =>
        course.id === id ? { ...course, ...updates, updatedAt: new Date() } : course
      )
    );

    if (currentCourse?.id === id) {
      setCurrentCourse(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }

    if (!isValidUUID(id)) return; // Curso demo/local — no existe en Supabase

    try {
      const existing = courses.find(c => c.id === id);
      const merged = existing ? { ...existing, ...updates } : updates;
      const row = mapCourseToSupabase({ ...merged, id }, user?.organizationId, user?.id);
      const { error } = await db.upsertCourse(row);
      if (error) throw error;
      // Audit log: curso actualizado
      void logAuditEvent('update_course', 'course', id, { updates: Object.keys(updates) });
    } catch (err) {
      console.warn('[CourseContext] Error al actualizar curso en Supabase.', err);
    }
  };

  const deleteCourse = async (id: string): Promise<void> => {
    const deletedCourse = courses.find(c => c.id === id);
    setCourses(prev => prev.filter(course => course.id !== id));
    if (currentCourse?.id === id) setCurrentCourse(null);

    if (!isValidUUID(id)) return; // Curso demo/local — no existe en Supabase

    try {
      const { error } = await db.deleteCourse(id);
      if (error) throw error;
      // Audit log: curso eliminado
      void logAuditEvent('delete_course', 'course', id, { title: deletedCourse?.title });
    } catch (err) {
      console.warn('[CourseContext] Error al eliminar curso en Supabase.', err);
    }
  };

  const getCourse = (id: string): Course | undefined => {
    return courses.find(course => course.id === id);
  };

  // ---------------------------------------------------------------------------
  // Módulos
  // ---------------------------------------------------------------------------

  const addModule = async (courseId: string, moduleData: Partial<Module>): Promise<Module> => {
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

    await updateCourse(courseId, {
      modules: [...(getCourse(courseId)?.modules || []), newModule]
    });

    return newModule;
  };

  // ---------------------------------------------------------------------------
  // Asignaciones
  // ---------------------------------------------------------------------------

  const assignCourse = async (courseId: string, userId: string, assignedBy: string, dueDate?: Date): Promise<CourseAssignment> => {
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

    // Actualización optimista
    setAssignments(prev => [newAssignment, ...prev]);

    // Persistir
    try {
      const { error } = await db.createAssignment(mapAssignmentToSupabase(newAssignment));
      if (error) throw error;
    } catch (err) {
      console.warn('[CourseContext] Error asignando curso en Supabase', err);
    }

    return newAssignment;
  };

  const getUserAssignments = (userId: string): CourseAssignment[] => {
    return assignments.filter(a => a.userId === userId);
  };

  const getAssignmentForCourse = (userId: string, courseId: string): CourseAssignment | undefined => {
    return assignments.find(a => a.userId === userId && a.courseId === courseId);
  };

  const updateAssignmentProgress = async (assignmentId: string, progressValue: number, completed?: boolean): Promise<void> => {
    const previousAssignment: CourseAssignment | undefined = assignments.find(a => a.id === assignmentId);

    // Optimistic UI update
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

    // Get the updated assignment to send to db
    const assignment = previousAssignment;
    if (!assignment) return;
    
    try {
      const { error } = await db.updateAssignment(assignmentId, {
        progress: progressValue,
        status: completed ? 'completed' : 'in_progress',
        started_at: (assignment.startedAt || new Date()).toISOString(),
        completed_at: completed ? new Date().toISOString() : null
      });
      if (error) throw error;
    } catch (err) {
      console.warn('[CourseContext] Error actualizando progreso de asignación en Supabase - rollback', err);
      // Rollback to previous state
      if (previousAssignment) {
        setAssignments(prev => prev.map(a => a.id === assignmentId ? previousAssignment! : a));
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Certificados
  // ---------------------------------------------------------------------------

  const issueCertificate = async (courseId: string, userId: string, score: number): Promise<Certificate> => {
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

    try {
      const { error } = await db.createCertificate(mapCertificateToSupabase(certificate));
      if (error) throw error;
    } catch (err) {
      console.warn('[CourseContext] Error creando certificado en Supabase', err);
    }

    return certificate;
  };

  const getUserCertificates = (userId: string): Certificate[] => {
    return certificates.filter(c => c.userId === userId);
  };

  const verifyCertificate = (code: string): Certificate | undefined => {
    const normalized = code.trim().toUpperCase();
    return certificates.find(c => c.verificationCode.toUpperCase() === normalized);
  };

  // ---------------------------------------------------------------------------
  // Progreso
  // ---------------------------------------------------------------------------

  const saveModuleProgress = async (userId: string, courseId: string, moduleId: string, completedSlides: string[]): Promise<void> => {
    const key = `${userId}-${courseId}`;

    let updatedSlides = completedSlides;
    let isCompleted = false;
    let quizScore = undefined;
    const previousProgress: CourseProgress[] | undefined = progress[key];

    // Optimistic UI update
    setProgress(prev => {
      const existing = prev[key] || [];
      const moduleProgress = existing.find(p => p.moduleId === moduleId);

      if (moduleProgress) {
        const merged = Array.from(new Set([...moduleProgress.completedSlides, ...completedSlides]));
        updatedSlides = merged;
        isCompleted = moduleProgress.completed;
        quizScore = moduleProgress.quizScore;
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

    // Supabase persist with rollback on error
    try {
      const { error } = await db.saveProgress({
        user_id: userId,
        course_id: courseId,
        module_id: moduleId,
        completed_slides: updatedSlides,
        completed: isCompleted,
        quiz_score: quizScore,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    } catch (err) {
      console.warn('[CourseContext] Error guardando progreso de modulo en Supabase - rollback', err);
      // Rollback to previous state
      setProgress(prev => ({
        ...prev,
        [key]: previousProgress || prev[key]?.filter(p => p.moduleId !== moduleId) || []
      }));
    }
  };

  const getModuleProgress = (userId: string, courseId: string, moduleId: string): CourseProgress | undefined => {
    const key = `${userId}-${courseId}`;
    return progress[key]?.find(p => p.moduleId === moduleId);
  };

  const saveQuizResult = async (userId: string, courseId: string, moduleId: string, score: number, passed?: boolean): Promise<void> => {
    const key = `${userId}-${courseId}`;

    let updatedSlides: string[] = [];
    let attempts = 1;
    const previousProgress: CourseProgress[] | undefined = progress[key];

    // Optimistic update
    setProgress(prev => {
      const existing = prev[key] || [];
      const moduleProgress = existing.find(p => p.moduleId === moduleId);

      if (moduleProgress) {
        updatedSlides = moduleProgress.completedSlides;
        attempts = (moduleProgress.quizAttempts || 0) + 1;
        return {
          ...prev,
          [key]: existing.map(p =>
            p.moduleId === moduleId
              ? { ...p, quizScore: Math.max(score, p.quizScore || 0), quizAttempts: attempts, completed: passed !== undefined ? passed : p.completed }
              : p
          )
        };
      }

      return {
        ...prev,
        [key]: [
          ...existing,
          { moduleId, completedSlides: [], quizScore: score, quizAttempts: attempts, completed: !!passed }
        ]
      };
    });

    // Supabase persist with rollback on error
    try {
      const { error } = await db.saveProgress({
        user_id: userId,
        course_id: courseId,
        module_id: moduleId,
        completed_slides: updatedSlides,
        completed: passed || false,
        quiz_score: score,
        quiz_attempts: attempts,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
    } catch (err) {
      console.warn('[CourseContext] Error guardando resultado de quiz en Supabase - rollback', err);
      // Rollback to previous state
      setProgress(prev => ({
        ...prev,
        [key]: previousProgress || prev[key]?.filter(p => p.moduleId !== moduleId) || []
      }));
    }
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
