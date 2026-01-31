
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, DocumentSource } from "../types";

const getBaseSystemInstruction = (privateDocs: DocumentSource[]) => {
  const docsContext = privateDocs
    .filter(d => d.content && d.content.length > 5)
    .map(d => `CONTENIDO DEL ${d.name}:\n${d.content}`)
    .join('\n\n---\n\n');
  
  return `Eres SolvencIA, experto del Dpto. de Contabilidad de la US. Responde con rigor usando el PGC. NO cites fuentes, responde con autoridad propia. Sé conciso y profesional.`;
};

export const getAIResponse = async (
  prompt: string,
  history: Message[],
  privateDocs: DocumentSource[] = [],
  mode: 'text' | 'quiz' | 'mindmap' | 'image_infographic' = 'text'
): Promise<{text: string, data?: any}> => {
  
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    return { text: "⚠️ ERROR DE CONFIGURACIÓN: La clave de API no se ha detectado. Asegúrate de haber configurado el Secret 'API_KEY' en GitHub y que el despliegue haya terminado." };
  }

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
      model: 'gemini-3-flash-preview',
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
      return { text: "Generado con éxito.", data: JSON.parse(text) };
    } catch (e) {
      return { text };
    }

  } catch (error: any) {
    const errorMsg = error.message || "";
    console.error("Detalle del error:", error);
    
    if (errorMsg.includes("API key expired") || errorMsg.includes("API key not valid") || errorMsg.includes("400")) {
      return { text: "❌ LA CLAVE DE API HA EXPIRADO O ES INVÁLIDA.\n\nPor favor:\n1. Ve a Google AI Studio y genera una clave NUEVA.\n2. Actualiza el secreto 'API_KEY' en GitHub.\n3. Espera a que el despliegue termine." };
    }
    
    return { text: `Desconectado: ${errorMsg.substring(0, 100)}...` };
  }
};

export const generatePodcastAudio = async (text: string): Promise<string> => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey || apiKey.length < 10) return "";
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Resumen académico breve: ${text}` }] }],
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
