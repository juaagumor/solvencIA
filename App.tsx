import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch, deleteDoc } from 'firebase/firestore';
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
      <h3 className="text-lg font-bold text-[#f9c80e] mb-4 flex items-center gap-2">
        <QuizIcon size={20} /> Autoevaluación
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
        <button onClick={() => setShowResults(true)} className="w-full py-3 bg-[#f9c80e] text-black font-black text-xs uppercase rounded-xl hover:scale-[1.01] transition-transform">
          Finalizar
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
  const deptName = "Análisis de Estados Financieros I";

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
    } catch (err) { setDbStatus('error'); }
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'model',
        text: `¡Hola! 👋 Soy tu asistente de estudio inteligente. He analizado a fondo todo el material de la asignatura Análisis de Estados Financieros I para ayudarte a despejar dudas, resumir conceptos y generar contenido de repaso en segundos.\n\n⚠️ Recuerda: Aunque soy avanzado, a veces puedo cometer errores. ¡Vamos a por ese aprobado!`,
        timestamp: Date.now()
      }]);
    }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (customPrompt?: string, mode: any = 'text') => {
    const textToUse = customPrompt || inputValue;
    if (!textToUse.trim() || isLoading) return;
    if (!customPrompt) {
      setMessages(prev => [...prev, { role: 'user', text: textToUse, timestamp: Date.now() }]);
      setInputValue('');
    }
    setIsLoading(true);
    try {
      const currentKnowledge = [...PRIVATE_KNOWLEDGE_BASE, ...cloudDocs, ...trainingDocs];
      if (mode === 'podcast') {
        const context = customPrompt ? textToUse : (messages[messages.length - 1]?.text || textToUse);
        const podcastScriptPrompt = `Genera un guión breve y dinámico de unos 30 segundos sobre: ${context}. 
        IMPORTANTE: El formato debe ser estrictamente este:
        Joe: (Profesor con tono experto y académico de España)
        Jane: (Alumna curiosa que pregunta para aclarar)
        Joe: (Concluye magistralmente)`;
        
        const scriptRes = await getAIResponse(podcastScriptPrompt, messages, currentKnowledge, 'text');
        const audioBase64 = await generatePodcastAudio(scriptRes.text);
        if (audioBase64) {
          setMessages(prev => [...prev, { role: 'model', text: "Podcast académico generado correctamente.", type: 'podcast', data: audioBase64, timestamp: Date.now() }]);
        } else {
          setMessages(prev => [...prev, { role: 'model', text: "Lo siento, ha habido un problema técnico al generar el audio. Por favor, inténtalo de nuevo.", timestamp: Date.now() }]);
        }
      } else {
        const res = await getAIResponse(textToUse, messages, currentKnowledge, mode);
        setMessages(prev => [...prev, { role: 'model', text: res.text, type: mode, data: res.data, timestamp: Date.now() }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', text: "Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, inténtalo de nuevo en unos momentos.", timestamp: Date.now() }]);
    } finally { setIsLoading(false); }
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
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const dataInt16 = new Int16Array(bytes.buffer);
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
      initFirebase();
      alert("¡Conocimiento sincronizado con éxito!");
    } catch (err) { alert("Error al sincronizar con la nube."); }
    finally { setIsSyncing(false); }
  };

  const deleteFromCloud = async (docId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este contenido?")) return;
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(app);
      await deleteDoc(doc(db, "knowledge", docId));
      initFirebase();
    } catch (err) { alert("Error al eliminar el contenido."); }
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
      } catch (err) { console.error("File Processing Error:", err); }
    }
    setTrainingDocs(prev => [...prev, ...newDocs]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const verifyAdmin = () => {
    if (passInput === MASTER_KEY) {
      setIsAdmin(true);
      setView(AppView.ADMIN);
      setShowPassModal(false);
      setPassInput('');
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-gray-200 overflow-hidden font-sans">
      <main className="flex-1 flex flex-col bg-[#080808] relative">
        <header className="absolute top-0 left-0 p-6 flex items-center justify-between w-full z-40 bg-gradient-to-b from-[#080808] to-transparent pointer-events-none">
          <div className="flex items-center gap-4 select-none pointer-events-auto cursor-pointer" onClick={() => {
            clickCount.current += 1;
            if (clickCount.current === 5) { setShowPassModal(true); clickCount.current = 0; }
          }}>
            <div className="flex flex-col">
              <h1 className="font-black text-2xl text-white leading-none tracking-tight">{appName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] text-[#a51d36] font-black uppercase tracking-tighter">{deptName}</p>
                {dbStatus === 'connected' && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
              </div>
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setView(view === AppView.ADMIN ? AppView.CHATS : AppView.ADMIN)} className="pointer-events-auto p-3 bg-white/5 rounded-2xl border border-white/10 text-gray-400 hover:text-white transition-all shadow-xl">
              {view === AppView.ADMIN ? <XIcon size={20} /> : <SettingsIcon size={20} />}
            </button>
          )}
        </header>

        {view === AppView.CHATS && (
          <div className="flex-1 flex flex-col overflow-hidden pt-24">
            <div className="flex-1 overflow-y-auto p-4 md:px-12 space-y-8 custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-8 pb-40">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
                    <div className={`max-w-[90%] p-6 rounded-[2rem] shadow-2xl transition-all ${
                      msg.role === 'user' ? 'bg-[#a51d36] text-white' : 'bg-[#121212] border border-white/5'
                    }`}>
                      {msg.type === 'quiz' ? <QuizViewer questions={msg.data} /> :
                       msg.type === 'podcast' ? (
                        <div className="flex items-center gap-5 p-2">
                          <button onClick={() => playAudio(msg.data)} className={`p-5 rounded-2xl ${isPlayingAudio ? 'bg-gray-800' : 'bg-[#f9c80e]'} text-black shadow-xl hover:scale-105 active:scale-95 transition-transform`}>
                            {isPlayingAudio ? <SpeakerIcon size={24} className="animate-pulse" /> : <PlayIcon size={24} />}
                          </button>
                          <div>
                            <p className="text-sm font-bold text-white">Escuchar Podcast Académico</p>
                            <p className="text-[10px] text-gray-500 mt-1 uppercase font-black tracking-widest">Dúo SolvencIA</p>
                          </div>
                        </div>
                       ) : <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>}
                    </div>
                  </div>
                ))}
                {isLoading && <div className="max-w-3xl mx-auto italic text-gray-600 animate-pulse text-[10px] uppercase font-black mt-4">Procesando consulta...</div>}
              </div>
              <div ref={chatEndRef} />
            </div>
            
            <div className="px-8 pb-8 bg-gradient-to-t from-[#050505] to-transparent pt-12">
              <div className="max-w-3xl mx-auto">
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                  {[
                    { id: 'quiz', name: 'Test Express', prompt: 'Genera 3 preguntas de autoevaluación sobre: ', icon: QuizIcon },
                    { id: 'podcast', name: 'Podcast Dúo', prompt: 'Explica mediante un diálogo académico: ', icon: AudioIcon },
                  ].map(tool => (
                    <button key={tool.id} onClick={() => handleSend(tool.prompt + (inputValue || "los conceptos clave analizados"), tool.id as any)} className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-white/5 rounded-xl hover:border-[#a51d36]/40 transition-all text-[9px] font-black uppercase text-gray-500 shadow-lg">
                      <tool.icon size={12} /> <span>{tool.name}</span>
                    </button>
                  ))}
                </div>
                <div className="relative group">
                  <textarea 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Pregunta cualquier duda sobre el temario..."
                    className="w-full bg-[#111] border border-white/5 rounded-[2.5rem] min-h-[120px] pt-8 pb-16 pl-10 pr-24 focus:outline-none focus:ring-2 focus:ring-[#a51d36]/20 text-lg transition-all shadow-2xl placeholder:text-gray-800 resize-none"
                  />
                  <div className="absolute right-6 bottom-6">
                    <button onClick={() => handleSend()} disabled={isLoading} className="p-5 bg-[#a51d36] text-white rounded-3xl hover:scale-105 shadow-2xl disabled:opacity-30 transition-all">
                      <SendIcon size={24}/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === AppView.ADMIN && (
          <div className="flex-1 overflow-y-auto p-12 bg-[#080808] pt-24 custom-scrollbar">
            <div className="max-w-5xl mx-auto">
               <button onClick={() => setView(AppView.CHATS)} className="flex items-center gap-2 text-gray-600 hover:text-white mb-10 text-[10px] font-black uppercase tracking-widest">
                  <BackIcon size={16} /> Volver
               </button>
               <h2 className="text-5xl font-black text-white tracking-tighter mb-16 italic underline decoration-[#a51d36] decoration-4">Panel de Gestión</h2>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                      <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 italic tracking-widest">Actualizar Conocimiento</h3>
                      <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed ${isProcessing ? 'border-[#f9c80e]' : 'border-white/5'} rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-all min-h-[160px]`}>
                         {isProcessing ? <LoaderIcon size={40} className="text-[#f9c80e] animate-spin"/> : <UploadIcon size={40} className="text-gray-700"/>}
                         <span className="text-[10px] font-black uppercase text-gray-500">Subir Material PDF</span>
                      </div>
                    </div>
                    {trainingDocs.length > 0 && (
                      <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5 shadow-2xl animate-in">
                        <h3 className="text-[10px] font-black text-[#f9c80e] uppercase mb-4">Pendientes de Sincronización ({trainingDocs.length})</h3>
                        <div className="space-y-2">
                          {trainingDocs.map((d, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/5">
                               <span className="text-[10px] text-white truncate max-w-[150px] font-bold">{d.name}</span>
                               <button onClick={() => setTrainingDocs(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500"><TrashIcon size={14} /></button>
                            </div>
                          ))}
                        </div>
                        <button onClick={syncToFirebase} disabled={isSyncing} className="w-full mt-6 py-4 bg-[#a51d36] text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] transition-transform">
                          {isSyncing ? <LoaderIcon size={14} className="animate-spin"/> : <RefreshIcon size={14}/>} Sincronizar Nube
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="bg-[#111] p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 italic tracking-widest">Memoria Almacenada ({cloudDocs.length})</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {cloudDocs.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                          <span className="text-[10px] font-bold text-white truncate max-w-[150px]">{d.name}</span>
                          <button onClick={() => deleteFromCloud(d.id)} className="text-gray-700 hover:text-red-500 transition-colors"><TrashIcon size={14} /></button>
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
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm">
           <div className="w-full max-w-sm text-center animate-in">
              <KeyIcon size={48} className="text-[#a51d36] mx-auto mb-10" />
              <input type="password" autoFocus className="w-full bg-transparent border-b-2 border-white/10 py-4 text-center text-4xl font-black text-[#f9c80e] focus:outline-none focus:border-[#a51d36] transition-colors" value={passInput} onChange={e => setPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyAdmin()} />
              <p className="mt-8 text-[10px] text-gray-700 font-black uppercase tracking-[0.3em]">Acceso Maestro Restringido</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;