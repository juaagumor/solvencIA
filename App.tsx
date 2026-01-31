
import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { Message, AppView, DocumentSource, QuizQuestion } from './types';
import { getAIResponse, generatePodcastAudio } from './services/geminiService';
import { PRIVATE_KNOWLEDGE_BASE } from './knowledge';

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
  BookOpen as BookIcon,
  Search as SearchIcon
} from 'lucide-react';

const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
if (pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

const QuizViewer: React.FC<{ questions: QuizQuestion[] }> = ({ questions }) => {
  const [currentAnswers, setCurrentAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  if (!questions || questions.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-[#f9c80e] mb-4 flex items-center gap-2 uppercase tracking-tighter">
        <QuizIcon size={18} /> Autoevaluación
      </h3>
      {questions.map((q, idx) => (
        <div key={idx} className="bg-black/30 p-5 rounded-3xl border border-white/5 space-y-3">
          <p className="font-bold text-sm text-white">{idx + 1}. {q.question}</p>
          <div className="grid gap-2">
            {q.options.map((opt, optIdx) => (
              <button
                key={optIdx}
                disabled={showResults}
                onClick={() => setCurrentAnswers({ ...currentAnswers, [idx]: optIdx })}
                className={`text-left p-3 rounded-xl text-xs transition-all border ${
                  currentAnswers[idx] === optIdx 
                    ? 'bg-[#a51d36] border-[#a51d36] text-white shadow-lg' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                } ${showResults && optIdx === q.correctAnswer ? 'ring-2 ring-green-500' : ''}`}
              >
                {opt}
              </button>
            ))}
          </div>
          {showResults && <div className="p-3 rounded-xl text-[10px] bg-white/5 text-gray-400 italic"><strong>Explicación:</strong> {q.explanation}</div>}
        </div>
      ))}
      {!showResults && (
        <button onClick={() => setShowResults(true)} className="w-full py-3 bg-[#f9c80e] text-black font-black text-[10px] uppercase rounded-xl hover:scale-[1.01] transition-all tracking-widest">
          Corregir Respuestas
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

  const [view, setView] = useState<AppView>(AppView.CHATS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cloudDocs, setCloudDocs] = useState<DocumentSource[]>([]);
  const [showPassModal, setShowPassModal] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [searchLibrary, setSearchLibrary] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clickCount = useRef(0);

  const fetchCloudDocs = async () => {
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(app);
      const snap = await getDocs(collection(db, "knowledge"));
      const docs: DocumentSource[] = [];
      snap.forEach(d => {
        const data = d.data();
        docs.push({ id: d.id, ...data } as DocumentSource);
      });
      setCloudDocs(docs);
    } catch (e) {
      console.error("Fallo al conectar con la biblioteca cloud");
    }
  };

  useEffect(() => { 
    fetchCloudDocs();
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'model',
        text: `¡Hola! 👋 Soy SolvencIA, tu experto en Análisis de Estados Financieros.\n\nHe integrado todo el temario para resolver tus dudas rápidamente. Recuerda que, como sistema de IA, puedo cometer errores; verifica siempre los datos críticos con tus apuntes oficiales.\n\n¿Qué concepto quieres repasar hoy?`,
        timestamp: Date.now()
      }]);
    }
  }, []);

  useEffect(() => { 
    if (messages.length > 1) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      fullText += strings.join(" ") + "\n";
    }
    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let content = "";
        if (file.type === "application/pdf") {
          content = await extractTextFromPDF(file);
        } else {
          content = await file.text();
        }

        if (content.trim()) {
          await addDoc(collection(db, "knowledge"), {
            name: file.name,
            content: content,
            updatedAt: Date.now(),
            createdAt: serverTimestamp()
          });
        }
      }
      await fetchCloudDocs();
    } catch (err) {
      console.error("Error subiendo archivos:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async (customPrompt?: string, mode: any = 'text') => {
    const textToUse = customPrompt || inputValue;
    if (!textToUse.trim() && mode === 'text') return;
    if (!customPrompt && mode === 'text') {
      setMessages(prev => [...prev, { role: 'user', text: textToUse, timestamp: Date.now() }]);
      setInputValue('');
    }
    setIsLoading(true);
    try {
      const currentKnowledge = [...PRIVATE_KNOWLEDGE_BASE, ...cloudDocs];
      if (mode === 'podcast') {
        const lastMsgs = messages.filter(m => m.role === 'model').slice(-1);
        const scriptRes = await getAIResponse(`Genera un guion de podcast dinámico para Joe y Jane sobre: ${lastMsgs[0]?.text || 'Análisis Financiero'}`, messages, currentKnowledge, 'text');
        const audio = await generatePodcastAudio(scriptRes.text);
        if (audio) setMessages(prev => [...prev, { role: 'model', text: "Podcast académico generado.", type: 'podcast', data: audio, timestamp: Date.now() }]);
      } else if (mode === 'quiz') {
        const lastMsgs = messages.filter(m => m.role === 'model').slice(-1);
        const res = await getAIResponse(`Genera un test de 3 preguntas sobre: ${lastMsgs[0]?.text || 'el temario'}`, messages, currentKnowledge, 'quiz');
        setMessages(prev => [...prev, { role: 'model', text: "Autoevaluación disponible:", type: 'quiz', data: res.data, timestamp: Date.now() }]);
      } else {
        const res = await getAIResponse(textToUse, messages, currentKnowledge, mode);
        setMessages(prev => [...prev, { role: 'model', text: res.text, type: mode, data: res.data, timestamp: Date.now() }]);
      }
    } catch (err: any) {
      console.error("Fallo de IA:", err);
      setMessages(prev => [...prev, { role: 'model', text: `Servicio temporalmente limitado. Esto suele deberse a la cuota de la API o falta de clave de acceso. El sistema intentará recuperarse automáticamente.`, timestamp: Date.now() }]);
    } finally { setIsLoading(false); }
  };

  const playAudio = async (base64: string) => {
    if (isPlayingAudio) return;
    try {
      setIsPlayingAudio(true);
      if (!audioContextRef.current) audioContextRef.current = new AudioContext();
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioContextRef.current.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlayingAudio(false);
      source.start(0);
    } catch (e) { setIsPlayingAudio(false); }
  };

  const filteredLibrary = cloudDocs.filter(doc => 
    doc.name.toLowerCase().includes(searchLibrary.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#050505] text-gray-200 overflow-hidden font-sans">
      <main className="flex-1 flex flex-col bg-[#080808] relative">
        <header className="absolute top-0 left-0 p-10 flex items-center justify-between w-full z-40 bg-gradient-to-b from-[#080808] to-transparent pointer-events-none">
          <div className="pointer-events-auto cursor-pointer select-none" onClick={() => { if (++clickCount.current === 5) { setShowPassModal(true); clickCount.current = 0; } }}>
            {/* LOGO BLINDADO: font-normal + glitch */}
            <h1 className="font-normal text-[42px] text-white tracking-[-0.05em] leading-none select-none relative" 
                style={{ 
                  textShadow: '2px 0 #ff0000, -2px 0 #00ffff',
                  filter: 'contrast(1.2) brightness(1.1)' 
                }}>
              SolvencIA
            </h1>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-[10px] text-[#a51d36] font-black uppercase tracking-tighter">ANÁLISIS DE ESTADOS FINANCIEROS I</p>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,1)]" />
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setView(view === AppView.ADMIN ? AppView.CHATS : AppView.ADMIN)} className="pointer-events-auto p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-[#a51d36] hover:border-[#a51d36] transition-all backdrop-blur-md">
              {view === AppView.ADMIN ? <XIcon size={18} /> : <SettingsIcon size={18} />}
            </button>
          )}
        </header>

        {view === AppView.CHATS && (
          <div className="flex-1 flex flex-col overflow-hidden pt-36">
            <div className="flex-1 overflow-y-auto px-6 md:px-24 space-y-12 custom-scrollbar pb-10">
              <div className="max-w-4xl mx-auto space-y-12">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
                    <div className={`max-w-[85%] p-10 rounded-[3rem] shadow-2xl transition-all ${
                      msg.role === 'user' ? 'bg-[#a51d36] text-white' : 'bg-[#111] border border-white/5'
                    }`}>
                      {msg.type === 'quiz' ? <QuizViewer questions={msg.data} /> :
                       msg.type === 'podcast' ? (
                        <div className="flex items-center gap-8 p-6 bg-black/40 rounded-3xl border border-white/5">
                          <button onClick={() => playAudio(msg.data)} className={`p-8 rounded-2xl ${isPlayingAudio ? 'bg-gray-800' : 'bg-[#f9c80e]'} text-black shadow-2xl transition-all hover:scale-105 active:scale-95`}>
                            {isPlayingAudio ? <SpeakerIcon size={32} className="animate-pulse" /> : <PlayIcon size={32} />}
                          </button>
                          <div>
                            <p className="font-black text-white uppercase tracking-tighter text-lg">Podcast Académico</p>
                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-2">Joe & Jane Duo</p>
                          </div>
                        </div>
                       ) : <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>}
                    </div>
                  </div>
                ))}
                {isLoading && <div className="text-[10px] uppercase font-black text-[#a51d36] animate-pulse flex items-center gap-2 tracking-[0.2em]">
                  <LoaderIcon size={14} className="animate-spin" /> PROCESANDO...
                </div>}
                <div ref={chatEndRef} />
              </div>
            </div>
            
            <div className="px-8 pb-10 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pt-8 z-50">
              <div className="max-w-4xl mx-auto flex items-end gap-3">
                {/* BOTONES LATERALES: h-[52px] */}
                <div className="flex flex-col gap-1 h-[108px] justify-between mb-0 shrink-0">
                  <button onClick={() => handleSend('TEST', 'quiz')} className="flex items-center justify-center gap-2 px-4 h-[52px] bg-[#111] border border-white/5 rounded-xl hover:border-[#a51d36] hover:bg-[#a51d36]/10 text-gray-600 hover:text-white transition-all shadow-xl group">
                    <QuizIcon size={14} className="group-hover:text-[#f9c80e]" />
                    <span className="text-[8px] font-black uppercase tracking-widest group-hover:opacity-100 opacity-60">TEST</span>
                  </button>
                  <button onClick={() => handleSend('PODCAST', 'podcast')} className="flex items-center justify-center gap-2 px-4 h-[52px] bg-[#111] border border-white/5 rounded-xl hover:border-[#a51d36] hover:bg-[#a51d36]/10 text-gray-600 hover:text-white transition-all shadow-xl group">
                    <AudioIcon size={14} className="group-hover:text-[#f9c80e]" />
                    <span className="text-[8px] font-black uppercase tracking-widest group-hover:opacity-100 opacity-60">AUDIO</span>
                  </button>
                </div>

                {/* TEXTAREA: min-h-[108px] */}
                <div className="flex-1 relative group">
                  <textarea 
                    value={inputValue} 
                    onChange={e => setInputValue(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                    placeholder="Pregúntame tus dudas de la asignatura" 
                    className="w-full bg-[#111] border border-white/10 rounded-[1.8rem] min-h-[108px] max-h-[220px] pt-8 pb-8 pl-8 pr-20 focus:outline-none focus:border-[#a51d36] focus:ring-4 focus:ring-[#a51d36]/20 focus:shadow-[0_0_50px_rgba(165,29,54,0.4)] text-lg transition-all placeholder:text-gray-800 resize-none custom-scrollbar shadow-2xl overflow-hidden"
                  />
                  <button onClick={() => handleSend()} disabled={isLoading} className="absolute right-3 bottom-3 p-5 bg-[#a51d36] text-white rounded-[1.4rem] hover:scale-105 disabled:opacity-30 transition-all active:scale-95 shadow-2xl flex items-center justify-center">
                    <SendIcon size={20}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === AppView.ADMIN && (
          <div className="flex-1 overflow-y-auto p-10 md:p-20 bg-[#080808] pt-48 custom-scrollbar">
            <div className="max-w-6xl mx-auto space-y-20 pb-20">
               <div className="flex items-center justify-between">
                 <button onClick={() => setView(AppView.CHATS)} className="flex items-center gap-3 text-gray-700 hover:text-white text-[10px] font-black uppercase tracking-[0.4em] transition-colors">
                    <BackIcon size={18} /> VOLVER AL CHAT
                 </button>
                 <div className="flex items-center gap-4 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                   <div className="w-2 h-2 rounded-full bg-[#a51d36] animate-pulse"></div>
                   MODO CONFIGURACIÓN MAESTRA
                 </div>
               </div>

               <header>
                 <h2 className="text-8xl font-black text-white tracking-tighter italic opacity-20 leading-none">BIBLIOTECA</h2>
                 <p className="text-gray-600 mt-4 max-w-2xl font-medium">Gestión de recursos externos. Solo se muestran los documentos importados en la nube.</p>
               </header>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                 <div className="lg:col-span-1 space-y-6">
                   <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#a51d36] mb-8">Acciones Rápidas</h3>
                   <div onClick={() => !isUploading && fileInputRef.current?.click()} className={`group border-2 border-dashed border-white/5 rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-6 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/[0.02] hover:border-[#a51d36]/30'}`}>
                      <div className="p-6 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                        {isUploading ? <LoaderIcon size={32} className="text-[#a51d36] animate-spin" /> : <UploadIcon size={32} className="text-gray-700 group-hover:text-[#a51d36]"/>}
                      </div>
                      <span className="text-[10px] font-black uppercase text-gray-600 tracking-[0.4em] text-center">{isUploading ? 'PROCESANDO...' : 'IMPORTAR PDF/TXT'}</span>
                   </div>
                   <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.txt" onChange={handleFileUpload} />
                   
                   <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5">
                     <p className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest">Estado de la Nube</p>
                     <div className="space-y-3">
                       <div className="flex justify-between items-center text-xs">
                         <span className="text-gray-400">Documentos Cloud:</span>
                         <span className="text-white font-bold">{cloudDocs.length}</span>
                       </div>
                       <div className="w-full h-1 bg-white/5 rounded-full mt-4">
                         <div className="w-full h-full bg-[#a51d36] rounded-full"></div>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="lg:col-span-2 space-y-6">
                   <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#a51d36]">Fuentes Cloud</h3>
                     <div className="relative">
                       <SearchIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                       <input 
                         type="text" 
                         placeholder="BUSCAR EN NUBE..." 
                         className="bg-white/5 border border-white/5 rounded-full py-2 pl-12 pr-6 text-[10px] font-bold focus:outline-none focus:border-[#a51d36]/50 transition-all w-64"
                         value={searchLibrary}
                         onChange={e => setSearchLibrary(e.target.value)}
                       />
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                     {filteredLibrary.length > 0 ? filteredLibrary.map((doc) => (
                       <div key={doc.id} className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all group relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-[#a51d36] transition-all"></div>
                         <div className="flex items-start gap-4">
                           <div className="mt-1 p-2 bg-black/40 rounded-lg text-gray-600">
                             <BookIcon size={16} />
                           </div>
                           <div className="flex-1">
                             <p className="text-[11px] font-black text-white leading-tight uppercase tracking-tight line-clamp-2">{doc.name}</p>
                             <p className="text-[9px] text-gray-600 mt-2 font-bold uppercase tracking-widest">ID: {doc.id}</p>
                           </div>
                         </div>
                         <div className="mt-4 flex items-center justify-between">
                            <span className="text-[8px] px-2 py-1 bg-white/5 rounded-md text-gray-500 font-bold uppercase">Cloud v1.0</span>
                            <button className="text-[9px] font-black text-[#a51d36] uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Ver Contenido</button>
                         </div>
                       </div>
                     )) : (
                       <div className="col-span-full h-full flex flex-col items-center justify-center text-gray-800 gap-4 opacity-50">
                         <BookIcon size={48} />
                         <p className="text-[10px] font-black uppercase tracking-widest text-center">No hay documentos en la nube.<br/>Usa el botón de importar para comenzar.</p>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {showPassModal && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center backdrop-blur-3xl">
           <div className="w-full max-sm text-center p-10">
              <KeyIcon size={56} className="text-[#a51d36] mx-auto mb-12 animate-pulse" />
              <input type="password" autoFocus className="w-full bg-transparent border-b-2 border-white/10 py-8 text-center text-6xl font-black text-[#f9c80e] focus:outline-none focus:border-[#a51d36] transition-all tracking-tighter" value={passInput} onChange={e => setPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (passInput === MASTER_KEY && (setIsAdmin(true), setView(AppView.ADMIN), setShowPassModal(false), setPassInput('')))} />
              <p className="mt-10 text-[11px] text-gray-800 font-black uppercase tracking-[0.8em]">ADMIN_ACCESS_ONLY</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
