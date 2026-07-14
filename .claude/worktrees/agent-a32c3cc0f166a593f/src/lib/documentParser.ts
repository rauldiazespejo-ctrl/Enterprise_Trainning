// Motor de generación de cursos basado en documentos
// Simula la funcionalidad de Notebook LM para crear contenido educativo

import { GeneratedModule, GeneratedQuestion } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Parser de texto simple (para documentos PDF y texto)
export const parseDocument = async (file: File): Promise<string> => {
  const text = await extractTextFromFile(file);
  return text;
};

// Extraer texto de diferentes tipos de archivos
const extractTextFromFile = async (file: File): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'txt') {
    return await file.text();
  }

  if (extension === 'pdf') {
    return await extractTextFromPDF(file);
  }

  if (extension === 'docx' || extension === 'doc') {
    return await extractTextFromDOCX(file);
  }

  // Fallback para tipos desconocidos
  return await file.text();
};

// Extraer texto de archivos DOCX/DOC usando mammoth
const extractTextFromDOCX = async (file: File): Promise<string> => {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  if (!result.value || result.value.trim().length < 50) {
    throw new Error(
      'No se pudo extraer texto del archivo DOCX. Asegúrate de que el archivo no esté dañado o protegido.'
    );
  }
  return result.value;
};

// Extraer texto de PDFs usando pdf.js
const extractTextFromPDF = async (file: File): Promise<string> => {
  // Importar dinámicamente pdfjs-dist
  const pdfjsLib = await import('pdfjs-dist');

  // Configurar worker (empaquetado localmente por Vite, sin depender de CDN)
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText;
};

// Función principal: Generar curso completo desde documento
// NOTA: El generador básico fue eliminado porque producía contenido de baja calidad
// (preguntas genéricas, respuestas correctas siempre en posición 0, palabras al azar como opciones).
// Ahora se requiere configurar la IA (DeepSeek) para generar cursos.
export const generateCourseFromDocument = async (_file: File): Promise<{
  title: string;
  description: string;
  modules: GeneratedModule[];
  estimatedDuration: number;
}> => {
  throw new Error(
    'La generación automática requiere configurar la IA (DeepSeek). ' +
    'Ve a Configuración → Inteligencia Artificial e ingresa tu API key. ' +
    'Puedes obtener una en platform.deepseek.com'
  );
};

// Generar evaluación final del curso
export const generateFinalEvaluation = (modules: GeneratedModule[]): {
  title: string;
  questions: GeneratedQuestion[];
  passingScore: number;
  timeLimit: number;
} => {
  const allQuestions: GeneratedQuestion[] = [];

  // Recopilar preguntas de todos los módulos
  modules.forEach(module => {
    module.quiz.questions.forEach(q => {
      allQuestions.push(q);
    });
  });

  // Seleccionar preguntas aleatorias para la evaluación (máximo 20)
  const selectedQuestions = allQuestions
    .sort(() => Math.random() - 0.5)
    .slice(0, 20)
    .map(q => ({
      ...q,
      points: 5 // Reducir puntos para la evaluación final
    }));

  return {
    title: 'Evaluación Final',
    questions: selectedQuestions,
    passingScore: 70,
    timeLimit: 30
  };
};

// Generar certificado
export const generateCertificateData = (userName: string, courseName: string, score: number, date: Date) => {
  return {
    verificationCode: uuidv4(),
    userName,
    courseName,
    score,
    issuedAt: date,
    issuedBy: 'CapacitaPro',
    validUntil: new Date(date.getFullYear() + 1, date.getMonth(), date.getDate())
  };
};
