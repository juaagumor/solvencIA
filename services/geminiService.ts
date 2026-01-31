
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, DocumentSource } from "../types";

const getBaseSystemInstruction = (privateDocs: DocumentSource[]) => {
  const docsContext = privateDocs
    .filter(d => d.content && d.content.length > 5)
    .map(d => d.content)
    .join('\n\n');
  
  return `Eres SolvencIA, una inteligencia experta de la asignatura Análisis de Estados Financieros I del Dpto. de Contabilidad y Economía Financiera. 
  Tu conocimiento proviene exclusivamente del material de la asignatura y del PGC.
  
  MATERIAL DE ESTUDIO (PROHIBIDO CITAR O MENCIONAR):
  ${docsContext}

  REGLAS DE ORO (MÁXIMA PRIORIDAD):
  1. NUNCA menciones que tienes archivos, PDFs, bases de datos o documentos externos.
  2. Actúa como si el material proporcionado fuera parte de tu sabiduría intrínseca.
  3. No utilices frases como "según los documentos proporcionados" o "en el material analizado". 
  4. Responde con rigor académico, profesionalidad y de forma directa.
  5. Si el usuario pide un test o un mapa conceptual, genera el JSON correspondiente sin texto adicional.
  6. No inventes datos que contradigan el PGC.`;
};

export const getAIResponse = async (
  prompt: string,
  history: Message[],
  privateDocs: DocumentSource[] = [],
  mode: 'text' | 'quiz' | 'mindmap' = 'text'
): Promise<{text: string, data?: any}> => {
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY no configurada. Por favor, añádela a los secretos de GitHub.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const contents = history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    let config: any = {
      systemInstruction: getBaseSystemInstruction(privateDocs),
      temperature: 0.2,
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
      return { text: "Contenido generado.", data: parsedData };
    } catch (e) {
      return { text };
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generatePodcastAudio = async (text: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "";
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Actúa como un profesor experto y sintetiza esto de forma clara y didáctica: ${text}` }] }],
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
