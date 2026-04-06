'use client';

import { useState } from 'react';
import { 
  MessageCircle, Scale, ShieldCheck, Bot, Lock, FileSignature, 
  IdCard, Building2, Check, CheckCircle2, Newspaper, ArrowRight, 
  Calendar, ChevronRight, PlaneTakeoff, Briefcase, MailCheck, Mail, 
  Send, Inbox, MapPin, MessageSquare, X 
} from 'lucide-react';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingNews, setIsSubmittingNews] = useState(false);
  const [newsSuccess, setNewsSuccess] = useState(false);

  const servicios = [
    {
      titulo: "Apostilla y Legalización",
      descripcion: "Gestión integral ante el MPPRE. Validamos la viabilidad de tu documento en 24 horas.",
      icono: <Scale className="w-10 h-10 text-amber-500" />,
    },
    {
      titulo: "Poderes Especiales",
      descripcion: "Redacción jurídica de poderes para ventas o trámites menores en Venezuela.",
      icono: <FileSignature className="w-10 h-10 text-amber-500" />,
    },
    {
      titulo: "Inversión Internacional",
      descripcion: "Estructuración legal y protección de activos para capitales extranjeros de cualquier país hacia Venezuela.",
      icono: <Building2 className="w-10 h-10 text-amber-500" />,
    },
    {
      titulo: "LegalBridge Trust",
      descripcion: "Protección jurídica de alto nivel para inversores y empresas respaldado por nuestra plataforma Tech.",
      icono: <ShieldCheck className="w-10 h-10 text-amber-500" />,
    }
  ];

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingNews(true);
    setTimeout(() => {
      setIsSubmittingNews(false);
      setNewsSuccess(true);
    }, 1000);
  };

  const handleWhatsappSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre = formData.get('nombre');
    const email = formData.get('email');
    const servicio = formData.get('servicio'); 
    
    const telefonoWsp = "56994237663"; 
    
    // MENSAJE ACTUALIZADO A 1 CONSULTA
    const mensaje = `Hola Abg. Richard López. Vengo de la plataforma Defensavenezuela.%0A%0A*Mis datos:*%0A- Nombre: ${nombre}%0A- Correo: ${email}%0A- *Interés:* ${servicio}%0A%0ADeseo utilizar mi *Cortesía de 1 Consulta Gratuita*.`;
    const urlWsp = `https://wa.me/${telefonoWsp}?text=${mensaje}`;
    
    setIsModalOpen(false);
    window.open(urlWsp, '_blank');
  }

  return (
    <div className="bg-gray-50 text-gray-800 font-sans antialiased flex flex-col min-h-screen">
      
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-slate-800 tracking-tight">Defensa<span className="text-amber-600">venezuela</span></span>
              <span className="text-[0.65rem] text-gray-500 uppercase tracking-widest font-semibold mt-0.5">by Estudio Jurídico Lopez & Asociado</span>
            </div>
            {/* BOTÓN NAV ACTUALIZADO */}
            <button onClick={() => setIsModalOpen(true)} className="hidden md:flex bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-md font-medium transition-all shadow-md items-center gap-2">
              <MessageCircle className="w-4 h-4" /> 1 Consulta Gratis
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <div className="bg-slate-800 text-white py-20 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-600 text-sm font-medium mb-6">
                <ShieldCheck className="w-4 h-4 text-amber-500" /> Seguridad jurídica transfronteriza
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">Inversión y Gestión Legal en Venezuela <span className="text-amber-500">sin fronteras.</span></h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">Asesoría de élite para capitales extranjeros e inversionistas globales. Resolvemos tu situación jurídica con eficiencia.</p>
              {/* BOTÓN HERO ACTUALIZADO */}
              <button onClick={() => setIsModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-md font-bold text-lg shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                <Bot className="w-5 h-5" /> Obtener 1 Consulta Gratuita
              </button>
            </div>
          </div>
        </div>

        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900">Servicios Jurídicos e Inversión</h2>
              <div className="w-20 h-1 bg-amber-500 mx-auto mt-4"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {servicios.map((s, idx) => (
                <div key={idx} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="mb-4">{s.icono}</div>
                  <h3 className="text-xl font-bold mb-3">{s.titulo}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">{s.descripcion}</p>
                  <button onClick={() => setIsModalOpen(true)} className="text-amber-600 font-bold text-sm flex items-center gap-1 hover:underline">
                    Consultar <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="bg-slate-800 rounded-2xl p-10 md:p-12 text-white shadow-2xl text-center">
              <h2 className="text-3xl font-bold mb-4">Newsletter Jurídico Corporativo</h2>
              {!newsSuccess ? (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 mt-8">
                  <input type="email" required placeholder="Tu correo corporativo..." className="flex-grow px-4 py-3 rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-amber-500" />
                  <button type="submit" disabled={isSubmittingNews} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center gap-2">
                    {isSubmittingNews ? 'Registrando...' : 'Suscribirme'} <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="mt-8 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400 font-bold">
                  Suscripción procesada exitosamente.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 text-center text-xs border-t border-slate-800">
        &copy; 2026 Defensavenezuela | Estudio Jurídico Lopez & Asociado.
      </footer>

      <div className="fixed bottom-6 right-6 z-40">
        <button onClick={() => setIsModalOpen(true)} className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl transition-transform hover:scale-110">
          <MessageSquare className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse text-[10px] flex items-center justify-center font-bold">1</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Bot className="w-6 h-6 text-amber-500" />
                <h3 className="font-bold text-lg">Asistente Legal</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8">
              <p className="text-gray-600 text-sm mb-6">Inicia tu gestión legal ahora. Dispones de **1 consulta gratuita** por tiempo limitado.</p>
              <form onSubmit={handleWhatsappSubmit} className="space-y-4">
                <input name="nombre" type="text" required placeholder="Nombre Completo" className="w-full border border-gray-300 rounded-md py-3 px-4 text-gray-900 focus:border-amber-500 outline-none" />
                <input name="email" type="email" required placeholder="Correo Electrónico" className="w-full border border-gray-300 rounded-md py-3 px-4 text-gray-900 focus:border-amber-500 outline-none" />
                <select name="servicio" required className="w-full border border-gray-300 rounded-md py-3 px-4 bg-white text-gray-900 focus:border-amber-500 outline-none">
                  <option value="">Selecciona tu área de interés...</option>
                  <option value="Inversión Internacional">Inversión Internacional a Venezuela</option>
                  <option value="LegalBridge Trust">Servicios LegalBridge Trust</option>
                  <option value="Apostilla/Legalización">Apostilla y Legalización</option>
                  <option value="Poderes/Civil">Poderes y trámites Civiles</option>
                </select>
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-md flex justify-center items-center gap-2 transition-all shadow-lg">
                  Canjear Consulta Gratuita <MessageCircle className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}