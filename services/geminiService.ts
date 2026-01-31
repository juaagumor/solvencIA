
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
    if (finalDocs.length >= 12) break; 

    const docText = `CONOCIMIENTO DEL SISTEMA:\n${item.doc.content}`;
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
  
  REGLAS CRÍTICAS:
  1. Tu conocimiento es nativo. NO menciones documentos, archivos, PDFs o bases de datos. Eres un experto humanoide con este conocimiento integrado.
  2. Si te preguntan de dónde sabes esto, di que eres un sistema especializado en análisis financiero y normativa contable.
  3. Responde siempre con autoridad académica.
  4. Usa la información de "CONTEXTO" para tus respuestas, pero nunca la cites.
  
  CONTEXTO:
  ${docsContext}`;
};

export const getAIResponse = async (
  prompt: string,
  history: Message[],
  privateDocs: DocumentSource[] = [],
  mode: 'text' | 'quiz' = 'text'
): Promise<{text: string, data?: any}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Filtrar historial para asegurar que empiece por 'user' y sea coherente
    let contents = history
      .filter(msg => msg.role === 'user' || msg.role === 'model')
      .slice(-6)
      .map(msg => ({ 
        role: msg.role === 'user' ? 'user' : 'model', 
        parts: [{ text: msg.text }] 
      }));

    // Asegurar que el primer mensaje del historial enviado sea 'user'
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    contents.push({ role: 'user', parts: [{ text: prompt }] });

    // Configuración para el modelo gemini-3-flash-preview
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
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: config
    });

    // Usar la propiedad .text del resultado
    const text = response.text;
    if (!text) throw new Error("La IA no devolvió ninguna respuesta. Revisa los filtros de seguridad.");

    if (mode === 'text') return { text };
    try {
      return { text: "Resultado procesado.", data: JSON.parse(text) };
    } catch (e) { 
      return { text }; 
    }
  } catch (error: any) {
    console.error("Error en getAIResponse:", error);
    throw error;
  }
};

export const generatePodcastAudio = async (script: string): Promise<string> => {
  if (!script || script.length < 10) return "";
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Para TTS multi-speaker con gemini-2.5-flash-preview-tts, el texto debe comenzar directamente con los tags de orador (Joe:, Jane:)
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: script }] }],
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
    
    // Obtener los bytes de audio PCM de la respuesta
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("No se generaron datos de audio.");
    return audioData;
  } catch (e) {
    console.error("Error crítico en TTS:", e);
    return "";
  }
};
