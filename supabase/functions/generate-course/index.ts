const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

const buildSystemPrompt = (numModules: number, difficulty: string, category: string): string => {
  const difficultyInstruction =
    difficulty === 'beginner'
      ? 'Usa lenguaje simple y accesible, sin jerga técnica. Explica todos los conceptos desde cero.'
      : difficulty === 'advanced'
      ? 'El contenido debe ser profundo y técnico. Asume que el participante ya tiene experiencia en el tema.'
      : 'Asume que el participante tiene conocimiento básico del tema. Usa términos técnicos cuando sea necesario, pero explícalos.';

  const categoryInstruction = category && category !== 'general'
    ? `El curso pertenece a la categoría "${category}". Adapta los ejemplos, escenarios y vocabulario al contexto de esa área.`
    : '';

  return `Eres un diseñador instruccional experto en capacitación corporativa.
Tu tarea es generar un curso e-learning COMPLETO y VISUALMENTE ATRACTIVO en español a partir del documento recibido.

NIVEL DE DIFICULTAD: ${difficultyInstruction}
${categoryInstruction ? `CONTEXTO SECTORIAL: ${categoryInstruction}` : ''}

ESTRUCTURA OBLIGATORIA:
- Exactamente ${numModules} módulos temáticos que cubran el documento de forma progresiva
- Cada módulo tiene exactamente 5 diapositivas en este orden:
  1. type "concept"  → Explicación del concepto teórico principal
  2. type "example"  → Caso real de aplicación en el trabajo
  3. type "tip"      → Consejo práctico, norma de seguridad o buena práctica
  4. type "content"  → Profundización, procedimiento o ejercicio práctico
  5. type "summary"  → Resumen visual de lo aprendido en el módulo
- Cada módulo tiene exactamente 5 preguntas de quiz (10 puntos c/u)

ESQUEMA JSON EXACTO A DEVOLVER:
{
  "title": "Título del curso (conciso, profesional)",
  "description": "Descripción del curso de 2 oraciones. Qué aprenderá el participante y por qué es importante.",
  "modules": [
    {
      "title": "Título del Módulo 1",
      "description": "Qué cubre este módulo en 1 oración.",
      "slides": [
        {
          "title": "Título del concepto",
          "type": "concept",
          "content": "Explicación teórica del concepto principal. Mínimo 3 oraciones. Explica el QUÉ y el POR QUÉ.",
          "keyPoints": [
            "Punto clave 1 (máx. 12 palabras)",
            "Punto clave 2 (máx. 12 palabras)",
            "Punto clave 3 (máx. 12 palabras)",
            "Punto clave 4 (máx. 12 palabras)"
          ]
        },
        {
          "title": "Título del ejemplo real",
          "type": "example",
          "content": "Contexto breve: por qué este ejemplo es relevante (2 oraciones).",
          "scenario": "Descripción concreta del escenario laboral: qué pasó, quién estuvo involucrado, cuál fue la situación.",
          "outcome": "Resultado y lección aprendida: qué se hizo bien o mal, y qué debería hacerse en su lugar."
        },
        {
          "title": "Título del consejo",
          "type": "tip",
          "content": "Explicación del consejo, norma o buena práctica (2-3 oraciones). Incluye el contexto normativo si aplica.",
          "highlight": "Frase clave corta e impactante (máx. 20 palabras) que resume el consejo principal."
        },
        {
          "title": "Título de la profundización",
          "type": "content",
          "content": "Descripción detallada del procedimiento, metodología o aspectos avanzados. Mínimo 3 oraciones.",
          "keyPoints": [
            "Aspecto o paso importante 1",
            "Aspecto o paso importante 2",
            "Aspecto o paso importante 3"
          ]
        },
        {
          "title": "Resumen: [nombre del módulo]",
          "type": "summary",
          "content": "Cierre motivador del módulo en 2 oraciones. Reafirma la importancia de lo aprendido.",
          "keyPoints": [
            "Lo que aprendiste 1",
            "Lo que aprendiste 2",
            "Lo que aprendiste 3",
            "Lo que aprendiste 4"
          ]
        }
      ],
      "quiz": {
        "title": "Quiz: [nombre del módulo]",
        "questions": [
          {
            "question": "Pregunta 1 clara y directa sobre el contenido del módulo",
            "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "correctAnswer": 0,
            "explanation": "Explicación de por qué esta es la respuesta correcta y por qué las otras no lo son.",
            "points": 10
          },
          {
            "question": "Pregunta 2",
            "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "correctAnswer": 1,
            "explanation": "...",
            "points": 10
          },
          {
            "question": "Pregunta 3",
            "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "correctAnswer": 2,
            "explanation": "...",
            "points": 10
          },
          {
            "question": "Pregunta 4",
            "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "correctAnswer": 0,
            "explanation": "...",
            "points": 10
          },
          {
            "question": "Pregunta 5 (más desafiante, sobre aplicación práctica)",
            "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
            "correctAnswer": 3,
            "explanation": "...",
            "points": 10
          }
        ]
      }
    }
  ]
}

REGLAS CRÍTICAS:
1. El contenido debe estar 100% basado en el documento proporcionado. No inventes datos.
2. Los ${numModules} módulos deben cubrir el documento de forma lógica y progresiva (de lo básico a lo avanzado).
3. Los ejemplos (type "example") deben ser situaciones reales del contexto descrito en el documento.
4. Los tips (type "tip") deben ser consejos prácticos, normas de seguridad o procedimientos clave.
5. El campo "highlight" debe ser una frase corta, directa e impactante (no más de 20 palabras).
6. Los "keyPoints" deben ser frases cortas y accionables (máx. 12 palabras cada una).
7. Cada pregunta del quiz debe tener EXACTAMENTE 4 opciones.
8. "correctAnswer" es el índice (0, 1, 2 o 3) de la opción correcta.
9. Varía los correctAnswer: no uses siempre el índice 0.
10. Las preguntas del quiz deben ser variadas: 2 fáciles de comprensión, 2 de aplicación, 1 de análisis.
11. Devuelve ÚNICAMENTE el JSON, sin texto introductorio, sin bloques de código markdown.`;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey) throw new Error('DEEPSEEK_API_KEY no está configurada.');

    const body = await request.json();
    const documentText = typeof body.documentText === 'string' ? body.documentText.trim() : '';
    const healthcheck = body.healthcheck === true;
    const numModules: number = typeof body.numModules === 'number' && body.numModules > 0 ? body.numModules : 5;
    const difficulty: string = typeof body.difficulty === 'string' ? body.difficulty : 'intermediate';
    const category: string = typeof body.category === 'string' ? body.category : 'general';

    if (!healthcheck && (documentText.length < 200 || documentText.length > 500000)) {
      return Response.json({ error: 'Documento inválido o fuera del límite permitido.' }, {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (healthcheck) {
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
          { status: 502, headers: corsHeaders }
        );
      }

      const data = await response.json();
      return Response.json({
        content: data?.choices?.[0]?.message?.content ?? '',
      }, { headers: corsHeaders });
    }

    const maxChunkLength = 40000;
    const textChunks = [];
    let currentChunk = '';
    const lines = documentText.split('\n');
    for (const line of lines) {
      if (currentChunk.length + line.length + 1 > maxChunkLength && currentChunk.length > 0) {
        textChunks.push(currentChunk);
        currentChunk = '';
      }
      currentChunk += (currentChunk.length > 0 ? '\n' : '') + line;
    }
    if (currentChunk.length > 0) {
      textChunks.push(currentChunk);
    }

    let allModules = [];
    let courseTitle = '';
    let courseDescription = '';
    
    let remainingModulesToGenerate = Math.max(numModules, textChunks.length);
    const totalModules = remainingModulesToGenerate;

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const modulesForThisChunk = i === textChunks.length - 1 
        ? remainingModulesToGenerate 
        : Math.ceil(totalModules / textChunks.length);
      
      remainingModulesToGenerate -= modulesForThisChunk;

      const startModuleIdx = totalModules - remainingModulesToGenerate - modulesForThisChunk + 1;
      const endModuleIdx = totalModules - remainingModulesToGenerate;

      const systemPrompt = buildSystemPrompt(modulesForThisChunk, difficulty, category);

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
              content: `Genera ${modulesForThisChunk} módulos (del módulo ${startModuleIdx} al ${endModuleIdx}) con 5 diapositivas por módulo a partir de este documento (Parte ${i + 1} de ${textChunks.length}):\n\n${chunk}`
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
          max_tokens: 16000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return Response.json(
          { error: `El proveedor de IA respondió ${response.status} en la parte ${i + 1}. ${errText}` },
          { status: 502, headers: corsHeaders }
        );
      }

      const data = await response.json();
      const contentText = data?.choices?.[0]?.message?.content ?? '{}';
      
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
        console.error("Error parsing JSON from DeepSeek for chunk", i, e);
      }
    }

    const finalCourse = {
      title: courseTitle,
      description: courseDescription,
      modules: allModules
    };

    return Response.json({
      content: JSON.stringify(finalCourse)
    }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Error inesperado.',
    }, { status: 500, headers: corsHeaders });
  }
});
