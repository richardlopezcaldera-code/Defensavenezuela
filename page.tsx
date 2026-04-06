'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, Scale, ShieldCheck, Bot, Building2, 
  ChevronRight, Send, MessageSquare, X, Globe2, 
  ArrowRight, Landmark, Gavel, CheckCircle2,
  Award, Sparkles, Loader2, ClipboardCheck, Briefcase
} from 'lucide-react';

// CONFIGURACIÓN DE GEMINI API
const apiKey = ""; // El entorno proporciona la clave automáticamente
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [idioma, setIdioma] = useState<'es' | 'en' | 'pt'>('es');
  const [isSubmittingNews, setIsSubmittingNews] = useState(false);
  const [newsSuccess, setNewsSuccess] = useState(false);
  
  // ESTADOS DEL CHAT IA Y HERRAMIENTAS ✨
  const [chatMode, setChatMode] = useState<'form' | 'ai' | 'analysis'>('form');
  const [userMessage, setUserMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [checklist, setChecklist] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  // Lógica de traducción
  const t = {
    es: {
      titulo: "Asistente Legal IA",
      sub: "Consulta gratuita con nuestra Inteligencia Artificial o agenda con un experto.",
      nom: "Nombre Completo",
      tel: "Teléfono (Ej: +569...)",
      sel: "Selecciona interés...",
      btn: "Enviar a WhatsApp",
      hero_h1: "Gestión Legal en Venezuela,",
      hero_span: "Sin Fronteras.",
      cta_main: "HABLAR CON EL ASISTENTE IA",
      analysis_btn: "✨ Analizar Proyecto con IA",
      checklist_btn: "✨ Generar Requisitos con IA"
    },
    en: {
      titulo: "AI Legal Assistant",
      sub: "Free consultation with our AI or schedule with an expert.",
      nom: "Full Name",
      tel: "Phone Number (Ex: +1...)",
      sel: "Select interest...",
      btn: "Send to WhatsApp",
      hero_h1: "Legal Management in Venezuela,",
      hero_span: "Without Borders.",
      cta_main: "TALK TO AI ASSISTANT",
      analysis_btn: "✨ Analyze Project with AI",
      checklist_btn: "✨ Generate Requirements with AI"
    },
    pt: {
      titulo: "Assistente Jurídico IA",
      sub: "Consulta gratuita com nossa IA ou agende com um especialista.",
      nom: "Nome Completo",
      tel: "Telefone (Ex: +55...)",
      sel: "Selecione interesse...",
      btn: "Enviar para WhatsApp",
      hero_h1: "Gestão Jurídica na Venezuela,",
      hero_span: "Sem Fronteiras.",
      cta_main: "FALAR COM O ASSISTENTE IA",
      analysis_btn: "✨ Analisar Projeto com IA",
      checklist_btn: "✨ Gerar Requisitos com IA"
    }
  };

  // FUNCIÓN UNIVERSAL PARA LLAMAR A GEMINI API ✨
  const callGemini = async (prompt: string, context: string) => {
    const fetchWithRetry = async (retries = 0): Promise<any> => {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `System: ${context}\nUser: ${prompt}` }] }]
          })
        });
        if (!response.ok) throw new Error('API Error');
        return await response.json();
      } catch (err) {
        if (retries < 5) {
          const delay = Math.pow(2, retries) * 1000;
          await new Promise(res => setTimeout(res, delay));
          return fetchWithRetry(retries + 1);
        }
        throw err;
      }
    };

    const result = await fetchWithRetry();
    return result.candidates?.[0]?.content?.parts?.[0]?.text;
  };

  // CHAT GENERAL CON IA
  const askGemini = async (msg: string) => {
    if (!msg.trim()) return;
    const newHistory = [...chatHistory, { role: 'user' as const, text: msg }];
    setChatHistory(newHistory);
    setUserMessage('');
    setIsTyping(true);

    const systemPrompt = `Eres el asistente legal senior de DefensaVenezuela. Jefe: Abg. Richard López. 
    Objetivo: Orientar profesionalmente sobre Apostillas, Poderes, Inversión Extranjera y LegalBridge Trust. 
    Idioma: ${idioma}. Invita siempre al WhatsApp de Richard (+56994237663).`;

    try {
      const aiText = await callGemini(msg, systemPrompt);
      setChatHistory([...newHistory, { role: 'model', text: aiText || "Error al procesar respuesta." }]);
    } catch (error) {
      setChatHistory([...newHistory, { role: 'model', text: "Error de conexión. Contacte por WhatsApp." }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ✨ FUNCIÓN: GENERADOR DE CHECKLIST DINÁMICO
  const generateChecklist = async (formData: FormData) => {
    setIsTyping(true);
    setChecklist(null);
    const service = formData.get('servicio');
    const prompt = `Genera una lista de requisitos legales (paso a paso) para el trámite de ${service} en Venezuela para un cliente en el extranjero. Idioma: ${idioma}.`;
    const context = "Eres un experto en derecho procesal venezolano. Genera una lista técnica pero fácil de entender.";
    
    try {
      const result = await callGemini(prompt, context);
      setChecklist(result);
    } catch (error) {
      setChecklist("No se pudo generar la lista en este momento.");
    } finally {
      setIsTyping(false);
    }
  };

  // ✨ FUNCIÓN: ANALIZADOR DE PROYECTO DE INVERSIÓN
  const analyzeProject = async (text: string) => {
    setChatMode('ai');
    setIsModalOpen(true);
    const prompt = `Analiza la viabilidad legal inicial de este proyecto de inversión en Venezuela: "${text}". Menciona leyes como la Ley Antibloqueo o incentivos fiscales si aplica.`;
    askGemini(prompt);
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans antialiased flex flex-col min-h-screen selection:bg-amber-100">
      
      {/* HEADER */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-24 items-center">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                Defensa<span className="text-amber-600">Venezuela</span>
              </span>
              <span className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest">by Lopez & Asociado</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => { setChatMode('ai'); setIsModalOpen(true); }} className="bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg group">
                <Sparkles className="w-3 h-3 text-amber-500 group-hover:rotate-12 transition-transform" /> ASISTENTE IA
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {/* HERO */}
        <div className="bg-slate-900 text-white py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="relative z-10 max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-widest mb-8">
              <ShieldCheck className="w-3 h-3" /> Tecnología Legal Avanzada
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter leading-none">
              {t[idioma].hero_h1} <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">{t[idioma].hero_span}</span>
            </h1>
            <p className="text-xl text-slate-400 mb-10 font-light italic">Respaldo jurídico de élite para capitales globales.</p>
            <button onClick={() => { setChatMode('ai'); setIsModalOpen(true); }} className="bg-amber-600 hover:bg-amber-500 text-white px-10 py-5 rounded-xl font-black text-lg transition-all shadow-2xl flex items-center gap-3 mx-auto group">
              {t[idioma].cta_main} <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* SERVICIOS CON IA ✨ */}
        <section className="py-24 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black uppercase text-slate-800 tracking-tight">Servicios Inteligentes</h2>
            <div className="w-20 h-1 bg-amber-600 mx-auto mt-4"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
              <div className="text-amber-600 mb-6 p-4 bg-slate-50 rounded-xl inline-block group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Landmark className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Inversión</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Protección de capitales extranjeros en el marco legal venezolano actual.</p>
              <button 
                onClick={() => analyzeProject("Proyecto de inversión hotelera en el Caribe venezolano")}
                className="w-full py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
              >
                <Sparkles className="w-3 h-3 text-amber-500" /> {t[idioma].analysis_btn}
              </button>
            </div>

            <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
              <div className="text-amber-600 mb-6 p-4 bg-slate-50 rounded-xl inline-block group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">LegalBridge</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Fideicomisos y estructuras de confianza tecnológica para transacciones.</p>
              <button 
                onClick={() => { setChatMode('ai'); setIsModalOpen(true); askGemini("¿Cómo funciona la seguridad de LegalBridge Trust?"); }}
                className="w-full py-3 border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-900 hover:text-white transition-all"
              >
                Saber más
              </button>
            </div>

            <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
              <div className="text-amber-600 mb-6 p-4 bg-slate-50 rounded-xl inline-block group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Scale className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Documentos</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">Apostillas rápidas y Poderes Especiales ante notarías venezolanas.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 hover:bg-amber-500 transition-all"
              >
                <ClipboardCheck className="w-3 h-3" /> Consultar Requisitos
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* BOTÓN FLOTANTE INTELIGENTE */}
      <div className="fixed bottom-10 right-10 z-50">
        <button 
          onClick={() => { setChatMode('ai'); setIsModalOpen(true); }}
          className="bg-green-600 hover:bg-green-500 text-white p-6 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center gap-3 group relative"
        >
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full border-4 border-white text-[10px] flex items-center justify-center font-black animate-bounce">1</div>
          <Bot className="w-8 h-8" />
          <span className="font-black text-xs pr-2 hidden group-hover:block uppercase tracking-tighter">Legal AI Ready</span>
        </button>
      </div>

      {/* MODAL / OFICINA VIRTUAL CON FUNCIONES IA ✨ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/95 z-[60] flex items-center justify-center backdrop-blur-2xl p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full h-[700px] flex flex-col overflow-hidden border border-white/20 my-8">
            
            {/* Header Modal */}
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/40">
                  <Bot className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight">{t[idioma].titulo}</h3>
                  <div className="flex gap-3 mt-2">
                    {['es', 'en', 'pt'].map(l => (
                      <button key={l} onClick={() => setIdioma(l as any)} className={`text-[9px] px-2 py-1 border font-black transition-all ${idioma === l ? 'bg-amber-600 border-amber-600 text-white shadow-lg' : 'border-slate-700 text-slate-500'}`}>{l.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => {setChatMode(chatMode === 'form' ? 'ai' : 'form'); setChecklist(null);}} className="text-[10px] font-black text-amber-500 hover:text-amber-400 bg-amber-500/5 px-3 py-1.5 rounded-lg transition-all">
                  {chatMode === 'form' ? 'CAMBIAR A IA 🤖' : 'CITA DIRECTA 📞'}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
              </div>
            </div>

            {/* Body Modal */}
            <div className="flex-grow overflow-y-auto p-10 bg-slate-50 scrollbar-hide">
              {chatMode === 'form' ? (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-slate-600 text-sm font-bold italic mb-6 leading-relaxed">Completa los datos para coordinar tu caso. O usa el botón ✨ para saber qué necesitas de inmediato.</p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const msg = `*LEAD DEFENSAVENEZUELA*%0A- Cliente: ${fd.get('nombre')}%0A- Email: ${fd.get('email')}%0A- Tel: ${fd.get('tel')}%0A- Interés: ${fd.get('servicio')}`;
                      window.open(`https://wa.me/56994237663?text=${msg}`, '_blank');
                    }} className="space-y-5">
                      <input name="nombre" required placeholder={t[idioma].nom} className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-white outline-none focus:border-amber-500 font-bold text-sm shadow-inner transition-all" />
                      <input name="email" type="email" required placeholder="Email Corporativo" className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-white outline-none focus:border-amber-500 font-bold text-sm shadow-inner transition-all" />
                      <input name="tel" required placeholder={t[idioma].tel} className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-white outline-none focus:border-amber-500 font-bold text-sm shadow-inner transition-all" />
                      
                      <div className="flex flex-col gap-3">
                        <select id="service-select" name="servicio" required className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-white outline-none focus:border-amber-500 font-bold text-sm shadow-inner appearance-none cursor-pointer">
                          <option value="">{t[idioma].sel}</option>
                          <option value="Inversión">Inversión Internacional</option>
                          <option value="Apostilla">Apostilla / Legalización</option>
                          <option value="Poder Especial">Poder Especial (Venta/Gestión)</option>
                        </select>
                        
                        {/* BOTÓN IA PARA GENERAR CHECKLIST ✨ */}
                        <button 
                          type="button" 
                          onClick={(e) => {
                            const select = document.getElementById('service-select') as HTMLSelectElement;
                            if (!select.value) return;
                            const fd = new FormData();
                            fd.append('servicio', select.value);
                            generateChecklist(fd);
                          }}
                          className="text-[10px] font-black text-amber-700 bg-amber-50 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100 transition-all border border-amber-200"
                        >
                          <Sparkles className="w-3 h-3" /> {t[idioma].checklist_btn}
                        </button>
                      </div>

                      {checklist && (
                        <div className="bg-slate-900 text-white p-6 rounded-2xl text-xs leading-relaxed animate-in fade-in slide-in-from-top-2 border border-amber-500/30">
                          <h4 className="font-black uppercase text-amber-500 mb-3 flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4" /> Checklist Personalizado:
                          </h4>
                          <div className="whitespace-pre-wrap font-medium text-slate-300">{checklist}</div>
                        </div>
                      )}

                      <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                        AGENDAR CON UN EXPERTO <ArrowRight className="w-4 h-4 text-amber-500" />
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-grow space-y-5 pb-6">
                    {chatHistory.length === 0 && (
                      <div className="text-center py-20">
                        <div className="p-5 bg-slate-100 rounded-full inline-block mb-6 shadow-inner">
                          <Bot className="w-16 h-16 text-slate-300" />
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">IA Legal Desplegada</p>
                        <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">Pregúntame sobre inversión, apostillas o protección de activos.</p>
                      </div>
                    )}
                    {chatHistory.map((chat, i) => (
                      <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-500`}>
                        <div className={`max-w-[85%] p-5 rounded-2xl text-sm font-semibold leading-relaxed shadow-sm ${chat.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                          {chat.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl rounded-tl-none flex items-center gap-3 shadow-sm">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce delay-200"></span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analizando Marco Legal...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="mt-auto pt-6 border-t border-slate-200 flex gap-3">
                    <input 
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && askGemini(userMessage)}
                      placeholder="Escribe tu consulta jurídica internacional..." 
                      className="flex-grow p-5 rounded-2xl border-2 border-slate-100 bg-white outline-none focus:border-amber-500 font-bold text-sm shadow-sm transition-all" 
                    />
                    <button onClick={() => askGemini(userMessage)} className="bg-slate-900 text-white p-5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl group">
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer Modal */}
            <div className="bg-slate-50 p-4 text-center border-t border-slate-200">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">© 2026 Lopez & Asociado Global Network | Powered by Gemini 2.5</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
