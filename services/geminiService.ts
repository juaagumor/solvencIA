import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, DocumentSource } from "../types";

/**
 * Selecciona los documentos más relevantes para la consulta actual
 * para evitar saturar la cuota de tokens (Error 429).
 * Ahora se seleccionan hasta 6 temas para mejorar la precisión.
 */
const getRelevantContext = (prompt: string, docs: DocumentSource[]): string => {
  if (!docs || docs.length === 0) return "";

  // Extraemos palabras clave de la consulta (palabras de más de 3 letras)
  const keywords = prompt.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  const scoredDocs = docs.map(doc => {
    let score = 0;
    const searchArea = (doc.name + " " + doc.content).toLowerCase();
    
    keywords.forEach(kw => {
      if (searchArea.includes(kw)) score++;
    });
    
    return { doc, score };
  });

  // Ordenamos por relevancia y tomamos los 6 temas más coincidentes
  // Se ha subido de 3 a 6 para dar más profundidad a la respuesta
  return scoredDocs
    .sort((a, b) => b.score - a.score)
    .filter(item => item.score > 0 || docs.length <= 6)
    .slice(0, 6)
    .map(item => `TEMA: ${item.doc.name}\n${item.doc.content}`)
    .join('\n\n');
};

const getBaseSystemInstruction = (prompt: string, privateDocs: DocumentSource[]) => {
  const docsContext = getRelevantContext(prompt, privateDocs);
  
  return `Eres SolvencIA, una inteligencia experta del Departamento de Contabilidad y Economía Financiera. 
  Tu conocimiento proviene de este material académico (PROHIBIDO CITAR FUENTES):
  
  ${docsContext}

  REGLAS CRÍTICAS:
  1. Actúa como si el conocimiento fuera propio y natural.
  2. NUNCA menciones que tienes documentos, archivos o una base de datos.
  3. No utilices frases como "según el material" o "en el contenido analizado".
  4. Mantén un tono académico riguroso y profesional.
  5. Si el usuario pide un test o esquema, responde ÚNICAMENTE con el JSON solicitado.
  6. Si el contexto proporcionado no es suficiente, usa tus conocimientos generales de contabilidad y el PGC español.`;
};

export const getAIResponse = async (
  prompt: string,
  history: Message[],
  privateDocs: DocumentSource[] = [],
  mode: 'text' | 'quiz' | 'mindmap' = 'text'
): Promise<{text: string, data?: any}> => {
  
  // Inicialización siguiendo las reglas de la API
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Reducimos historial para ahorrar tokens adicionales
    const contents = history.slice(-3).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    let config: any = {
      systemInstruction: getBaseSystemInstruction(prompt, privateDocs),
      temperature: 0.1, // Rigor máximo
    };

    if (mode === 'quiz' || mode === 'mindmap') {
      config.responseMimeType = "application/json";
      if (mode === 'quiz') {
        config.responseSchema = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.NUMBER },
              explanation: { type: Type.STRING }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        };
      } else {
        config.responseSchema = {
          type: Type.OBJECT,
          properties: {
            core: { type: Type.STRING },
            branches: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { node: { type: Type.STRING }, details: { type: Type.ARRAY, items: { type: Type.STRING } } } } }
          },
          required: ["core", "branches"]
        };
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents as any,
      config: config
    });

    const text = response.text || "";
    if (mode === 'text') return { text };
    
    try {
      const parsedData = JSON.parse(text);
      return { text: "Análisis completado.", data: parsedData };
    } catch (e) {
      return { text };
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generatePodcastAudio = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Explica este concepto académico de forma clara y didáctica para alumnos universitarios: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) {
    console.error("TTS Error:", e);
    return "";
  }
};