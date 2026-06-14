import { GeneratedModule } from '@/types';
import { supabase } from '@/lib/supabase';

// Límite de texto enviado a la API para no exceder el contexto del modelo
const MAX_DOCUMENT_CHARS = 60000;

export interface AIGeneratedCourse {
  title: string;
  description: string;
  modules: GeneratedModule[];
  estimatedDuration: number;
}

export const isAIConfigured = (): boolean =>
  Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

// Llama a DeepSeek y devuelve el curso generado
export const generateCourseWithAI = async (
  documentText: string,
  onStatus?: (status: string) => void
): Promise<AIGeneratedCourse> => {
  if (!isAIConfigured()) {
    throw new Error('La generación con IA requiere configurar Supabase.');
  }

  const text = documentText.slice(0, MAX_DOCUMENT_CHARS);

  onStatus?.('Analizando documento con DeepSeek AI...');

  const { data, error } = await supabase.functions.invoke('generate-course', {
    body: { documentText: text }
  });
  if (error) throw new Error(`No se pudo generar el curso: ${error.message}`);

  const content: string | undefined = data?.content;
  if (!content) {
    throw new Error('La API de DeepSeek devolvió una respuesta vacía.');
  }

  onStatus?.('Construyendo estructura del curso...');

  const parsed = parseAIResponse(content);
  return {
    ...parsed,
    estimatedDuration: parsed.modules.length * 15
  };
};

const VALID_SLIDE_TYPES = ['concept', 'example', 'tip', 'content', 'summary', 'image'] as const;
type SlideType = typeof VALID_SLIDE_TYPES[number];

// Valida y normaliza el JSON devuelto por el modelo
const parseAIResponse = (content: string): Omit<AIGeneratedCourse, 'estimatedDuration'> => {
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    // Algunos modelos envuelven el JSON en bloques de código
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('La IA no devolvió un JSON válido.');
    raw = JSON.parse(match[0]);
  }

  const course = raw as Record<string, unknown>;
  const modulesRaw = Array.isArray(course.modules) ? course.modules : [];

  if (!course.title || modulesRaw.length === 0) {
    throw new Error('El curso generado por la IA está incompleto. Intenta de nuevo.');
  }

  const modules: GeneratedModule[] = modulesRaw.map((m: any, idx: number) => {
    const mod = m as Record<string, unknown>;
    const slides = (Array.isArray(mod.slides) ? mod.slides as any[] : [])
      .filter((s: any) => s?.title && (s?.content || s?.keyPoints))
      .map((s: any) => {
        const type: SlideType = VALID_SLIDE_TYPES.includes(s.type) ? s.type as SlideType : 'content';
        return {
          title: String(s.title),
          content: String(s.content || ''),
          type,
          keyPoints: Array.isArray(s.keyPoints) ? s.keyPoints.map(String) : undefined,
          scenario: s.scenario ? String(s.scenario) : undefined,
          outcome: s.outcome ? String(s.outcome) : undefined,
          highlight: s.highlight ? String(s.highlight) : undefined,
        };
      });

    const quizRaw = mod.quiz as Record<string, any> | undefined;
    const questions = (Array.isArray(quizRaw?.questions) ? quizRaw!.questions as any[] : [])
      .filter((q: any) => q?.question && Array.isArray(q?.options) && q.options.length >= 2)
      .map((q: any) => ({
        question: String(q.question),
        options: (q.options as unknown[]).slice(0, 4).map(String),
        correctAnswer: Math.min(
          Math.max(Number(q.correctAnswer) || 0, 0),
          Math.min((q.options as unknown[]).length, 4) - 1
        ),
        explanation: String(q.explanation || ''),
        points: Number(q.points) || 10
      }));

    return {
      title: String(mod.title || `Módulo ${idx + 1}`),
      description: String(mod.description || ''),
      slides,
      quiz: {
        title: String(quizRaw?.title || `Quiz: Módulo ${idx + 1}`),
        questions
      }
    };
  }).filter(m => m.slides.length > 0);

  if (modules.length === 0) {
    throw new Error('La IA no generó módulos con contenido. Intenta de nuevo.');
  }

  return {
    title: String(course.title),
    description: String(course.description || ''),
    modules
  };
};

// Prueba la conexión con la API de DeepSeek
export const testDeepSeekConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.functions.invoke('generate-course', {
      body: { healthcheck: true }
    });
    return error ? { success: false, error: error.message } : { success: true };
  } catch {
    return { success: false, error: 'No se pudo conectar con la función segura de IA.' };
  }
};
