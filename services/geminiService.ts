
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, DocumentSource } from "../types";

const getBaseSystemInstruction = (privateDocs: DocumentSource[]) => {
  const docsContext = privateDocs
    .filter(d => d.content && d.content.length > 5)
    .map(d => `CONTENIDO DEL ${d.name}:\n${d.content}`)
    .join('\n\n---\n\n');
  
  return `Eres SolvencIA, experto del Dpto. de Contabilidad de la US. Responde con rigor usando el PGC. NO cites fuentes, responde con autoridad propia.`;
};

export const getAIResponse = async (
  prompt: string,
  history: Message[],
  privateDocs: DocumentSource[] = [],
  mode: 'text' | 'quiz' | 'mindmap' | 'image_infographic' = 'text'
): Promise<{text: string, data?: any}> => {
  
  const apiKey = process.env.API_KEY;

  // Diagnóstico para el usuario
  if (!apiKey || apiKey === "undefined") {
    console.error("🚨 ERROR: API_KEY no inyectada en el build.");
    return { text: "Error: No se ha detectado la clave de API en el despliegue." };
  }
  
  // Imprimimos el inicio para verificar que la clave es la correcta sin exponerla toda
  console.log("🔍 Diagnóstico de Clave - Comienza por:", apiKey.substring(0, 6));

  const ai = new GoogleGenAI({ apiKey });

  try {
    if (mode === 'image_infographic') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Infografía profesional contable: ${prompt}` }] }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part?.inlineData 
        ? { text: "Visualización generada.", data: `data:image/png;base64,${part.inlineData.data}` }
        : { text: "Error generando imagen." };
    }

    const contents = history.slice(-6).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    let responseMimeType = "text/plain";
    let responseSchema: any = undefined;

    if (mode === 'quiz' || mode === 'mindmap') {
      responseMimeType = "application/json";
      if (mode === 'quiz') {
        responseSchema = {
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
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            core: { type: Type.STRING },
            branches: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { node: { type: Type.STRING }, details: { type: Type.ARRAY, items: { type: Type.STRING } } } } }
          },
          required: ["core", "branches"]
        };
      }
    }

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Usamos el modelo más robusto
      contents: contents as any,
      config: {
        systemInstruction: getBaseSystemInstruction(privateDocs),
        responseMimeType: responseMimeType as any,
        responseSchema: responseSchema,
        temperature: 0.7
      }
    });

    const text = response.text || "";
    if (mode === 'text') return { text };
    
    try {
      return { text: "Contenido generado con éxito.", data: JSON.parse(text) };
    } catch (e) {
      return { text };
    }

  } catch (error: any) {
    console.error("❌ ERROR API:", error);
    return { text: `Error de la IA (${error.status || 'API'}): ${error.message || 'Error de conexión'}` };
  }
};

export const generatePodcastAudio = async (text: string): Promise<string> => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) return "";
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Crea un diálogo corto sobre: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) {
    return "";
  }
};
