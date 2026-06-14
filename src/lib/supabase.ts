// Configuración de Supabase para la plataforma
// Esta configuración se puede actualizar cuando el usuario configure su base de datos

import { createClient } from '@supabase/supabase-js';

// Credenciales Supabase — proyecto Enterprise_Trainning (Soldesp S.A.)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan credenciales de Supabase en las variables de entorno. La aplicación puede no funcionar correctamente.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper para verificar conexión
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('users').select('count');
    return !error;
  } catch {
    return false;
  }
};

// Funciones de autenticación
export const auth = {
  async signUp(email: string, password: string, userData: { name: string; role: 'admin' | 'employee' }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
};

// Funciones de base de datos
export const db = {
  // Usuarios
  async getUsers() {
    const { data, error } = await supabase.from('users').select('*');
    return { data, error };
  },

  async getUserById(id: string) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    return { data, error };
  },

  async updateUser(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id);
    return { data, error };
  },

  // Cursos
  async getCourses() {
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    return { data, error };
  },

  async getCourseById(id: string) {
    const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();
    return { data, error };
  },

  async createCourse(course: Record<string, unknown>) {
    const { data, error } = await supabase.from('courses').insert(course).select().single();
    return { data, error };
  },

  async updateCourse(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase.from('courses').update(updates).eq('id', id);
    return { data, error };
  },

  async deleteCourse(id: string) {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    return { error };
  },

  async getCourseWithModules(id: string) {
    const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();
    return { data, error };
  },

  async getCoursesWithModules() {
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    return { data, error };
  },

  async upsertCourse(course: Record<string, unknown>) {
    const { data, error } = await supabase.from('courses').upsert(course).select().single();
    return { data, error };
  },

  // Módulos
  async getModulesByCourse(courseId: string) {
    const { data, error } = await supabase.from('modules').select('*').eq('course_id', courseId).order('order');
    return { data, error };
  },

  async createModule(module: Record<string, unknown>) {
    const { data, error } = await supabase.from('modules').insert(module).select().single();
    return { data, error };
  },

  // Diapositivas
  async getSlidesByModule(moduleId: string) {
    const { data, error } = await supabase.from('slides').select('*').eq('module_id', moduleId).order('order');
    return { data, error };
  },

  async createSlide(slide: Record<string, unknown>) {
    const { data, error } = await supabase.from('slides').insert(slide).select().single();
    return { data, error };
  },

  // Quizzes
  async getQuizByModule(moduleId: string) {
    const { data, error } = await supabase.from('quizzes').select('*').eq('module_id', moduleId).single();
    return { data, error };
  },

  async createQuiz(quiz: Record<string, unknown>) {
    const { data, error } = await supabase.from('quizzes').insert(quiz).select().single();
    return { data, error };
  },

  async getQuestionsByQuiz(quizId: string) {
    const { data, error } = await supabase.from('questions').select('*').eq('quiz_id', quizId);
    return { data, error };
  },

  async createQuestion(question: Record<string, unknown>) {
    const { data, error } = await supabase.from('questions').insert(question).select().single();
    return { data, error };
  },

  // Asignaciones
  async getAssignments() {
    const { data, error } = await supabase.from('course_assignments').select('*').order('assigned_at', { ascending: false });
    return { data, error };
  },

  async getAssignmentsByUser(userId: string) {
    const { data, error } = await supabase.from('course_assignments').select('*').eq('user_id', userId);
    return { data, error };
  },

  async createAssignment(assignment: Record<string, unknown>) {
    const { data, error } = await supabase.from('course_assignments').insert(assignment).select().single();
    return { data, error };
  },

  async updateAssignment(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase.from('course_assignments').update(updates).eq('id', id);
    return { data, error };
  },

  // Progreso
  async getProgress(userId: string, courseId: string) {
    const { data, error } = await supabase.from('course_progress').select('*')
      .eq('user_id', userId).eq('course_id', courseId);
    return { data, error };
  },

  async saveProgress(progress: Record<string, unknown>) {
    const { data, error } = await supabase.from('course_progress').upsert(progress).select();
    return { data, error };
  },

  // Certificados
  async getCertificates() {
    const { data, error } = await supabase.from('certificates').select('*').order('issued_at', { ascending: false });
    return { data, error };
  },

  async getCertificateByUser(userId: string) {
    const { data, error } = await supabase.from('certificates').select('*').eq('user_id', userId);
    return { data, error };
  },

  async createCertificate(certificate: Record<string, unknown>) {
    const { data, error } = await supabase.from('certificates').insert(certificate).select().single();
    return { data, error };
  },

  // Evaluaciones finales
  async getFinalEvaluation(courseId: string) {
    const { data, error } = await supabase.from('final_evaluations').select('*').eq('course_id', courseId).single();
    return { data, error };
  },

  async saveEvaluationResult(result: Record<string, unknown>) {
    const { data, error } = await supabase.from('evaluation_results').insert(result).select().single();
    return { data, error };
  }
};

export default supabase;