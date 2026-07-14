import { GeneratedModule } from '@/types';
import { supabase } from '@/lib/supabase';

// Límite de texto enviado a la API para no exceder el contexto del modelo
const MAX_DOCUMENT_CHARS = 500000;
const CHUNK_FIRST = 250000;
const CHUNK_LAST = 250000;

export interface CourseGenerationConfig {
  numModules?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
}

export interface AIGeneratedCourse {
  title: string;
  description: string;
  modules: GeneratedModule[];
  estimatedDuration: number;
  wasTruncated?: boolean;
}

export const isAIConfigured = (): boolean =>
  Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

/**
 * Recorta documentos largos tomando el inicio y el final,
 * preservando la introducción y las conclusiones.
 */
const smartTruncate = (text: string): { text: string; truncated: boolean } => {
  if (text.length <= MAX_DOCUMENT_CHARS) {
    return { text, truncated: false };
  }
  const first = text.slice(0, CHUNK_FIRST);
  const last = text.slice(-CHUNK_LAST);
  return {
    text: `${first}\n\n[...fragmento central omitido por longitud...]\n\n${last}`,
    truncated: true,
  };
};

// Llama a DeepSeek y devuelve el curso generado
export const generateCourseWithAI = async (
  documentText: string,
  onStatus?: (status: string) => void,
  config?: CourseGenerationConfig
): Promise<AIGeneratedCourse> => {
  if (!isAIConfigured()) {
    throw new Error('La generación con IA requiere configurar Supabase.');
  }

  const { text, truncated } = smartTruncate(documentText);

  if (truncated) {
    onStatus?.(
      'Documento extenso: usando los fragmentos más relevantes (inicio y final del documento)'
    );
  }

  onStatus?.('Analizando documento con DeepSeek AI...');

  const { data, error } = await supabase.functions.invoke('generate-course', {
    body: {
      documentText: text,
      numModules: config?.numModules,
      difficulty: config?.difficulty,
      category: config?.category,
    },
  });
  if (error) {
    // FunctionsHttpError.context contiene el body real de la respuesta
    const ctx = (error as unknown as { context?: unknown }).context;
    let realMsg = error.message;
    if (ctx !== null && ctx !== undefined) {
      if (typeof ctx === 'string') {
        try { realMsg = (JSON.parse(ctx) as { error?: string }).error ?? ctx; } catch { realMsg = ctx; }
      } else if (typeof ctx === 'object' && (ctx as Record<string, unknown>).error) {
        realMsg = String((ctx as Record<string, unknown>).error);
      }
    }
    throw new Error(`No se pudo generar el curso: ${realMsg}`);
  }

  const content: string | undefined = data?.content;
  if (!content) {
    throw new Error('La API de DeepSeek devolvió una respuesta vacía.');
  }

  onStatus?.('Construyendo estructura del curso...');

  const parsed = parseAIResponse(content);
  return {
    ...parsed,
    estimatedDuration: (config?.numModules ?? parsed.modules.length) * 15,
    wasTruncated: truncated,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modules: GeneratedModule[] = modulesRaw.map((m: any, idx: number) => {
    const mod = m as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slides = (Array.isArray(mod.slides) ? mod.slides as any[] : [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((s: any) => s?.title && (s?.content || s?.keyPoints))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((s: any) => {
        const type: SlideType = VALID_SLIDE_TYPES.includes(s.type) ? s.type as SlideType : 'content';
        let imageUrl = s.imageUrl ? String(s.imageUrl) : undefined;
        if (type === 'image' && !imageUrl) {
          imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(s.title)}`;
        }
        return {
          title: String(s.title),
          content: String(s.content || ''),
          type,
          imageUrl,
          keyPoints: Array.isArray(s.keyPoints) ? s.keyPoints.map(String) : undefined,
          scenario: s.scenario ? String(s.scenario) : undefined,
          outcome: s.outcome ? String(s.outcome) : undefined,
          highlight: s.highlight ? String(s.highlight) : undefined,
        };
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quizRaw = mod.quiz as Record<string, any> | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const questions = (Array.isArray(quizRaw?.questions) ? quizRaw!.questions as any[] : [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((q: any) => q?.question && Array.isArray(q?.options) && q.options.length >= 2)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export interface QuestionsGenerationConfig {
  difficulty: string;
  category: string;
}

// Stub — will be implemented by the AI question-generation agent
export const generateQuestionsWithAI = async (
  _text: string,
  _numQuestions: number,
  _config: QuestionsGenerationConfig
): Promise<import('@/types').GeneratedQuestion[]> => {
  throw new Error('generateQuestionsWithAI not yet implemented');
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
