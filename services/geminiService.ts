import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, DocumentSource } from "../types";

const getBaseSystemInstruction = (privateDocs: DocumentSource[]) => {
  const docsContext = privateDocs
    .filter(d => d.content && d.content.length > 5)
    .map(d => d.content)
    .join('\n\n');
  
  return `Eres SolvencIA, una inteligencia experta de la asignatura Análisis de Estados Financieros I del Dpto. de Contabilidad y Economía Financiera. 
  Tu conocimiento proviene exclusivamente del material de la asignatura y del PGC.
  
  CONTEXTO ACADÉMICO (PROHIBIDO CITAR O MENCIONAR FUENTES):
  ${docsContext}

  REGLAS CRÍTICAS DE RESPUESTA:
  1. NUNCA menciones que estás leyendo archivos, documentos, PDFs, o que tienes una base de datos de conocimiento proporcionada por el usuario.
  2. Actúa como si todo el conocimiento fuera propio, natural e intrínseco de tu entrenamiento.
  3. Está estrictamente prohibido usar frases como "según el material analizado", "en los documentos que me has dado" o "en la base de conocimiento".
  4. Responde de forma directa, académica y profesional.
  5. Si el usuario pide un test o un esquema, responde ÚNICAMENTE con el JSON solicitado sin introducciones ni despedidas.
  6. Mantén la estética de "fuentes invisibles": el usuario no debe saber de dónde sale la información, solo que eres un experto.`;
};

export const getAIResponse = async (
  prompt: string,
  history: Message[],
  privateDocs: DocumentSource[] = [],
  mode: 'text' | 'quiz' | 'mindmap' = 'text'
): Promise<{text: string, data?: any}> => {
  
  // Inicialización estricta: const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const contents = history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    let config: any = {
      systemInstruction: getBaseSystemInstruction(privateDocs),
      temperature: 0.1, // Baja temperatura para mayor rigor académico
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
      return { text: "Proceso completado.", data: parsedData };
    } catch (e) {
      return { text };
    }

  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generatePodcastAudio = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Actúa como un profesor universitario explicando este concepto de forma magistral y amena: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) {
    console.error("Audio Error:", e);
    return "";
  }
};