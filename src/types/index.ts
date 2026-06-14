// Tipos para la plataforma de capacitación CapacitaPro

export type UserRole = 'super_admin' | 'admin' | 'employee';

export interface User {
  id: string;
  rut?: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  position?: string;
  createdAt: Date;
  avatar?: string;
  password?: string;
  status?: 'active' | 'inactive';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  modules: Module[];
  passingScore: number;
  estimatedDuration: number; // en minutos
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  slides: Slide[];
  quiz?: Quiz;
  estimatedDuration: number;
}

export interface Slide {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  imageUrl?: string;
  order: number;
  type: 'content' | 'image' | 'video' | 'summary' | 'concept' | 'example' | 'tip';
  keyPoints?: string[];
  scenario?: string;
  outcome?: string;
  highlight?: string;
}

export interface Quiz {
  id: string;
  moduleId: string;
  title: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number; // en minutos
  maxAttempts?: number;
}

export interface Question {
  id: string;
  quizId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  points: number;
}

export interface FinalEvaluation {
  id: string;
  courseId: string;
  title: string;
  questions: Question[];
  passingScore: number;
  timeLimit: number;
  maxAttempts: number;
}

export interface Certificate {
  id: string;
  courseId: string;
  userId: string;
  issuedAt: Date;
  score: number;
  completedAt: Date;
  verificationCode: string;
}

export interface CourseAssignment {
  id: string;
  courseId: string;
  userId: string;
  assignedBy: string;
  assignedAt: Date;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
}

export interface CourseProgress {
  moduleId: string;
  completedSlides: string[];
  quizScore?: number;
  quizAttempts?: number;
  completed: boolean;
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'doc';
  url: string;
  uploadedAt: Date;
  parsed: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

// Tipos para generación de contenido
export interface GeneratedContent {
  modules: GeneratedModule[];
  quizzes: GeneratedQuiz[];
  estimatedDuration: number;
}

export interface GeneratedModule {
  title: string;
  description: string;
  slides: GeneratedSlide[];
  quiz: GeneratedQuiz;
}

export interface GeneratedSlide {
  title: string;
  content: string;
  type: 'content' | 'image' | 'summary' | 'concept' | 'example' | 'tip';
  imageUrl?: string;
  keyPoints?: string[];
  scenario?: string;
  outcome?: string;
  highlight?: string;
}

export interface GeneratedQuiz {
  title: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

// Estadísticas
export interface CourseStats {
  totalEnrollments: number;
  completedCount: number;
  averageScore: number;
  averageProgress: number;
}

export interface EmployeeStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalHours: number;
  averageScore: number;
}
