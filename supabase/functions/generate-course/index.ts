import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const DEFAULT_ALLOWED_ORIGINS = 'http://localhost:5173,http://localhost:3000,https://capacita-pro.vercel.app';

const getAllowedOrigins = (): string[] => {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');
  return envOrigins ? envOrigins.split(',').map(o => o.trim()) : DEFAULT_ALLOWED_ORIGINS.split(',');
};

const isOriginAllowed = (origin: string | null): boolean => {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
};

const buildCorsHeaders = (origin: string | null): Record<string, string> => {
  const allowedOrigin = isOriginAllowed(origin) ? origin : '';
  return {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

// ─── Rate Limiter: 10 req/min per IP ─────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

const checkRateLimit = (clientIp: string): { allowed: boolean; remaining: number; resetIn: number } => {
  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT - 1, resetIn: RATE_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetIn: entry.resetAt - now };
};

const getClientIp = (request: Request): string => {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('cf-connecting-ip') ||
         'unknown';
};

// ─── System prompt: full course generation ────────────────────────────────────

const buildCourseSystemPrompt = (numModules: number, difficulty: string, category: string): string => {
  const difficultyInstruction =
    difficulty === 'beginner'
      ? 'Usa lenguaje simple y accesible, sin jerga técnica. Explica todos los conceptos desde cero.'
      : difficulty === 'advanced'
      ? 'El contenido debe ser profundo y técnico. Asume que el participante ya tiene experiencia en el tema.'
      : 'Asume que el participante tiene conocimiento básico del tema. Usa términos técnicos cuando sea necesario, pero explícalos.';

  const categoryInstruction = category && category !== 'general'
    ? `El curso pertenece a la categoría "${category}". Adapta los ejemplos, escenarios y vocabulario al contexto de esa área.`
    : '';

  return `Eres un diseñador instruccional experto, inspirado en los principios de NotebookLM.
Tu tarea es generar un curso e-learning PROFUNDO, ALTAMENTE CONVERSACIONAL, y VISUALMENTE ATRACTIVO en español a partir del documento recibido.
No seas un simple resumidor: conecta los puntos, usa analogías poderosas y crea "momentos Aha!" para el estudiante.

NIVEL DE DIFICULTAD: ${difficultyInstruction}
${categoryInstruction ? `CONTEXTO SECTORIAL: ${categoryInstruction}` : ''}

ESTRUCTURA OBLIGATORIA:
- PROHIBIDO usar HTML. El contenido debe ser texto plano extremadamente conciso pero narrativo.
- Diseña el contenido para una PRESENTACIÓN (PPT) y una INFOGRAFÍA. Usa viñetas cortas, frases de impacto (máximo 15 palabras) y pasos secuenciales.
- Los módulos deben estar conectados como una historia.
- Exactamente ${numModules} módulos temáticos que cubran el documento de forma progresiva.
- Cada módulo tiene exactamente 5 diapositivas en este orden:
  1. type "concept"  → Explicación del concepto teórico principal usando una buena analogía.
  2. type "example"  → Caso real de aplicación en el trabajo (altamente contextual).
  3. type "tip"      → Consejo práctico, norma de seguridad o buena práctica.
  4. type "content"  → Profundización, procedimiento o ejercicio práctico.
  5. type "summary"  → Resumen visual de lo aprendido en el módulo.
- Cada módulo tiene exactamente 5 preguntas de quiz (10 puntos c/u). Las preguntas DEBEN ser BASADAS EN ESCENARIOS REALES. Nada de "¿Qué es X?", sino "Estás en la situación Y y sucede Z. ¿Qué debes hacer?".

ESQUEMA JSON EXACTO A DEVOLVER:
{
  "title": "Título del curso (atrapante y profesional)",
  "description": "Descripción del curso de 2 oraciones. Usa el estilo NotebookLM: atrae al usuario explicándole la 'gran imagen' y por qué esto cambiará su forma de trabajar.",
  "studyGuide": {
    "glossary": [
      { "term": "Término 1", "definition": "Definición clara y conversacional." },
      { "term": "Término 2", "definition": "Definición clara y conversacional." },
      { "term": "Término 3", "definition": "Definición clara y conversacional." },
      { "term": "Término 4", "definition": "Definición clara y conversacional." },
      { "term": "Término 5", "definition": "Definición clara y conversacional." }
    ],
    "faq": [
      { "question": "Pregunta frecuente que un novato haría", "answer": "Respuesta al estilo podcast: empática, directa y con una analogía." },
      { "question": "Pregunta frecuente de nivel intermedio", "answer": "Respuesta clara y resolutiva." },
      { "question": "Pregunta frecuente sobre un caso límite", "answer": "Respuesta detallada con consideraciones importantes." }
    ]
  },
  "modules": [
    {
      "title": "Título del Módulo 1",
      "description": "Qué cubre este módulo y cómo se conecta con la narrativa general.",
      "slides": [
        {
          "title": "Título del concepto (máx 5 palabras)",
          "type": "concept",
          "content": "Definición directa usando una analogía poderosa en máximo 2 oraciones cortas.",
          "imageUrl": "https://image.pollinations.ai/prompt/mining%20safety%20helmet?width=800&height=400&nologo=true",
          "keyPoints": [
            "Punto clave 1 (máx. 10 palabras)",
            "Punto clave 2 (máx. 10 palabras)",
            "Punto clave 3 (máx. 10 palabras)"
          ]
        },
        {
          "title": "Escenario en el Mundo Real",
          "type": "example",
          "content": "Contexto inicial de 1 oración.",
          "imageUrl": "https://image.pollinations.ai/prompt/worker%20inspecting%20machinery?width=800&height=400&nologo=true",
          "scenario": "Escenario: un problema complejo que requiere aplicar el concepto (máx 20 palabras).",
          "outcome": "Resultado: cómo se resolvió usando el conocimiento (máx 20 palabras)."
        },
        {
          "title": "Regla de Oro",
          "type": "tip",
          "content": "Explicación directa de la regla o consejo (máx 15 palabras).",
          "imageUrl": "https://image.pollinations.ai/prompt/warning%20sign%20industrial?width=800&height=400&nologo=true",
          "highlight": "FRASE DE IMPACTO o LEMA (máx 10 palabras)."
        },
        {
          "title": "El Proceso",
          "type": "content",
          "content": "Secuencia de pasos para dominar esta técnica.",
          "imageUrl": "https://image.pollinations.ai/prompt/checklist%20clipboard%20engineer?width=800&height=400&nologo=true",
          "keyPoints": [
            "Paso 1: [Acción corta]",
            "Paso 2: [Acción corta]",
            "Paso 3: [Acción corta]"
          ]
        },
        {
          "title": "Retén esto",
          "type": "summary",
          "content": "¡Módulo completado! Los 3 pilares que debes recordar:",
          "imageUrl": "https://image.pollinations.ai/prompt/success%20achievement%20professional?width=800&height=400&nologo=true",
          "keyPoints": [
            "Lección 1 (corta)",
            "Lección 2 (corta)",
            "Lección 3 (corta)"
          ]
        }
      ],
      "quiz": {
        "title": "Quiz de Escenarios: [nombre del módulo]",
        "questions": [
          {
            "question": "Escenario: [Describe una situación]. ¿Cuál es la mejor decisión a tomar?",
            "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "correctAnswer": 0,
            "explanation": "El por qué profundo de esta respuesta, destruyendo los mitos de por qué las otras son incorrectas.",
            "points": 10
          }
        ]
      }
    }
  ],
  "finalEvaluation": {
    "title": "Evaluación Final: Reto Práctico",
    "passingScore": 70,
    "questions": [
      {
        "question": "Escenario Crítico: [Un problema que combina conocimiento de varios módulos]. ¿Cómo lo resuelves?",
        "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
        "correctAnswer": 2,
        "explanation": "Explicación magistral.",
        "points": 10
      }
    ]
  }
}

REGLAS CRÍTICAS:
1. El contenido debe estar 100% basado en el documento proporcionado.
2. Los módulos deben tener una NARRATIVA CONTINUA.
3. Las pruebas DEBEN SER ESCENARIOS REALES. No evalúes definiciones, evalúa toma de decisiones.
4. "imageUrl": SIEMPRE usar "https://image.pollinations.ai/prompt/[descripcion_en_ingles_sin_espacios]?width=800&height=400&nologo=true".
5. Cada pregunta debe tener EXACTAMENTE 4 opciones.
6. Varía los correctAnswer.
7. Devuelve ÚNICAMENTE el JSON válido, sin markdown ni texto extra.`;
};

// ─── System prompt: quiz questions from slide texts ───────────────────────────

const buildQuestionsSystemPrompt = (
  numQuestions: number,
  difficulty: string,
  category: string,
  topic?: string
): string =>
  `Eres un evaluador experto en capacitación industrial y HSEQ. Tu tarea es generar exactamente ${numQuestions} preguntas de opción múltiple en español basadas en el siguiente contenido de una presentación.
${topic ? `\nEl tema general del curso es: "${topic}". Usa esto como contexto adicional para asegurarte de que las preguntas sean 100% relevantes al tema.` : ''}

REGLAS:
- Cada pregunta debe tener exactamente 4 opciones (A, B, C, D)
- Varía el índice de la respuesta correcta (correctAnswer: 0, 1, 2 o 3)
- Las preguntas deben ser sobre escenarios prácticos reales, no solo definiciones
- Basate EXCLUSIVAMENTE en el contenido proporcionado — no inventes temas ajenos
- Dificultad: ${difficulty}
- Contexto/categoría: ${category}

DEVUELVE ÚNICAMENTE este JSON válido, sin texto extra:
{"questions": [{"question": "...", "options": ["...","...","...","..."], "correctAnswer": 0, "explanation": "Por qué esta respuesta es correcta."}]}`;

// ─── System prompt: quiz questions from topic name (no slide text available) ──

const buildTopicQuestionsPrompt = (
  numQuestions: number,
  difficulty: string,
  category: string,
  topic: string
): string =>
  `Eres un evaluador experto en capacitación industrial y HSEQ. Tu tarea es generar exactamente ${numQuestions} preguntas de opción múltiple en español sobre el siguiente tema de capacitación: "${topic}".

REGLAS:
- Cada pregunta debe tener exactamente 4 opciones (A, B, C, D)
- Varía el índice de la respuesta correcta (correctAnswer: 0, 1, 2 o 3)
- Las preguntas deben simular situaciones reales de trabajo: "Estás realizando X y ocurre Y, ¿qué haces?"
- NO evalúes solo definiciones — evalúa toma de decisiones en terreno
- Dificultad: ${difficulty}
- Categoría: ${category}
- Asume que los estudiantes son trabajadores de planta, operadores o técnicos

DEVUELVE ÚNICAMENTE este JSON válido, sin texto extra:
{"questions": [{"question": "...", "options": ["...","...","...","..."], "correctAnswer": 0, "explanation": "Por qué esta respuesta es correcta y las otras no."}]}`;

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  const corsHeaders = buildCorsHeaders(origin);

  if (origin && !isOriginAllowed(origin)) {
    return Response.json(
      { error: 'Origen no permitido.' },
      { status: 403, headers: corsHeaders }
    );
  }

  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limiting
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(clientIp);
  const rateLimitHeaders = {
    ...corsHeaders,
    'X-RateLimit-Limit': String(RATE_LIMIT),
    'X-RateLimit-Remaining': String(rateCheck.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rateCheck.resetIn / 1000)),
  };
  if (!rateCheck.allowed) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' },
      { status: 429, headers: rateLimitHeaders }
    );
  }

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Sesión requerida.');

    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const callerClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });

    const { data: { user } } = await callerClient.auth.getUser();
    if (!user) throw new Error('Sesión inválida.');
    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY no está configurada.');

    const body = await request.json();

    // ── Healthcheck ──────────────────────────────────────────────────────────
    if (body.healthcheck === true) {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Responde solo: OK' }],
          temperature: 0,
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return Response.json(
          { error: `El proveedor de IA respondió ${response.status}. ${errText}` },
          { status: 502, headers: rateLimitHeaders }
        );
      }

      const data = await response.json();
      return Response.json(
        { content: data?.choices?.[0]?.message?.content ?? '' },
        { headers: rateLimitHeaders }
      );
    }

    const mode: string = typeof body.mode === 'string' ? body.mode : 'course';

    // ── Mode: questions ──────────────────────────────────────────────────────
    if (mode === 'questions') {
      const slideTexts: string =
        typeof body.slideTexts === 'string' ? body.slideTexts.trim() : '';
      const topic: string =
        typeof body.topic === 'string' ? body.topic.trim() : '';
      const numQuestions: number =
        typeof body.numQuestions === 'number' && body.numQuestions > 0
          ? body.numQuestions
          : 10;
      const difficulty: string =
        typeof body.difficulty === 'string' ? body.difficulty : 'intermediate';
      const category: string =
        typeof body.category === 'string' ? body.category : 'general';

      if (!slideTexts && !topic) {
        return Response.json(
          { error: 'Se requiere slideTexts o topic para el modo questions.' },
          { status: 400, headers: rateLimitHeaders }
        );
      }

      // Detectar si el contenido es solo placeholders (diapositivas sin texto extraíble).
      // Ignorar líneas vacías y separadores '---' que el parser inserta entre slides.
      const isPlaceholderOnly =
        !slideTexts ||
        !slideTexts.trim() ||
        slideTexts.split('\n').every(
          (line) => {
            const t = line.trim();
            return !t || t === '---' || t.startsWith('[') || /^\[diapositiva \d+/i.test(t);
          }
        );

      const systemPrompt =
        isPlaceholderOnly && topic
          ? buildTopicQuestionsPrompt(numQuestions, difficulty, category, topic)
          : buildQuestionsSystemPrompt(numQuestions, difficulty, category, topic);

      const userContent =
        isPlaceholderOnly && topic
          ? `Genera ${numQuestions} preguntas prácticas sobre el tema: "${topic}". Categoría: ${category}. Dificultad: ${difficulty}.`
          : slideTexts;

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return Response.json(
          { error: `El proveedor de IA respondió ${response.status}. ${errText}` },
          { status: 502, headers: rateLimitHeaders }
        );
      }

      const data = await response.json();
      const contentText: string = data?.choices?.[0]?.message?.content ?? '{}';

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(contentText);
      } catch {
        const match = contentText.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('La IA no devolvió un JSON válido de preguntas.');
        parsed = JSON.parse(match[0]);
      }

      const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
      return Response.json({ questions }, { headers: rateLimitHeaders });
    }

    // ── Mode: course (default / backward compat) ─────────────────────────────
    const documentText =
      typeof body.documentText === 'string' ? body.documentText.trim() : '';
    const numModules: number =
      typeof body.numModules === 'number' && body.numModules > 0 ? body.numModules : 5;
    const difficulty: string =
      typeof body.difficulty === 'string' ? body.difficulty : 'intermediate';
    const category: string =
      typeof body.category === 'string' ? body.category : 'general';

    if (documentText.length < 200 || documentText.length > 500000) {
      return Response.json(
        { error: 'Documento inválido o fuera del límite permitido.' },
        { status: 400, headers: rateLimitHeaders }
      );
    }

    const maxChunkLength = 40000;
    const textChunks: string[] = [];
    let currentChunk = '';
    const lines = documentText.split('\n');
    for (const line of lines) {
      if (
        currentChunk.length + line.length + 1 > maxChunkLength &&
        currentChunk.length > 0
      ) {
        textChunks.push(currentChunk);
        currentChunk = '';
      }
      currentChunk += (currentChunk.length > 0 ? '\n' : '') + line;
    }
    if (currentChunk.length > 0) {
      textChunks.push(currentChunk);
    }

    // deno-lint-ignore no-explicit-any
    let allModules: any[] = [];
    let courseTitle = '';
    let courseDescription = '';

    let remainingModulesToGenerate = Math.max(numModules, textChunks.length);
    const totalModules = remainingModulesToGenerate;

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const modulesForThisChunk =
        i === textChunks.length - 1
          ? remainingModulesToGenerate
          : Math.ceil(totalModules / textChunks.length);

      remainingModulesToGenerate -= modulesForThisChunk;

      const startModuleIdx =
        totalModules - remainingModulesToGenerate - modulesForThisChunk + 1;
      const endModuleIdx = totalModules - remainingModulesToGenerate;

      const systemPrompt = buildCourseSystemPrompt(
        modulesForThisChunk,
        difficulty,
        category
      );

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Genera ${modulesForThisChunk} módulos (del módulo ${startModuleIdx} al ${endModuleIdx}) con 5 diapositivas por módulo a partir de este documento (Parte ${
                i + 1
              } de ${textChunks.length}):\n\n${chunk}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: 6000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return Response.json(
          {
            error: `El proveedor de IA respondió ${response.status} en la parte ${
              i + 1
            }. ${errText}`,
          },
          { status: 502, headers: rateLimitHeaders }
        );
      }

      const data = await response.json();
      const contentText: string = data?.choices?.[0]?.message?.content ?? '{}';

      try {
        const parsed = JSON.parse(contentText);
        if (i === 0) {
          courseTitle = parsed.title || 'Curso Generado';
          courseDescription = parsed.description || 'Descripción del curso.';
        }
        if (parsed.modules && Array.isArray(parsed.modules)) {
          allModules = allModules.concat(parsed.modules);
        } else if (parsed.course && Array.isArray(parsed.course.modules)) {
          allModules = allModules.concat(parsed.course.modules);
        }
      } catch (e) {
        console.error('Error parsing JSON from DeepSeek for chunk', i, e);
      }
    }

    const finalCourse = {
      title: courseTitle,
      description: courseDescription,
      modules: allModules,
    };

    return Response.json(
      { content: JSON.stringify(finalCourse) },
      { headers: rateLimitHeaders }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error inesperado.' },
      { status: 500, headers: rateLimitHeaders }
    );
  }
});
