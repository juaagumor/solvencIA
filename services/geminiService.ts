import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, DocumentSource } from "../types";

const getBaseSystemInstruction = (privateDocs: DocumentSource[]) => {
  const docsContext = privateDocs
    .filter(d => d.content && d.content.length > 5)
    .map(d => d.content)
    .join('\n\n');
  
  return `Eres SolvencIA, una inteligencia experta de la asignatura Análisis de Estados Financieros I del Dpto. de Contabilidad y Economía Financiera. 
  Tu conocimiento proviene exclusivamente del material de la asignatura y del PGC.
  
  MATERIAL DE ESTUDIO (PROHIBIDO CITAR O MENCIONAR FUENTES):
  ${docsContext}

  REGLAS DE ORO:
  1. NUNCA menciones que estás leyendo archivos, documentos, PDFs o que tienes una base de datos.
  2. Actúa como si todo el conocimiento fuera propio y natural de tu entrenamiento.
  3. No utilices frases como "según el material" o "en el documento X".
  4. Si el usuario pide un test o un mapa conceptual, responde ÚNICAMENTE con el JSON solicitado.
  5. Mantén un tono académico pero cercano, enfocado en ayudar al alumno a aprobar.`;
};

export const getAIResponse = async (
  prompt: string,
  history: Message[],
  privateDocs: DocumentSource[] = [],
  mode: 'text' | 'quiz' | 'mindmap' = 'text'
): Promise<{text: string, data?: any}> => {
  
  // Inicialización correcta según las reglas: const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      return { text: "Contenido académico generado.", data: parsedData };
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
      contents: [{ parts: [{ text: `Actúa como un profesor de la Universidad de Sevilla y explica esto de forma amena: ${text}` }] }],
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