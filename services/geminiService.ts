
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, DocumentSource } from "../types";

const getBaseSystemInstruction = (privateDocs: DocumentSource[]) => {
  const docsContext = privateDocs
    .filter(d => d.content && d.content.length > 5)
    .map(d => `CONTENIDO DEL ${d.name}:\n${d.content}`)
    .join('\n\n---\n\n');
  
  return `
Eres SolvencIA, la IA experta del Departamento de Contabilidad y Economía Financiera de la Universidad de Sevilla.

REGLAS DE ORO:
1. FUENTES INVISIBLES: No nombres nunca los archivos o temas.
2. RIGOR: Usa el Plan General Contable (PGC).
3. TONO: Académico y profesional.

CONTEXTO:
${docsContext || 'Contabilidad española y PGC.'}
`;
};

export const getAIResponse = async (
  prompt: string,
  history: Message[],
  privateDocs: DocumentSource[] = [],
  mode: 'text' | 'quiz' | 'mindmap' | 'image_infographic' = 'text'
): Promise<{text: string, data?: any}> => {
  
  // Obtenemos la clave inyectada por Vite
  const apiKey = process.env.API_KEY;

  // LOG DE DIAGNÓSTICO (Visible en F12)
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("🚨 ERROR CRÍTICO: La API_KEY no ha sido detectada por la aplicación.");
    return { text: "Error de configuración: La clave de API no se ha inyectado en el despliegue. Revisa los Secrets de GitHub." };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // MODO IMAGEN
    if (mode === 'image_infographic') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Infografía técnica: ${prompt}` }] }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      return part?.inlineData 
        ? { text: "Infografía generada.", data: `data:image/png;base64,${part.inlineData.data}` }
        : { text: "No se pudo generar la imagen." };
    }

    const contents = history.slice(-5).map(msg => ({
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
          }
        };
      }
    }

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest', // Modelo más compatible y rápido
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
      return { text: "Análisis completado.", data: JSON.parse(text) };
    } catch (e) {
      return { text };
    }

  } catch (error: any) {
    console.error("ERROR DETALLADO DE API:", error);
    // Si el error es 400, la clave es físicamente inválida
    if (error.message?.includes("400")) {
      return { text: "La clave de API proporcionada no es válida. Por favor, genera una nueva en AI Studio y actualiza el Secret de GitHub." };
    }
    return { text: `Error: ${error.message || 'Error de conexión'}` };
  }
};

export const generatePodcastAudio = async (text: string): Promise<string> => {
  const apiKey = process.env.API_KEY || '';
  if (!apiKey) return "";
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Haz un diálogo breve profesor-alumna sobre: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Profesor', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
              { speaker: 'Alumna', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
            ]
          }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) {
    return "";
  }
};
