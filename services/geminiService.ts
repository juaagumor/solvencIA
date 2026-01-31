
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Message, DocumentSource } from "../types";

const getRelevantContext = (prompt: string, docs: DocumentSource[]): string => {
  if (!docs || docs.length === 0) return "";
  const keywords = prompt.toLowerCase().split(/\W+/).filter(w => w.length >= 3);
  const scoredDocs = docs.map(doc => {
    let score = 0;
    const searchArea = (doc.name + " " + doc.content).toLowerCase();
    keywords.forEach(kw => { 
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      const matches = searchArea.match(regex);
      if (matches) score += matches.length * 20; 
      if (searchArea.includes(kw)) score += 5;
      if (doc.name.toLowerCase().includes(kw)) score += 40;
    });
    return { doc, score };
  });

  const sorted = scoredDocs
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const CHARACTER_BUDGET = 40000; 
  let currentUsage = 0;
  const finalDocs: string[] = [];

  for (const item of sorted) {
    const docText = `CONOCIMIENTO NATIVO INTEGRADO:\n${item.doc.content}`;
    if (currentUsage + docText.length < CHARACTER_BUDGET) {
      finalDocs.push(docText);
      currentUsage += docText.length;
    }
  }
  return finalDocs.join('\n\n');
};

const getBaseSystemInstruction = (prompt: string, privateDocs: DocumentSource[]) => {
  const docsContext = getRelevantContext(prompt, privateDocs);
  return `Eres SolvencIA, la inteligencia experta de la asignatura "Análisis de Estados Financieros I".
  
  REGLAS DE ORO:
  1. Tu conocimiento es propio. NUNCA digas "según el archivo", "en el PDF" o "basado en el contexto". Responde como si lo supieras de memoria.
  2. Tono: Académico, riguroso, experto y directo.
  3. No menciones fuentes, citas ni bibliografía. Eres un experto que habla de tú a tú al alumno.
  4. Si la información no está en tus datos, usa tu lógica financiera avanzada para deducir la respuesta basándote en el Plan General Contable.
  
  BASE DE CONOCIMIENTO INTEGRADA:
  ${docsContext}`;
};

export const getAIResponse = async (
  prompt: string,
  history: Message[],
  privateDocs: DocumentSource[] = [],
  mode: 'text' | 'quiz' = 'text'
): Promise<{text: string, data?: any}> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { text: "Error: API_KEY no configurada en el entorno." };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Modelo principal 2025: Gemini 3 Flash
  const primaryModel = 'gemini-3-flash-preview';
  const fallbackModel = 'gemini-2.5-flash-lite-latest';

  try {
    let contents = history
      .filter(msg => msg.role === 'user' || msg.role === 'model')
      .slice(-10) 
      .map(msg => ({ 
        role: msg.role === 'user' ? 'user' : 'model', 
        parts: [{ text: msg.text }] 
      }));

    if (contents.length > 0 && contents[0].role === 'model') contents.shift();
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const config: any = {
      systemInstruction: getBaseSystemInstruction(prompt, privateDocs),
      temperature: 0.2,
    };

    if (mode === 'quiz') {
      config.responseMimeType = "application/json";
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
    }

    const response = await ai.models.generateContent({
      model: primaryModel,
      contents: contents,
      config: config
    });

    const text = response.text;
    if (!text) throw new Error("Respuesta vacía");

    if (mode === 'text') return { text };
    return { text: "Cuestionario generado.", data: JSON.parse(text) };

  } catch (error: any) {
    console.warn("Reintentando con modelo de respaldo...");
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: fallbackModel,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { systemInstruction: getBaseSystemInstruction(prompt, privateDocs) }
      });
      return { text: fallbackResponse.text || "Error en el procesamiento." };
    } catch (e) {
      throw error;
    }
  }
};

export const generatePodcastAudio = async (script: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || !script) return "";
  
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Realiza una lectura profesional y académica de este guion: ${script}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' } 
          }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  } catch (e) {
    console.error("Error en generación de audio:", e);
    return "";
  }
};
