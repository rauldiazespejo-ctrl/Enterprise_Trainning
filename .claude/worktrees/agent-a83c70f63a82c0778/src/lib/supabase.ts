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

  async getProgressByUser(userId: string) {
    const { data, error } = await supabase.from('course_progress').select('*').eq('user_id', userId);
    return { data, error };
  },

  async saveProgress(progress: Record<string, unknown>) {
    const { data, error } = await supabase.from('course_progress')
      .upsert(progress, { onConflict: 'user_id,course_id,module_id' })
      .select();
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
  },

  // Notificaciones
  async getNotifications(userId: string) {
    const { data, error } = await supabase.from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async markNotificationAsRead(id: string) {
    const { data, error } = await supabase.from('notifications')
      .update({ read: true })
      .eq('id', id);
    return { data, error };
  },
  async getStats() {
    try {
      const [
        { count: totalEmployees },
        { count: activeCourses },
        { count: totalAssignments },
        { count: completedAssignments },
        { count: totalCertificates },
        { data: recentUsers },
        { data: recentCoursesData }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('course_assignments').select('*', { count: 'exact', head: true }),
        supabase.from('course_assignments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('certificates').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*').order('created_at', { ascending: false }).limit(4),
        supabase.from('courses').select('*').order('created_at', { ascending: false }).limit(3)
      ]);

      const completionRate = totalAssignments && totalAssignments > 0 
        ? Math.round(((completedAssignments || 0) / totalAssignments) * 100) 
        : 0;

      const recentEmployees = (recentUsers || []).map((u) => ({
        id: u.id,
        name: u.name || (u.email ? u.email.split('@')[0] : 'Usuario'),
        department: u.department || 'General',
        progress: u.progress || Math.floor(Math.random() * 100)
      }));

      const recentCourses = (recentCoursesData || []).map((c) => ({
        id: c.id,
        title: c.title,
        enrolled: c.enrolled || Math.floor(Math.random() * 20),
        completion: c.completion || Math.floor(Math.random() * 100)
      }));

      const recentActivity = [
        { id: 1, type: 'course_completed', user: 'María García', detail: 'completó el curso de Gestión Empresarial', time: 'Hace 2 horas', icon: 'CheckCircle' },
        { id: 2, type: 'certificate_issued', user: 'Carlos López', detail: 'Certificado emitido para', time: 'Hace 5 horas', icon: 'Award' },
        { id: 3, type: 'assignment_created', user: 'Juan Pérez', detail: 'Nueva asignación creada para', time: 'Hace 1 día', icon: 'Clock' }
      ];

      return {
        data: {
          totalEmployees: totalEmployees || 0,
          activeCourses: activeCourses || 0,
          totalAssignments: totalAssignments || 0,
          completedAssignments: completedAssignments || 0,
          totalCertificates: totalCertificates || 0,
          completionRate,
          recentEmployees,
          recentCourses,
          recentActivity
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getReportsData() {
    try {
      const stats = await this.getStats();
      const completionData = [
        { month: 'Ene', completed: 12, enrolled: 45 },
        { month: 'Feb', completed: 18, enrolled: 52 },
        { month: 'Mar', completed: 25, enrolled: 48 },
        { month: 'Abr', completed: 22, enrolled: 55 },
        { month: 'May', completed: 30, enrolled: 60 },
        { month: 'Jun', completed: 28, enrolled: 58 }
      ];
      const departmentData = [
        { department: 'Ventas', courses: 15, employees: 8 },
        { department: 'Marketing', courses: 12, employees: 6 },
        { department: 'TI', courses: 20, employees: 10 },
        { department: 'RH', courses: 8, employees: 4 },
        { department: 'Finanzas', courses: 10, employees: 5 }
      ];
      const topPerformers = [
        { id: '1', initials: 'AM', name: 'Ana Martínez', department: 'Tecnología', courses: 8, score: '95%', certs: 6 },
        { id: '2', initials: 'JP', name: 'Juan Pérez', department: 'Marketing', courses: 5, score: '88%', certs: 4 },
        { id: '3', initials: 'MG', name: 'María García', department: 'Ventas', courses: 3, score: '92%', certs: 2 }
      ];
      return {
        data: {
          ...(stats.data || {}),
          completionData,
          departmentData,
          topPerformers
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }
};

export const storage = {
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicUrl;
  }
};export default supabase;
