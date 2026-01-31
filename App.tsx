import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  writeBatch, 
  deleteDoc 
} from 'firebase/firestore';
import { Message, AppView, DocumentSource, QuizQuestion } from './types';
import { getAIResponse, generatePodcastAudio } from './services/geminiService';
import { PRIVATE_KNOWLEDGE_BASE } from './knowledge';

// Iconos de Lucide
import { 
  Send as SendIcon, 
  X as XIcon, 
  Key as KeyIcon, 
  Headphones as AudioIcon, 
  Award as QuizIcon, 
  Play as PlayIcon, 
  Volume2 as SpeakerIcon, 
  Settings as SettingsIcon, 
  ArrowLeft as BackIcon, 
  FileUp as UploadIcon, 
  Loader2 as LoaderIcon, 
  RefreshCw as RefreshIcon,
  Trash2 as TrashIcon
} from 'lucide-react';

const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const QuizViewer: React.FC<{ questions: QuizQuestion[] }> = ({ questions }) => {
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  if (!questions || !Array.isArray(questions) || questions.length === 0) return <p className="text-gray-500 italic p-4">Analizando contenidos para el test...</p>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-[#f9c80e] mb-4 flex items-center gap-2 uppercase tracking-tighter">
        <QuizIcon size={20} /> Autoevaluación Contextual
      </h3>
      {questions.map((q, idx) => (
        <div key={idx} className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-3">
          <p className="font-bold text-sm text-white">{idx + 1}. {q.question}</p>
          <div className="grid gap-2">
            {q.options.map((opt, optIdx) => (
              <button
                key={optIdx}
                disabled={showResults}
                onClick={() => setCurrentAnswers({ ...currentAnswers, [idx]: optIdx })}
                className={`text-left p-3 rounded-xl text-xs transition-all border ${
                  currentAnswers[idx] === optIdx 
                    ? 'bg-[#a51d36] border-[#a51d36] text-white' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                } ${showResults && optIdx === q.correctAnswer ? 'ring-2 ring-green-500' : ''}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {showResults && <div className="p-3 rounded-xl text-[10px] bg-white/5 text-gray-400 italic"><strong>Nota:</strong> {q.explanation}</div>}
        </div>
      ))}
      {!showResults && (
        <button onClick={() => setShowResults(true)} className="w-full py-3 bg-[#f9c80e] text-black font-black text-xs uppercase rounded-xl hover:scale-[1.01] transition-transform shadow-lg">
          Finalizar y Corregir
        </button>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const MASTER_KEY = "US-2025";
  const firebaseConfig = {
    apiKey: "AIzaSyCHEAxiJ6Onsi1ONx-ul8FKfliETUuC8UY",
    authDomain: "solvencia-254a4.firebaseapp.com",
    projectId: "solvencia-254a4",
    storageBucket: "solvencia-254a4.firebasestorage.app",
    messagingSenderId: "287316473049",
    appId: "1:287316473049:web:5e456fd9fd113e628c3ac8"
  };

  const appName = "SolvencIA";

  const [view, setView] = useState<AppView>(AppView.CHATS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [trainingDocs, setTrainingDocs] = useState<DocumentSource[]>([]);
  const [cloudDocs, setCloudDocs] = useState<DocumentSource[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [showPassModal, setShowPassModal] = useState(false);
  const [passInput, setPassInput] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clickCount = useRef(0);

  useEffect(() => { initFirebase(); }, []);

  const initFirebase = async () => {
    try {
      setDbStatus('idle');
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(app);
      const querySnapshot = await getDocs(collection(db, "knowledge"));
      const docs: DocumentSource[] = [];
      querySnapshot.forEach((doc) => { docs.push(doc.data() as DocumentSource); });
      setCloudDocs(docs);
      setDbStatus('connected');
    } catch (err) { 
      console.error("Firebase Init Error:", err);
      setDbStatus('error'); 
    }
  };

  const deleteFromCloud = async (id: string) => {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(app);
      await deleteDoc(doc(db, "knowledge", id));
      setCloudDocs(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Error deleting doc:", err);
    }
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'model',
        text: `¡Hola! 👋 Soy tu asistente de estudio inteligente. He analizado a fondo todo el material de la asignatura para ayudarte a despejar dudas y repasar conceptos. Ten en cuenta que, como IA, puedo cometer errores; verifica siempre los datos críticos.\n\n¿En qué puedo ayudarte hoy?`,
        timestamp: Date.now()
      }]);
    }
  }, []);

  useEffect(() => { 
    if (messages.length > 1) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }
  }, [messages]);

  const handleSend = async (customPrompt?: string, mode: any = 'text') => {
    const textToUse = customPrompt || inputValue;
    if (!textToUse.trim() && mode === 'text') return;
    
    if (!customPrompt && mode === 'text') {
      setMessages(prev => [...prev, { role: 'user', text: textToUse, timestamp: Date.now() }]);
      setInputValue('');
    }
    
    setIsLoading(true);
    try {
      const currentKnowledge = [...PRIVATE_KNOWLEDGE_BASE, ...cloudDocs, ...trainingDocs];
      
      if (mode === 'podcast') {
        const lastModelMessages = messages.filter(m => m.role === 'model' && m.type !== 'podcast').slice(-2);
        const contextText = lastModelMessages.map(m => m.text).join("\n\n");
        
        const podcastScriptPrompt = `Basándote EXCLUSIVAMENTE en la información académica que acabas de explicar anteriormente:
        "${contextText}"
        
        Genera un guion de podcast EXTENSO (aproximadamente 350-400 palabras, para una duración de 1 minuto y 30 segundos).
        El tono debe ser educativo, dinámico y muy claro.
        
        ESTRUCTURA OBLIGATORIA (Empieza directamente con los oradores):
        Joe: (Profesor experto, introduce el tema con autoridad y detalle)
        Jane: (Alumna curiosa, hace preguntas inteligentes para profundizar en los conceptos explicados)
        Joe: (Explica los detalles técnicos complejos de forma extensa)
        Jane: (Resume lo aprendido o pide una aclaración adicional sobre un punto clave)
        Joe: (Conclusión magistral y cierre profesional)
        
        No menciones fuentes externas ni archivos. Usa castellano de España.`;
        
        const scriptRes = await getAIResponse(podcastScriptPrompt, messages, currentKnowledge, 'text');
        if (!scriptRes.text) throw new Error("No se pudo generar el guión del podcast.");
        
        const audioBase64 = await generatePodcastAudio(scriptRes.text);
        if (audioBase64) {
          setMessages(prev => [...prev, { role: 'model', text: "Podcast académico (1:30 min) generado sobre el tema discutido.", type: 'podcast', data: audioBase64, timestamp: Date.now() }]);
        } else {
          throw new Error("El servicio de voz no respondió correctamente.");
        }
      } else if (mode === 'quiz') {
        const lastModelMessages = messages.filter(m => m.role === 'model' && m.type !== 'quiz').slice(-2);
        const contextText = lastModelMessages.map(m => m.text).join("\n\n");
        
        const quizPrompt = `Genera un test de 3 preguntas de opción múltiple basado estrictamente en el contenido explicado anteriormente:
        "${contextText}"
        
        Si no hay contenido suficiente, usa el conocimiento general de la asignatura para crear preguntas desafiantes.`;
        
        const res = await getAIResponse(quizPrompt, messages, currentKnowledge, 'quiz');
        setMessages(prev => [...prev, { role: 'model', text: "Aquí tienes un test de autoevaluación sobre lo que acabamos de ver:", type: 'quiz', data: res.data, timestamp: Date.now() }]);
      } else {
        const res = await getAIResponse(textToUse, messages, currentKnowledge, mode);
        setMessages(prev => [...prev, { role: 'model', text: res.text, type: mode, data: res.data, timestamp: Date.now() }]);
      }
    } catch (err: any) {
      console.error("HandleSend Error:", err);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "Lo siento, ha ocurrido un error al procesar tu consulta. (Error: " + (err.message || "Desconocido") + ")", 
        timestamp: Date.now() 
      }]);
    } finally { 
      setIsLoading(false); 
    }
  };

  const playAudio = async (base64: string) => {
    if (isPlayingAudio || !base64) return;
    try {
      setIsPlayingAudio(true);
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      
      const dataInt16 = new Int16Array(bytes.buffer, 0, Math.floor(bytes.length / 2));
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlayingAudio(false);
      source.start(0);
    } catch (e) { 
      console.error("Audio Playback Error:", e);
      setIsPlayingAudio(false); 
    }
  };

  const syncToFirebase = async () => {
    setIsSyncing(true);
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(app);
      const batch = writeBatch(db);
      for (const d of trainingDocs) {
        const docRef = doc(db, "knowledge", d.id);
        batch.set(docRef, d);
      }
      await batch.commit();
      setTrainingDocs([]);
      await initFirebase();
      alert("¡Sincronización exitosa!");
    } catch (err) { 
      console.error("Sync Error:", err);
      alert("Error al sincronizar."); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsProcessing(true);
    const newDocs: DocumentSource[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        let text = "";
        if (file.type === "application/pdf") {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const content = await page.getTextContent();
            text += content.items.map((it: any) => it.str).join(" ") + "\n";
          }
        } else { text = await file.text(); }
        if (text.trim()) {
          newDocs.push({ id: `doc-${Date.now()}-${i}`, name: file.name, content: text.trim(), updatedAt: Date.now() });
        }
      } catch (err) { console.error("File Error:", err); }
    }
    setTrainingDocs(prev => [...prev, ...newDocs]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex h-screen bg-[#050505] text-gray-200 overflow-hidden font-sans">
      <main className="flex-1 flex flex-col bg-[#080808] relative">
        <header className="absolute top-0 left-0 p-8 flex items-center justify-between w-full z-40 bg-gradient-to-b from-[#080808] to-transparent pointer-events-none">
          <div className="pointer-events-auto cursor-pointer select-none" onClick={() => {
            clickCount.current += 1;
            if (clickCount.current === 5) { setShowPassModal(true); clickCount.current = 0; }
          }}>
            <h1 className="font-black text-4xl text-white tracking-tighter">{appName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[11px] text-[#a51d36] font-black uppercase tracking-tight">ANÁLISIS DE ESTADOS FINANCIEROS I</p>
              <div className="w-2 h-2 rounded-full bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.6)]" />
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setView(view === AppView.ADMIN ? AppView.CHATS : AppView.ADMIN)} className="pointer-events-auto p-4 bg-white/5 rounded-3xl border border-white/10 text-gray-400 hover:text-white transition-all shadow-2xl backdrop-blur-md">
              {view === AppView.ADMIN ? <XIcon size={24} /> : <SettingsIcon size={24} />}
            </button>
          )}
        </header>

        {view === AppView.CHATS && (
          <div className="flex-1 flex flex-col overflow-hidden pt-32">
            <div className="flex-1 overflow-y-auto px-6 md:px-20 space-y-10 custom-scrollbar pb-32">
              <div className="max-w-4xl mx-auto space-y-10">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
                    <div className={`max-w-[85%] p-8 rounded-[2.5rem] shadow-2xl transition-all ${
                      msg.role === 'user' ? 'bg-[#a51d36] text-white' : 'bg-[#121212] border border-white/5'
                    }`}>
                      {msg.type === 'quiz' ? <QuizViewer questions={msg.data} /> :
                       msg.type === 'podcast' ? (
                        <div className="flex items-center gap-6 p-4 bg-black/20 rounded-3xl border border-white/5">
                          <button onClick={() => playAudio(msg.data)} className={`p-6 rounded-2xl ${isPlayingAudio ? 'bg-gray-800' : 'bg-[#f9c80e]'} text-black transition-all hover:scale-105`}>
                            {isPlayingAudio ? <SpeakerIcon size={28} className="animate-pulse" /> : <PlayIcon size={28} />}
                          </button>
                          <div>
                            <p className="text-md font-black text-white italic uppercase tracking-tighter">Podcast Académico (1:30 min)</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Dúo SolvencIA • Joe & Jane</p>
                          </div>
                        </div>
                       ) : <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>}
                    </div>
                  </div>
                ))}
                {isLoading && <div className="text-[10px] uppercase font-black text-[#a51d36] animate-pulse flex items-center gap-2">
                  <LoaderIcon size={12} className="animate-spin" /> Procesando información académica...
                </div>}
              </div>
              <div ref={chatEndRef} />
            </div>
            
            <div className="px-8 pb-8 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pt-12 relative z-50">
              <div className="max-w-4xl mx-auto flex items-end gap-4">
                {/* Columna de Herramientas a la Izquierda */}
                <div className="flex flex-col gap-2 mb-2">
                  {[
                    { id: 'quiz', name: 'Test', prompt: 'TEST', icon: QuizIcon },
                    { id: 'podcast', name: 'Podcast', prompt: 'PODCAST', icon: AudioIcon },
                  ].map(tool => (
                    <button 
                      key={tool.id} 
                      onClick={() => handleSend(tool.prompt, tool.id as any)} 
                      title={tool.name}
                      className="flex items-center justify-center gap-2 w-12 h-12 md:w-auto md:px-4 bg-[#111] border border-white/5 rounded-2xl hover:border-[#a51d36] transition-all text-[10px] font-black uppercase text-gray-500 hover:text-white shadow-xl group"
                    >
                      <tool.icon size={18} className="md:size-4" />
                      <span className="hidden md:block">{tool.name}</span>
                    </button>
                  ))}
                </div>

                {/* Área de Texto Principal */}
                <div className="flex-1 relative group shadow-2xl">
                  <textarea 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Pregúntame tus dudas de la asignatura"
                    className="w-full bg-[#111] border border-white/10 rounded-[2.5rem] min-h-[90px] max-h-[160px] pt-6 pb-6 pl-8 pr-20 focus:outline-none focus:ring-4 focus:ring-[#a51d36]/20 text-lg transition-all placeholder:text-gray-800 resize-none custom-scrollbar"
                  />
                  <div className="absolute right-4 bottom-4">
                    <button 
                      onClick={() => handleSend()} 
                      disabled={isLoading} 
                      className="p-4 bg-[#a51d36] text-white rounded-[1.5rem] hover:scale-110 shadow-2xl disabled:opacity-30 transition-all active:scale-95"
                    >
                      <SendIcon size={24}/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === AppView.ADMIN && (
          <div className="flex-1 overflow-y-auto p-16 bg-[#080808] pt-40 custom-scrollbar">
            <div className="max-w-5xl mx-auto">
               <button onClick={() => setView(AppView.CHATS)} className="flex items-center gap-2 text-gray-600 hover:text-white mb-10 text-[10px] font-black uppercase tracking-widest">
                  <BackIcon size={16} /> Volver a Chats
               </button>
               <h2 className="text-7xl font-black text-white tracking-tighter mb-20 italic">Panel Maestro</h2>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="bg-[#111] p-12 rounded-[4rem] border border-white/5">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase mb-10 tracking-[0.5em]">Ingesta de Datos</h3>
                    <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dotted border-white/5 rounded-3xl p-20 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/5 transition-all">
                       <UploadIcon size={64} className="text-gray-800"/>
                       <span className="text-[11px] font-black uppercase text-gray-600">Subir PDF del Temario</span>
                    </div>
                  </div>
                  <div className="bg-[#111] p-12 rounded-[4rem] border border-white/5">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase mb-10 tracking-[0.5em]">Almacén en Nube ({cloudDocs.length})</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {cloudDocs.length === 0 && <p className="text-[10px] text-gray-700 italic">No hay documentos cargados.</p>}
                      {cloudDocs.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-black/40 rounded-2xl border border-white/5">
                          <span className="text-[11px] font-bold text-white truncate max-w-[200px]">{d.name}</span>
                          <button onClick={() => deleteFromCloud(d.id)} className="text-gray-700 hover:text-red-500 transition-colors"><TrashIcon size={18} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
               <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} accept=".pdf,.txt" />
            </div>
          </div>
        )}
      </main>

      {showPassModal && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center backdrop-blur-md">
           <div className="w-full max-w-sm text-center animate-in">
              <KeyIcon size={48} className="text-[#a51d36] mx-auto mb-10 animate-bounce" />
              <input type="password" autoFocus className="w-full bg-transparent border-b-2 border-white/10 py-4 text-center text-4xl font-black text-[#f9c80e] focus:outline-none focus:border-[#a51d36] transition-colors" value={passInput} onChange={e => setPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (passInput === MASTER_KEY && (setIsAdmin(true), setView(AppView.ADMIN), setShowPassModal(false), setPassInput('')))} />
              <p className="mt-8 text-[10px] text-gray-700 font-black uppercase tracking-[0.4em]">Acceso Restringido</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;