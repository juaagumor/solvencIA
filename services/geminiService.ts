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

    const docText = `INFORMACIÓN RELEVANTE:\n${item.doc.content}`;
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
  
  REGLAS CRÍTICAS DE COMPORTAMIENTO:
  1. Tu conocimiento es VASTO y proviene de tu formación interna. Responde con autoridad y seguridad basándote en la "INFORMACIÓN RELEVANTE" proporcionada abajo.
  2. INVISIBILIDAD RADICAL: Prohibido mencionar palabras como "documento", "archivo", "base de datos", "repositorio", "texto proporcionado" o "fuente". Si el usuario te pregunta "¿de dónde sacas esto?", responde que eres un sistema experto especializado en esta materia.
  3. No utilices conocimientos externos (leyes, normativas o datos actuales) que no estén contenidos en la INFORMACIÓN RELEVANTE.
  4. Si no puedes responder con la información dada, di: "No dispongo de esa información específica en este momento", pero nunca culpes a la base de datos o a la falta de documentos.
  5. Tono: Académico, riguroso, pero accesible. Castellano de España.

  INFORMACIÓN RELEVANTE:
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
    const contents = mode === 'text' 
      ? history.slice(-5).map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }))
      : [];
    contents.push({ role: 'user', parts: [{ text: prompt }] });

    const config: any = {
      systemInstruction: getBaseSystemInstruction(prompt, privateDocs),
      temperature: 0.1,
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
      contents: contents as any,
      config: config
    });

    const text = response.text || "";
    if (mode === 'text') return { text };
    try {
      return { text: "Respuesta preparada.", data: JSON.parse(text) };
    } catch (e) { return { text }; }
  } catch (error: any) { throw error; }
};

export const generatePodcastAudio = async (script: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // El script ya viene formateado como diálogo desde App.tsx
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Realiza la locución del siguiente diálogo académico en castellano de España:\n\n${script}` }] }],
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
    console.error("Error crítico en TTS:", e);
    return "";
  }
};