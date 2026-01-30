
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Sparkles, X, ShieldCheck, Database, Key, Trash2, Headphones, 
  Award, Play, Volume2, FileText, Settings, GraduationCap, 
  BarChart3, Landmark, Calculator, Image as ImageIcon, CheckCircle2,
  GitGraph, PlusCircle, Copy, Check, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import { Message, AppView, DocumentSource, QuizQuestion, ConceptMap } from './types';
import { getAIResponse, generatePodcastAudio } from './services/geminiService';
import { PRIVATE_KNOWLEDGE_BASE } from './knowledge';

const App: React.FC = () => {
  const MASTER_KEY = "US-2025";

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('sol_branding_v7');
    return saved ? JSON.parse(saved) : {
      appName: "SolvencIA",
      deptName: "Dpto. Contabilidad y Economía Financiera",
      iconType: "Sparkles"
    };
  });

  const [view, setView] = useState<AppView>(AppView.CHATS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [privateDocs, setPrivateDocs] = useState<DocumentSource[]>(() => {
    const savedDocs = localStorage.getItem('sol_custom_docs_v2');
    const customDocs = savedDocs ? JSON.parse(savedDocs) : [];
    // Unimos los 50 temas base con los personalizados
    return [...PRIVATE_KNOWLEDGE_BASE, ...customDocs];
  });

  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [showCopyStatus, setShowCopyStatus] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [passInput, setPassInput] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const clickCount = useRef(0);

  useEffect(() => {
    localStorage.setItem('sol_branding_v7', JSON.stringify(config));
    document.title = `${config.appName} - US`;
  }, [config]);

  useEffect(() => {
    const customOnly = privateDocs.filter(d => !PRIVATE_KNOWLEDGE_BASE.some(p => p.id === d.id));
    localStorage.setItem('sol_custom_docs_v2', JSON.stringify(customOnly));
  }, [privateDocs]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        role: 'model',
        text: `Hola, soy SolvencIA. He cargado los 50 temas del programa del ${config.deptName}. ¿En qué puedo ayudarte hoy?`,
        timestamp: Date.now()
      }]);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customPrompt?: string, mode: any = 'text') => {
    const textToUse = customPrompt || inputValue;
    if (!textToUse.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: textToUse, timestamp: Date.now() }]);
    if (!customPrompt) setInputValue('');
    setIsLoading(true);

    try {
      if (mode === 'podcast') {
        const scriptRes = await getAIResponse(`Genera un guión educativo sobre: ${textToUse}`, messages, privateDocs, 'text');
        const audioBase64 = await generatePodcastAudio(scriptRes.text);
        setMessages(prev => [...prev, { role: 'model', text: scriptRes.text, type: 'podcast', data: audioBase64, timestamp: Date.now() }]);
      } else {
        const res = await getAIResponse(textToUse, messages, privateDocs, mode);
        setMessages(prev => [...prev, { role: 'model', text: res.text, type: mode, data: res.data, timestamp: Date.now() }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const addDocument = () => {
    if (!newDocTitle.trim() || !newDocContent.trim()) return;
    const newDoc: DocumentSource = {
      id: `custom-${Date.now()}`,
      name: newDocTitle,
      content: newDocContent,
      updatedAt: Date.now()
    };
    setPrivateDocs([...privateDocs, newDoc]);
    setNewDocTitle('');
    setNewDocContent('');
  };

  const removeDocument = (id: string) => {
    setPrivateDocs(privateDocs.filter(d => d.id !== id));
  };

  const playAudio = async (base64: string) => {
    if (isPlayingAudio) return;
    try {
      setIsPlayingAudio(true);
      if (!audioContextRef.current) audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlayingAudio(false);
      source.start(0);
    } catch (e) {
      setIsPlayingAudio(false);
    }
  };

  const handleLogoClick = () => {
    clickCount.current += 1;
    if (clickCount.current === 5) {
      setShowPassModal(true);
      clickCount.current = 0;
    }
    setTimeout(() => { clickCount.current = 0; }, 2000);
  };

  const verifyAdmin = () => {
    if (passInput === MASTER_KEY) {
      setIsAdmin(true);
      setView(AppView.ADMIN);
      setShowPassModal(false);
      setPassInput('');
    } else {
      setPassInput('');
    }
  };

  const getIcon = () => {
    const props = { size: 28, className: "text-[#f9c80e]" };
    switch (config.iconType) {
      case 'GraduationCap': return <GraduationCap {...props} />;
      case 'Landmark': return <Landmark {...props} />;
      case 'Calculator': return <Calculator {...props} />;
      case 'BarChart3': return <BarChart3 {...props} />;
      default: return <Sparkles {...props} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-gray-200 overflow-hidden font-sans">
      <main className="flex-1 flex flex-col bg-[#080808] relative">
        
        {/* HEADER BRANDING */}
        <header className="absolute top-0 left-0 p-6 flex items-center justify-between w-full z-40 bg-gradient-to-b from-[#080808] to-transparent pointer-events-none">
          <div className="flex items-center gap-4 select-none pointer-events-auto cursor-pointer" onClick={handleLogoClick}>
            <div className="w-12 h-12 bg-[#a51d36] rounded-xl flex items-center justify-center shadow-lg shadow-[#a51d36]/20 border border-white/10">
              {getIcon()}
            </div>
            <div>
              <h1 className="font-bold text-sm text-white leading-none">{config.appName}</h1>
              <p className="text-[10px] text-[#a51d36] font-bold mt-1 uppercase tracking-tighter">{config.deptName}</p>
            </div>
          </div>
          {isAdmin && view === AppView.CHATS && (
            <button onClick={() => setView(AppView.ADMIN)} className="pointer-events-auto p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10">
              <Settings size={20} className="text-[#f9c80e]" />
            </button>
          )}
        </header>

        {view === AppView.CHATS && (
          <div className="flex-1 flex flex-col overflow-hidden pt-24">
            <div className="flex-1 overflow-y-auto p-4 md:px-12 space-y-8 custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-8 pb-40">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
                    <div className={`max-w-[90%] p-6 rounded-[1.8rem] shadow-2xl ${msg.role === 'user' ? 'bg-[#a51d36] text-white' : 'bg-[#121212] border border-white/5'}`}>
                      {msg.type === 'image_infographic' ? (
                        <div className="space-y-4">
                          <p className="text-sm italic text-gray-400">{msg.text}</p>
                          <img src={msg.data} className="w-full rounded-2xl border border-white/10" alt="Infografía" />
                        </div>
                      ) : msg.type === 'quiz' ? (
                        <QuizViewer questions={msg.data} />
                      ) : msg.type === 'mindmap' ? (
                        <MindMapViewer data={msg.data} />
                      ) : msg.type === 'podcast' ? (
                        <div className="flex items-center gap-5 bg-[#f9c80e]/5 p-5 rounded-3xl border border-[#f9c80e]/10">
                          <div className={`w-12 h-12 bg-[#f9c80e] rounded-xl flex items-center justify-center ${isPlayingAudio ? 'animate-pulse' : ''}`}>
                            <Headphones className="text-black" size={24} />
                          </div>
                          <button onClick={() => playAudio(msg.data)} disabled={isPlayingAudio} className="p-4 bg-[#f9c80e] text-black rounded-xl hover:scale-105 active:scale-95">
                            {isPlayingAudio ? <Volume2 size={24} /> : <Play size={24} />}
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-[#121212] p-6 rounded-2xl border border-white/5 flex items-center gap-3">
                      <Sparkles size={18} className="text-[#a51d36] animate-spin" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Consultando el PGC...</span>
                    </div>
                  </div>
                )}
              </div>
              <div ref={chatEndRef} />
            </div>
            
            <div className="px-8 pb-8 bg-gradient-to-t from-[#050505] to-transparent pt-8">
              <div className="max-w-3xl mx-auto">
                {/* TOOLBAR */}
                <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                  {[
                    { id: 'quiz', name: 'Test', prompt: 'Hazme un test de 3 preguntas sobre: ', icon: Award, color: 'text-yellow-500' },
                    { id: 'mindmap', name: 'Mapa', prompt: 'Estructura un mapa conceptual de: ', icon: GitGraph, color: 'text-cyan-500' },
                    { id: 'podcast', name: 'Podcast', prompt: 'Genera un podcast educativo de: ', icon: Headphones, color: 'text-purple-500' },
                    { id: 'image_infographic', name: 'Infografía', prompt: 'Crea una infografía visual de: ', icon: ImageIcon, color: 'text-pink-500' },
                  ].map(tool => (
                    <button 
                      key={tool.id} 
                      onClick={() => handleSend(tool.prompt + (inputValue || "los conceptos clave"), tool.id as any)} 
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#121212] border border-white/10 rounded-xl hover:border-[#a51d36] transition-all text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white"
                    >
                      <tool.icon size={14} className={tool.color} />
                      <span>{tool.name}</span>
                    </button>
                  ))}
                </div>
                
                <div className="relative group">
                  <textarea 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Pregunta cualquier duda sobre la asignatura..."
                    className="w-full bg-[#121212] border border-white/10 rounded-[2.5rem] h-48 pt-8 pb-16 pl-8 pr-24 focus:outline-none focus:ring-1 focus:ring-[#a51d36] text-lg transition-all shadow-2xl placeholder:text-gray-700 resize-none custom-scrollbar"
                  />
                  <div className="absolute right-6 bottom-6 flex gap-2">
                    <button onClick={() => handleSend()} disabled={isLoading} className="p-4 bg-[#a51d36] text-white rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50">
                      <Send size={24}/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === AppView.ADMIN && (
          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#080808] pt-24">
            <div className="max-w-4xl mx-auto space-y-12 pb-20">
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView(AppView.CHATS)} className="p-3 bg-white/5 border border-white/10 rounded-xl"><ArrowLeft size={20}/></button>
                  <h2 className="text-3xl font-black text-white">Panel Maestro</h2>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-full border border-green-500/20 text-[10px] font-black uppercase tracking-widest">
                   Sesión Docente Activa
                </div>
              </div>

              <section className="bg-[#121212] border border-white/5 p-10 rounded-[3rem] space-y-10">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-3"><Sparkles size={16} className="text-[#a51d36]"/> Ajustes de Identidad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <input className="w-full bg-black border border-white/10 rounded-xl py-5 px-6 text-sm" value={config.appName} onChange={e => setConfig({...config, appName: e.target.value})} placeholder="Nombre de la App" />
                  <input className="w-full bg-black border border-white/10 rounded-xl py-5 px-6 text-sm" value={config.deptName} onChange={e => setConfig({...config, deptName: e.target.value})} placeholder="Departamento" />
                </div>
              </section>

              <section className="bg-[#121212] border border-white/5 p-10 rounded-[3rem] space-y-10">
                <div className="flex justify-between items-center">
                   <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-3"><Database size={16} className="text-[#a51d36]"/> Gestión de Temas (50 Máx)</h3>
                   <button onClick={() => {
                     const code = `export const PRIVATE_KNOWLEDGE_BASE = ${JSON.stringify(privateDocs, null, 2)};`;
                     navigator.clipboard.writeText(code);
                     setShowCopyStatus(true);
                     setTimeout(() => setShowCopyStatus(false), 2000);
                   }} className="text-[10px] font-black bg-[#f9c80e] text-black px-4 py-2 rounded-lg flex items-center gap-2">
                     {showCopyStatus ? <Check size={12}/> : <Copy size={12}/>} Exportar Código
                   </button>
                </div>

                <div className="bg-black/50 p-8 rounded-2xl border border-white/5 space-y-6">
                  <input className="w-full bg-black border border-white/10 rounded-xl py-4 px-6" placeholder="Título del Tema (Ej: Tema 34)" value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)} />
                  <textarea className="w-full bg-black border border-white/10 rounded-xl py-4 px-6 h-32 resize-none" placeholder="Contenido académico del tema..." value={newDocContent} onChange={e => setNewDocContent(e.target.value)} />
                  <button onClick={addDocument} className="w-full py-4 bg-[#a51d36] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#8e192e]"><PlusCircle size={18}/> Añadir Tema al Conocimiento</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {privateDocs.map(doc => (
                    <div key={doc.id} className="bg-black/60 border border-white/5 p-5 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <FileText size={18} className="text-[#a51d36] shrink-0" />
                        <h4 className="font-bold text-white text-[11px] truncate">{doc.name}</h4>
                      </div>
                      <button onClick={() => removeDocument(doc.id)} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {showPassModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6">
          <div className="bg-[#111] border border-white/10 p-14 rounded-[4rem] w-full max-w-md text-center shadow-2xl relative animate-in">
            <button onClick={() => setShowPassModal(false)} className="absolute top-10 right-10 text-gray-700 hover:text-white"><X size={28}/></button>
            <Key className="text-[#a51d36] mx-auto mb-10" size={40}/>
            <h3 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">Identidad Docente</h3>
            <p className="text-[10px] text-gray-500 mb-12 uppercase tracking-[0.4em] font-black">Acceso Administrador</p>
            <div className="space-y-10">
              <input type="password" autoFocus className="w-full bg-black border border-white/10 rounded-2xl py-7 px-8 text-center text-[#f9c80e] text-4xl font-black tracking-[0.3em] focus:outline-none focus:ring-1 focus:ring-[#a51d36]" value={passInput} onChange={(e) => setPassInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyAdmin()} />
              <button onClick={verifyAdmin} className="w-full py-7 bg-[#a51d36] text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all">Acceder al Panel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* RENDERIZADORES DE APOYO */

const QuizViewer: React.FC<{questions: QuizQuestion[]}> = ({ questions }) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleNext = () => {
    if (current < questions.length - 1) { setCurrent(c => c + 1); setSelected(null); setIsAnswered(false); }
    else setFinished(true);
  };

  if (finished) return (
    <div className="text-center py-8">
      <Award size={48} className="text-[#f9c80e] mx-auto mb-4" />
      <h3 className="text-xl font-bold mb-2">¡Repaso Completado!</h3>
      <p className="text-4xl font-black text-[#f9c80e] mb-8">{score} / {questions.length}</p>
      <button onClick={() => window.location.reload()} className="bg-white text-black px-10 py-4 rounded-full font-black text-[10px] uppercase">Cerrar</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-[10px] font-black text-[#f9c80e] uppercase tracking-widest border-b border-white/5 pb-2">Pregunta {current + 1} de {questions.length}</div>
      <h3 className="text-lg font-bold leading-tight">{questions[current].question}</h3>
      <div className="grid grid-cols-1 gap-2">
        {questions[current].options.map((opt, i) => (
          <button key={i} disabled={isAnswered} onClick={() => { setSelected(i); setIsAnswered(true); if(i === questions[current].correctAnswer) setScore(s => s+1); }} className={`w-full text-left px-5 py-4 rounded-2xl border transition-all flex items-center gap-4 ${isAnswered ? (i === questions[current].correctAnswer ? 'bg-green-600/20 border-green-500' : (i === selected ? 'bg-red-600/20 border-red-500' : 'bg-white/5 opacity-50')) : 'bg-white/5 border-white/5'}`}>
            <span className="font-black text-[10px] opacity-20">{String.fromCharCode(65 + i)}</span>
            <span className="font-semibold">{opt}</span>
          </button>
        ))}
      </div>
      {isAnswered && (
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 animate-in">
          <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{questions[current].explanation}</p>
          <button onClick={handleNext} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest mt-6">Continuar</button>
        </div>
      )}
    </div>
  );
};

const MindMapViewer: React.FC<{data: ConceptMap}> = ({ data }) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
         <div className="inline-block bg-[#a51d36] text-white px-10 py-5 rounded-3xl font-bold uppercase text-[11px] tracking-widest shadow-2xl">{data.core}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.branches.map((branch, i) => (
          <div key={i} className="bg-white/5 border border-white/5 p-6 rounded-[2rem] shadow-xl">
            <h4 className="text-[#f9c80e] font-black uppercase text-[9px] mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#f9c80e] rounded-full"/> {branch.node}</h4>
            <ul className="space-y-2">
              {branch.details.map((detail, j) => (
                <li key={j} className="text-[11px] text-gray-500 flex gap-3"><div className="w-1 h-1 bg-white/10 rounded-full mt-1.5 shrink-0" />{detail}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
