// Motor de generación de cursos basado en documentos
// Simula la funcionalidad de Notebook LM para crear contenido educativo

import { GeneratedContent, GeneratedModule, GeneratedSlide, GeneratedQuiz, GeneratedQuestion } from '@/types';
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

  // Para otros tipos, intentar leer como texto
  return await file.text();
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

// Dividir texto en secciones
const splitIntoSections = (text: string, numSections: number = 5): string[] => {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 50);
  const sectionSize = Math.ceil(paragraphs.length / numSections);

  const sections: string[] = [];
  for (let i = 0; i < paragraphs.length; i += sectionSize) {
    sections.push(paragraphs.slice(i, i + sectionSize).join('\n\n'));
  }

  return sections;
};

// Extraer palabras clave del texto
const extractKeywords = (text: string): string[] => {
  const words = text.toLowerCase().match(/\b[a-záéíóúñ]{4,}\b/g) || [];
  const frequency: Record<string, number> = {};

  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
};

// Generar título del curso basado en contenido
const generateCourseTitle = (text: string): string => {
  const keywords = extractKeywords(text);
  const mainTopic = keywords[0] || 'Curso';

  const titles = [
    `Fundamentos de ${mainTopic.charAt(0).toUpperCase() + mainTopic.slice(1)}`,
    `Masterclass en ${mainTopic.charAt(0).toUpperCase() + mainTopic.slice(1)}`,
    `${mainTopic.charAt(0).toUpperCase() + mainTopic.slice(1)}: Guía Completa`,
    `Domina ${mainTopic.charAt(0).toUpperCase() + mainTopic.slice(1)}`,
    `${mainTopic.charAt(0).toUpperCase() + mainTopic.slice(1)} para Profesionales`
  ];

  return titles[Math.floor(Math.random() * titles.length)];
};

// Generar descripción del curso
const generateCourseDescription = (text: string): string => {
  const keywords = extractKeywords(text).slice(0, 5).join(', ');
  return `Este curso integral cubre los aspectos fundamentales y avanzados de ${keywords}. Diseñado para proporcionar conocimientos prácticos y teóricos que te permitirá dominar estos conceptos.`;
};

// Generar módulo completo
const generateModule = (sectionText: string, index: number, totalModules: number): GeneratedModule => {
  const sentences = sectionText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const moduleTitle = sentences[0]?.trim().substring(0, 80) || `Módulo ${index + 1}`;

  // Generar diapositivas
  const slides = generateSlidesFromText(sectionText, index);

  // Generar quiz para el módulo
  const quiz = generateQuizFromText(sectionText, index);

  return {
    title: `Módulo ${index + 1}: ${moduleTitle}`,
    description: `En este módulo aprenderás conceptos clave sobre ${moduleTitle.toLowerCase()}.`,
    slides,
    quiz
  };
};

// Generar diapositivas a partir del texto
const generateSlidesFromText = (text: string, moduleIndex: number): GeneratedSlide[] => {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 30);
  const slides: GeneratedSlide[] = [];

  // Slide de introducción del módulo
  slides.push({
    title: `Introducción al Módulo ${moduleIndex + 1}`,
    content: 'En este módulo exploraremos los conceptos fundamentales que necesitas conocer.',
    type: 'content'
  });

  // Slides de contenido
  paragraphs.slice(0, 5).forEach((paragraph, idx) => {
    slides.push({
      title: `Concepto ${idx + 1}`,
      content: paragraph.trim(),
      type: 'content'
    });
  });

  // Slide de resumen
  slides.push({
    title: 'Resumen del Módulo',
    content: `En este módulo hemos cubierto:\n• Conceptos fundamentales\n• Aplicaciones prácticas\n• Ejemplos y casos de uso\n\nContinúa al quiz para reforzar tu aprendizaje.`,
    type: 'summary'
  });

  return slides;
};

// Generar quiz a partir del texto
const generateQuizFromText = (text: string, moduleIndex: number): GeneratedQuiz => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 40);
  const questions: GeneratedQuestion[] = [];

  // Generar 4-5 preguntas basadas en el contenido
  const numQuestions = Math.min(5, sentences.length);

  for (let i = 0; i < numQuestions; i++) {
    const sentence = sentences[i % sentences.length];
    const words = sentence.split(' ').filter(w => w.length > 3);

    // Crear pregunta de opción múltiple
    const question = generateQuestionFromSentence(sentence, words, i);
    if (question) {
      questions.push(question);
    }
  }

  return {
    title: `Quiz del Módulo ${moduleIndex + 1}`,
    questions
  };
};

// Generar una pregunta individual
const generateQuestionFromSentence = (sentence: string, words: string[], index: number): GeneratedQuestion | null => {
  if (words.length < 4) return null;

  // Seleccionar palabras clave para las opciones
  const keyWord = words[Math.floor(words.length / 2)] || words[0];
  const otherWords = words.filter(w => w !== keyWord).slice(0, 3);

  // Crear opciones (una correcta y tres incorrectas plausibles)
  const correctAnswer = Math.floor(Math.random() * 4);
  const options = [
    keyWord,
    otherWords[0] || 'Ninguna opción anterior',
    otherWords[1] || 'Otra alternativa',
    otherWords[2] || 'Ninguna de las anteriores'
  ].slice(0, 4);

  // Mezclar opciones si es necesario
  if (correctAnswer !== 0) {
    const temp = options[0];
    options[0] = options[correctAnswer];
    options[correctAnswer] = temp;
  }

  return {
    question: `Según el contenido del módulo, ¿cuál es el concepto principal descrito en esta sección?`,
    options: options.map(o => o.charAt(0).toUpperCase() + o.slice(1)),
    correctAnswer: 0,
    explanation: sentence.substring(0, 100) + '...',
    points: 20
  };
};

// Función principal: Generar curso completo desde documento
export const generateCourseFromDocument = async (file: File): Promise<{
  title: string;
  description: string;
  modules: GeneratedModule[];
  estimatedDuration: number;
}> => {
  // Parsear documento
  const text = await parseDocument(file);

  // Validar que hay contenido suficiente
  if (text.length < 200) {
    throw new Error('El documento no contiene suficiente texto para generar un curso.');
  }

  // Dividir en secciones
  const sections = splitIntoSections(text, 4); // 4 módulos por defecto
  const keywords = extractKeywords(text);

  // Generar título y descripción
  const title = generateCourseTitle(text);
  const description = generateCourseDescription(text);

  // Generar módulos
  const modules = sections.map((section, index) => generateModule(section, index, sections.length));

  // Calcular duración estimada (promedio de 15 minutos por módulo)
  const estimatedDuration = modules.length * 15;

  return {
    title,
    description,
    modules,
    estimatedDuration
  };
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