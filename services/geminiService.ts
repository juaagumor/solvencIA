
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
1. FUENTES INVISIBLES: No nombres nunca los archivos, temas o documentos. Responde como si el conocimiento fuera tuyo.
2. RIGOR: Usa el Plan General Contable (PGC) y el contenido proporcionado.
3. TONO: Académico, cercano y profesional.

CONTEXTO ACADÉMICO:
${docsContext || 'Actúa como catedrático experto en Contabilidad Española.'}
`;
};

export const getAIResponse = async (
  prompt: string,
  history: Message[],
  privateDocs: DocumentSource[] = [],
  mode: 'text' | 'quiz' | 'mindmap' | 'image_infographic' = 'text'
): Promise<{text: string, data?: any}> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === '') {
    console.error("ERROR: API_KEY no configurada. Verifica los Secrets de GitHub.");
    return { text: "Error de configuración: La clave de API no está presente en el servidor." };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // MODO IMAGEN: Infografía Visual
    if (mode === 'image_infographic') {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `Crea una infografía educativa técnica y minimalista sobre el siguiente concepto contable: ${prompt}. Usa colores sobrios (azul, granate, blanco) y un diseño de alta calidad para universidad.` }]
        },
        config: {
          imageConfig: { aspectRatio: "1:1" }
        }
      });

      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        return { 
          text: "He diseñado esta infografía visual para que visualices mejor los conceptos clave.", 
          data: `data:image/png;base64,${part.inlineData.data}` 
        };
      }
    }

    // MODOS DE TEXTO Y JSON
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    let finalPrompt = prompt;
    let responseMimeType = "text/plain";
    let responseSchema: any = undefined;

    if (mode === 'quiz') {
      finalPrompt = `Genera un test de 3 preguntas sobre: ${prompt}. Responde solo en JSON.`;
      responseMimeType = "application/json";
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
    } else if (mode === 'mindmap') {
      finalPrompt = `Estructura un mapa conceptual jerárquico de: ${prompt}. Responde solo en JSON.`;
      responseMimeType = "application/json";
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          core: { type: Type.STRING },
          branches: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                node: { type: Type.STRING },
                details: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      };
    }

    contents.push({ role: 'user', parts: [{ text: finalPrompt }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents as any,
      config: {
        systemInstruction: getBaseSystemInstruction(privateDocs),
        temperature: mode === 'text' ? 0.7 : 0.1,
        responseMimeType: responseMimeType as any,
        responseSchema: responseSchema
      }
    });

    const text = response.text || "";
    if (mode === 'text') return { text };
    
    try {
      return { text: "Contenido especializado generado.", data: JSON.parse(text) };
    } catch (e) {
      return { text: text }; // Fallback si no es JSON
    }

  } catch (error: any) {
    console.error("DETALLE DEL ERROR DE LA API:", error);
    return { text: `Error de la IA: ${error.message || 'Error desconocido'}. Revisa la consola para más detalles.` };
  }
};

export const generatePodcastAudio = async (text: string): Promise<string> => {
  const apiKey = process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Convierte esto en un podcast educativo breve (máximo 1 minuto) entre un profesor (Joe) y una alumna (Jane) sobre el tema:\n\n${text}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Joe', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
              { speaker: 'Jane', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
            ]
          }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) {
    console.error("Error generando audio:", e);
    return "";
  }
};
