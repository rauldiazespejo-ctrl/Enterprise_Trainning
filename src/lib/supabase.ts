// Configuración de Supabase para la plataforma
// Esta configuración se puede actualizar cuando el usuario configure su base de datos

import { createClient } from '@supabase/supabase-js';

// Credenciales Supabase — proyecto Enterprise_Trainning (Soldesp S.A.)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan credenciales de Supabase en las variables de entorno.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

// Helper para verificar conexión
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('profiles').select('count');
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
    const { data, error } = await supabase.from('profiles').select('*');
    return { data, error };
  },

  async getUserById(id: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    return { data, error };
  },

  async updateUser(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', id);
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
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('course_assignments').select('*', { count: 'exact', head: true }),
        supabase.from('course_assignments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('certificates').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(4),
        supabase.from('courses').select('*').order('created_at', { ascending: false }).limit(3)
      ]);

      const completionRate = totalAssignments && totalAssignments > 0 
        ? Math.round(((completedAssignments || 0) / totalAssignments) * 100) 
        : 0;

      const recentEmployees = (recentUsers || []).map((u) => ({
        id: u.id,
        name: u.name || (u.email ? u.email.split('@')[0] : 'Usuario'),
        department: u.department || 'General',
        progress: u.progress || 0
      }));

      const recentCourses = (recentCoursesData || []).map((c) => ({
        id: c.id,
        title: c.title,
        enrolled: c.enrolled || 0,
        completion: c.completion || 0
      }));

      const recentActivity: any[] = [];

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
      return {
        data: {
          ...(stats.data || {}),
          completionData: [] as any[],
          departmentData: [] as any[],
          topPerformers: [] as any[]
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getPendingAssignments() {
    try {
      const { data: assignmentsRaw } = await supabase
        .from('course_assignments')
        .select('id, user_id, course_id, status, due_date')
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(10);

      if (!assignmentsRaw || assignmentsRaw.length === 0) return { data: [], error: null };

      const userIds = [...new Set(assignmentsRaw.map((a: any) => a.user_id))];
      const courseIds = [...new Set(assignmentsRaw.map((a: any) => a.course_id))];

      const [{ data: usersData }, { data: coursesData }] = await Promise.all([
        supabase.from('profiles').select('id, name').in('id', userIds),
        supabase.from('courses').select('id, title').in('id', courseIds)
      ]);

      const result = assignmentsRaw.map((a: any) => ({
        id: a.id,
        employeeName: (usersData as any[])?.find(u => u.id === a.user_id)?.name || 'Empleado',
        courseTitle: (coursesData as any[])?.find(c => c.id === a.course_id)?.title || 'Curso',
        dueDate: a.due_date as string | null,
        status: a.status as 'pending' | 'in_progress'
      }));

      return { data: result, error: null };
    } catch (error) {
      return { data: [], error };
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
