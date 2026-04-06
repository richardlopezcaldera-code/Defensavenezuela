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
  const [chatMode, setChatMode] = useState<'form' | 'ai'>('form');
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

  // Lógica de traducción corporativa
  const t = {
    es: {
      titulo: "Asistente IA Corporativo",
      sub: "Consulta gratuita con nuestra Inteligencia Artificial o agenda con un experto.",
      nom: "Nombre Completo",
      tel: "Teléfono (Ej: +569...)",
      sel: "Selecciona interés...",
      btn: "Iniciar en WhatsApp",
      hero_h1: "Gestión Legal en Venezuela,",
      hero_span: "Sin Fronteras.",
      cta_main: "HABLAR CON EL ASISTENTE IA",
      analysis_btn: "✨ Analizar Proyecto con IA",
      checklist_btn: "✨ Generar Requisitos con IA"
    },
    en: {
      titulo: "Corporate AI Assistant",
      sub: "Free consultation with our AI or schedule with an expert.",
      nom: "Full Name",
      tel: "Phone Number (Ex: +1...)",
      sel: "Select interest...",
      btn: "Start on WhatsApp",
      hero_h1: "Legal Management in Venezuela,",
      hero_span: "Without Borders.",
      cta_main: "TALK TO AI ASSISTANT",
      analysis_btn: "✨ Analyze Project with AI",
      checklist_btn: "✨ Generate Requirements with AI"
    },
    pt: {
      titulo: "Assistente IA Corporativo",
      sub: "Consulta gratuita com nossa IA ou agende com um especialista.",
      nom: "Nome Completo",
      tel: "Telefone (Ex: +55...)",
      sel: "Selecione interesse...",
      btn: "Iniciar no WhatsApp",
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
    Idioma: ${idioma}. Invita siempre al WhatsApp de Richard (+56994237663) al final de tu respuesta de forma elegante.`;

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
  const analyzeProject = (text: string) => {
    setChatMode('ai');
    setIsModalOpen(true);
    const prompt = `Analiza la viabilidad legal inicial de este proyecto de inversión en Venezuela: "${text}". Menciona leyes como la Ley Antibloqueo o incentivos fiscales si aplica.`;
    askGemini(prompt);
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans antialiased flex flex-col min-h-screen selection:bg-amber-100">
      
      {/* HEADER CORPORATIVO */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-20">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
              Defensa<span className="text-amber-600">Venezuela</span>
            </span>
            <span className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-widest tracking-[0.2em]">
              by Lopez & Asociado
            </span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => { setChatMode('ai'); setIsModalOpen(true); }} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg group">
              <Sparkles className="w-3 h-3 text-amber-500 group-hover:rotate-12 transition-transform" /> ASISTENTE IA
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {/* HERO PREMIUM */}
        <section className="bg-slate-900 text-white py-24 md:py-32 px-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className="relative z-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-widest mb-8">
              <ShieldCheck className="w-3 h-3" /> Seguridad Jurídica de Élite
            </div>
            <h1 className="text-5xl md:text-8xl font-black mb-8 uppercase tracking-tighter leading-none">
              {t[idioma].hero_h1} <br/> <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">{t[idioma].hero_span}</span>
            </h1>
            <p className="text-xl text-slate-400 mb-12 italic font-light tracking-wide max-w-2xl mx-auto">
              Asesoría jurídica boutique para inversores globales y capitales estratégicos.
            </p>
            <button onClick={() => { setChatMode('ai'); setIsModalOpen(true); }} className="bg-amber-600 hover:bg-amber-500 text-white px-10 py-5 rounded-xl font-black text-lg transition-all shadow-2xl flex items-center gap-3 mx-auto uppercase tracking-widest hover:scale-105 active:scale-95 group">
              {t[idioma].cta_main} <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </section>

        {/* SERVICIOS INTELIGENTES ✨ */}
        <section className="py-24 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all group hover:-translate-y-2 flex flex-col">
            <div className="mb-8 p-4 bg-slate-50 rounded-2xl inline-block group-hover:bg-amber-50 transition-colors">
              <Landmark className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-800 tracking-tight">Inversión</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow italic">Análisis de capitales y protección de activos en el marco legal actual.</p>
            <button 
              onClick={() => analyzeProject("Proyecto de inversión hotelera o industrial en Venezuela")}
              className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
            >
              <Sparkles className="w-3 h-3 text-amber-500" /> {t[idioma].analysis_btn}
            </button>
          </div>

          <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all group hover:-translate-y-2 flex flex-col">
            <div className="mb-8 p-4 bg-slate-50 rounded-2xl inline-block group-hover:bg-amber-50 transition-colors">
              <ShieldCheck className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-800 tracking-tight">LegalBridge</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow italic">Fideicomisos y estructuras de confianza tecnológica para transacciones.</p>
            <button 
              onClick={() => { setChatMode('ai'); setIsModalOpen(true); askGemini("¿Cómo funciona la seguridad de LegalBridge Trust?"); }}
              className="w-full py-4 border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all font-bold"
            >
              Saber más
            </button>
          </div>

          <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all group hover:-translate-y-2 flex flex-col">
            <div className="mb-8 p-4 bg-slate-50 rounded-2xl inline-block group-hover:bg-amber-50 transition-colors">
              <Scale className="w-8 h-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-slate-800 tracking-tight">Documentos</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow italic">Apostillas, Poderes y Legalizaciones internacionales.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full py-4 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-amber-500 transition-all shadow-lg"
            >
              <ClipboardCheck className="w-3 h-3" /> Consultar Requisitos
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-12 text-center text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase">
        &copy; 2026 Lopez & Asociado | Legal-Tech Division
      </footer>

      {/* BOTÓN FLOTANTE INTELIGENTE */}
      <div className="fixed bottom-10 right-10 z-50">
        <button 
          onClick={() => { setChatMode('ai'); setIsModalOpen(true); }}
          className="bg-green-600 hover:bg-green-500 text-white p-6 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center group relative active:scale-95"
        >
          <div className="absolute -top-2 -right-2 w-9 h-9 bg-red-600 rounded-full border-4 border-white text-[10px] flex items-center justify-center font-black animate-bounce shadow-xl text-white">1</div>
          <Bot className="w-8 h-8" />
          <span className="font-black text-xs pr-2 hidden group-hover:block uppercase tracking-tighter ml-2 italic">Legal AI</span>
        </button>
      </div>

      {/* MODAL / OFICINA VIRTUAL CON IA ✨ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/95 z-[60] flex items-center justify-center backdrop-blur-2xl p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full h-[700px] flex flex-col overflow-hidden border border-white/20 my-8">
            
            {/* Header Modal */}
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <Bot className="w-7 h-7 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-black text-xl uppercase leading-none tracking-tight">{t[idioma].titulo}</h3>
                  <div className="flex gap-2 mt-3">
                    {['es', 'en', 'pt'].map(l => (
                      <button key={l} onClick={() => setIdioma(l as any)} className={`text-[9px] px-3 py-1 border font-black transition-all ${idioma === l ? 'bg-amber-600 border-amber-600 text-white shadow-lg' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{l.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => {setChatMode(chatMode === 'form' ? 'ai' : 'form'); setChecklist(null);}} className="text-[10px] font-black text-amber-500 bg-amber-500/5 px-3 py-2 rounded-lg hover:bg-amber-500/10 transition-all uppercase tracking-tighter">
                  {chatMode === 'form' ? 'MODO IA 🤖' : 'CONTACTO 📞'}
                </button>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-8 h-8" /></button>
              </div>
            </div>

            {/* Body Modal */}
            <div className="flex-grow overflow-y-auto p-10 bg-slate-50 scrollbar-hide text-left">
              {chatMode === 'form' ? (
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                    <p className="text-slate-600 text-sm font-bold italic mb-6 leading-relaxed">Coordine su consulta directa con el Abg. Richard López o use la IA para ver requisitos.</p>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const msg = `*LEAD DEFENSAVENEZUELA*%0A- Cliente: ${fd.get('nombre')}%0A- Tel: ${fd.get('tel')}%0A- Interés: ${fd.get('servicio')}`;
                      window.open(`https://wa.me/56994237663?text=${msg}`, '_blank');
                    }} className="space-y-5">
                      <input name="nombre" required placeholder={t[idioma].nom} className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-white outline-none focus:border-amber-500 font-bold bg-white shadow-inner transition-all" />
                      <input name="email" type="email" required placeholder="Email Corporativo" className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-white outline-none focus:border-amber-500 font-bold bg-white shadow-inner transition-all" />
                      <input name="tel" required placeholder={t[idioma].tel} className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-white outline-none focus:border-amber-500 font-bold bg-white shadow-inner transition-all" />
                      
                      <div className="flex flex-col gap-3">
                        <select id="service-select" name="servicio" required className="w-full p-5 rounded-2xl border-2 border-slate-100 bg-white outline-none focus:border-amber-500 font-bold bg-white shadow-inner cursor-pointer appearance-none">
                          <option value="">{t[idioma].sel}</option>
                          <option value="Inversión">Inversión Internacional</option>
                          <option value="Apostilla">Apostilla / Legalización</option>
                          <option value="Poder Especial">Poder Especial</option>
                        </select>
                        
                        <button 
                          type="button" 
                          onClick={() => {
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

                      <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                        {t[idioma].btn} <ArrowRight className="w-5 h-5 text-amber-500" />
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex-grow space-y-6 pb-6 overflow-y-auto scrollbar-hide">
                    {chatHistory.length === 0 && (
                      <div className="text-center py-24">
                        <Bot className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] italic">IA Legal de DefensaVenezuela Desplegada</p>
                      </div>
                    )}
                    {chatHistory.map((chat, i) => (
                      <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-500`}>
                        <div className={`max-w-[85%] p-6 rounded-3xl text-sm font-semibold shadow-sm leading-relaxed ${chat.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
                          {chat.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-6 rounded-3xl rounded-tl-none flex items-center gap-3 shadow-sm">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analizando Marco Legal...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="mt-auto pt-6 border-t flex gap-4 bg-slate-50 relative z-10">
                    <input 
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && askGemini(userMessage)}
                      placeholder="Describa su consulta legal internacional..." 
                      className="flex-grow p-5 rounded-2xl border-2 border-slate-200 outline-none focus:border-amber-500 font-bold text-sm bg-white shadow-sm transition-all shadow-inner" 
                    />
                    <button onClick={() => askGemini(userMessage)} className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-90">
                      <Send className="w-6 h-6" />
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