import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, DocumentSource } from "../types";

/**
 * Selecciona los documentos más relevantes con un límite estricto de seguridad
 * para evitar el error 429 de cuota en entornos de producción.
 */
const getRelevantContext = (prompt: string, docs: DocumentSource[]): string => {
  if (!docs || docs.length === 0) return "";

  // 1. Extraer palabras clave
  const keywords = prompt.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  // 2. Puntuar por relevancia
  const scoredDocs = docs.map(doc => {
    let score = 0;
    const searchArea = (doc.name + " " + doc.content).toLowerCase();
    keywords.forEach(kw => {
      if (searchArea.includes(kw)) score++;
    });
    return { doc, score };
  });

  // 3. Ordenar
  const sorted = scoredDocs.sort((a, b) => b.score - a.score);

  // 4. Presupuesto de seguridad estricto para evitar error 429
  // Reducimos a 40,000 caracteres para asegurar que nunca saturemos los TPM de la cuenta gratuita
  const CHARACTER_BUDGET = 40000;
  let currentUsage = 0;
  const finalDocs: string[] = [];

  for (const item of sorted) {
    if (finalDocs.length >= 5) break; // Máximo 5 temas para ahorrar tokens
    
    if (item.score > 0 || finalDocs.length < 2) {
      const docText = `TEMA: ${item.doc.name}\n${item.doc.content}`;
      
      if (currentUsage + docText.length < CHARACTER_BUDGET) {
        finalDocs.push(docText);
        currentUsage += docText.length;
      } 
      else if (currentUsage < CHARACTER_BUDGET * 0.7) {
        const remainingBudget = CHARACTER_BUDGET - currentUsage;
        finalDocs.push(docText.substring(0, remainingBudget) + "... [Contenido truncado por seguridad]");
        break;
      }
    }
  }

  return finalDocs.join('\n\n');
};

const getBaseSystemInstruction = (prompt: string, privateDocs: DocumentSource[]) => {
  const docsContext = getRelevantContext(prompt, privateDocs);
  
  return `Eres SolvencIA, experto del Dpto de Contabilidad.
  Tu base de datos actual (PROHIBIDO CITARLA O MENCIONAR ARCHIVOS):
  
  ${docsContext}

  REGLAS:
  1. No menciones fuentes, documentos o que estás leyendo archivos.
  2. Actúa con sabiduría propia.
  3. Prohibido: "según el texto", "en el material".
  4. Responde con rigor académico.
  5. Formato JSON estricto para tests/esquemas.
  6. Usa el PGC español como referencia estándar.`;
};

export const getAIResponse = async (
  prompt: string,
  history: Message[],
  privateDocs: DocumentSource[] = [],
  mode: 'text' | 'quiz' | 'mindmap' = 'text'
): Promise<{text: string, data?: any}> => {
  
  // Re-instanciar para asegurar que toma la API_KEY del entorno de Vite
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Solo enviamos el último mensaje del historial para minimizar el uso de tokens
    const contents = history.slice(-1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    let config: any = {
      systemInstruction: getBaseSystemInstruction(prompt, privateDocs),
      temperature: 0.1,
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
      return { text: "Operación finalizada.", data: parsedData };
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
      contents: [{ parts: [{ text: `Explica este concepto académico: ${text}` }] }],
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