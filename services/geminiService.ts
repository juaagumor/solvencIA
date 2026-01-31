import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, DocumentSource } from "../types";

const getBaseSystemInstruction = (privateDocs: DocumentSource[]) => {
  // Solo incluimos contenido relevante para no saturar la cuota de tokens
  const docsContext = privateDocs
    .filter(d => d.content && d.content.length > 5)
    .map(d => `TEMA: ${d.name}\n${d.content}`)
    .join('\n\n');
  
  return `Eres SolvencIA, experto en Análisis de Estados Financieros I.
  Usa este material como base de tu sabiduría (PROHIBIDO CITAR FUENTES):
  ${docsContext}

  REGLAS:
  1. No menciones archivos, documentos o bases de datos. Actúa como si el conocimiento fuera tuyo.
  2. NUNCA uses frases como "según el material" o "en los documentos".
  3. Sé académico, directo y preciso.
  4. Para tests o esquemas, responde SOLO el JSON.
  5. Si hay dudas, prioriza el PGC español.`;
};

export const getAIResponse = async (
  prompt: string,
  history: Message[],
  privateDocs: DocumentSource[] = [],
  mode: 'text' | 'quiz' | 'mindmap' = 'text'
): Promise<{text: string, data?: any}> => {
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const contents = history.slice(-5).map(msg => ({ // Reducimos historial para ahorrar tokens
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    let config: any = {
      systemInstruction: getBaseSystemInstruction(privateDocs),
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
      contents: [{ parts: [{ text: `Explica este concepto académico de forma magistral: ${text}` }] }],
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