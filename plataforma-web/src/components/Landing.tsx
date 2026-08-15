"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  Building2,
  Gavel,
  Landmark,
  Scale,
  ShieldCheck,
  Sparkles,
  Stamp,
  Plane,
} from "lucide-react";
import type { Idioma, Servicio } from "@/lib/tipos";
import { nombreServicio } from "@/lib/tipos";
import { textos } from "@/lib/i18n";
import { REDES, SITIO } from "@/lib/config";
import AsistenteModal, { type ModoAsistente } from "./AsistenteModal";
import Redes from "./Redes";

const ICONOS: Record<Servicio["categoria"], React.ElementType> = {
  documentos: Stamp,
  migratorio: Plane,
  inversion: Landmark,
  corporativo: Building2,
  fiduciario: ShieldCheck,
};

export default function Landing({ servicios }: { servicios: Servicio[] }) {
  const [idioma, setIdioma] = useState<Idioma>("es");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modo, setModo] = useState<ModoAsistente>("contacto");
  const [servicioActivo, setServicioActivo] = useState<string | null>(null);
  const [consultaInicial, setConsultaInicial] = useState<string | null>(null);

  const t = textos[idioma];

  const abrir = useCallback(
    (nuevoModo: ModoAsistente, slug?: string, consulta?: string) => {
      setModo(nuevoModo);
      setServicioActivo(slug ?? null);
      setConsultaInicial(consulta ?? null);
      setModalAbierto(true);
    },
    []
  );

  const destacados = useMemo(() => servicios.slice(0, 6), [servicios]);

  return (
    <div className="flex flex-col min-h-screen selection:bg-amber-100">
      {/* ---------------- NAV ---------------- */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-20 gap-4">
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black tracking-tighter uppercase italic">
              Defensa<span className="text-amber-600">Venezuela</span>
            </span>
            <span className="text-[0.6rem] text-slate-400 font-bold uppercase tracking-[0.2em]">
              by {SITIO.estudio}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-1" role="group" aria-label="Idioma">
              {(["es", "en", "pt"] as Idioma[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setIdioma(l)}
                  aria-pressed={idioma === l}
                  className={`text-[10px] px-2.5 py-1.5 rounded font-black transition-colors ${
                    idioma === l
                      ? "bg-slate-900 text-white"
                      : "text-slate-400 hover:text-slate-900"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={() => abrir("ia")}
              className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg group"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
              <span className="hidden xs:inline">ASISTENTE IA</span>
              <span className="xs:hidden">IA</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {/* ---------------- HERO ---------------- */}
        <section className="bg-slate-900 text-white py-20 md:py-32 px-6 text-center relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_20%_20%,#fbbf24_0,transparent_45%),radial-gradient(circle_at_80%_60%,#fbbf24_0,transparent_40%)]"
          />
          <div className="relative z-10 max-w-4xl mx-auto">
            <p className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full text-amber-500 text-[10px] font-black uppercase tracking-widest mb-8">
              <ShieldCheck className="w-3 h-3" /> Seguridad jurídica de élite
            </p>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-8 uppercase tracking-tighter leading-[0.95]">
              {t.hero_h1}
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
                {t.hero_span}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-400 mb-12 font-light max-w-2xl mx-auto leading-relaxed">
              {t.hero_sub}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => abrir("ia")}
                className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-5 rounded-xl font-black text-base transition-all shadow-2xl flex items-center gap-3 justify-center uppercase tracking-wider hover:scale-[1.02] active:scale-95 group"
              >
                {t.cta_main}
                <Bot className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={() => abrir("contacto")}
                className="border-2 border-slate-700 hover:border-amber-500 text-white px-8 py-5 rounded-xl font-black text-base transition-colors uppercase tracking-wider"
              >
                {t.modo_contacto}
              </button>
            </div>
            <p className="mt-8 text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">
              {SITIO.abogado}
            </p>
          </div>
        </section>

        {/* ---------------- SERVICIOS ---------------- */}
        <section id="servicios" className="py-20 md:py-24 max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase mb-4">
              {t.servicios_titulo}
            </h2>
            <p className="text-slate-500 leading-relaxed">{t.servicios_sub}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destacados.map((s) => {
              const Icono = ICONOS[s.categoria] ?? Scale;
              return (
                <article
                  key={s.id}
                  className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col"
                >
                  <div className="mb-6 p-3.5 bg-slate-50 rounded-2xl inline-block w-fit">
                    <Icono className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 tracking-tight">
                    {nombreServicio(s, idioma)}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-grow">
                    {s.descripcion}
                  </p>
                  {s.duracion_estimada && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">
                      ⏱ {s.duracion_estimada}
                    </p>
                  )}
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => abrir("checklist", s.slug)}
                      className="w-full py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" /> {t.ver_requisitos}
                    </button>
                    <button
                      onClick={() => abrir("contacto", s.slug)}
                      className="w-full py-3.5 border-2 border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:border-slate-900 hover:text-slate-900 transition-colors"
                    >
                      {t.modo_contacto}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ---------------- ANALIZADOR DE INVERSIÓN ---------------- */}
        <section className="bg-slate-900 text-white py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Gavel className="w-10 h-10 text-amber-500 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter mb-5">
              ¿Vas a invertir en Venezuela desde Chile?
            </h2>
            <p className="text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Describe tu proyecto y el asistente entrega un análisis preliminar de forma
              societaria, permisos sectoriales, riesgo cambiario y exposición a sanciones.
            </p>
            <button
              onClick={() =>
                abrir(
                  "inversion",
                  "inversion-extranjera",
                  "Quiero evaluar un proyecto de inversión en Venezuela."
                )
              }
              className="bg-amber-600 hover:bg-amber-500 px-8 py-5 rounded-xl font-black uppercase tracking-wider inline-flex items-center gap-3 transition-colors shadow-2xl"
            >
              {t.analysis_btn} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="bg-white border-t border-slate-200 py-14 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <p className="font-black uppercase tracking-tighter italic text-lg">
              Defensa<span className="text-amber-600">Venezuela</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {SITIO.estudio} · {SITIO.abogado}
            </p>
            <a
              href={`mailto:${SITIO.email}`}
              className="text-xs text-slate-500 hover:text-amber-600 transition-colors"
            >
              {SITIO.email}
            </a>
          </div>

          <Redes redes={REDES} />
        </div>

        <p className="text-center text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mt-10">
          © {new Date().getFullYear()} {SITIO.estudio} · Legal-Tech Division
        </p>
      </footer>

      {/* ---------------- BOTÓN FLOTANTE ---------------- */}
      <button
        onClick={() => abrir("ia")}
        aria-label={t.cta_main}
        className="fixed bottom-6 right-6 z-30 bg-green-600 hover:bg-green-500 text-white p-5 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95"
      >
        <Bot className="w-7 h-7" />
      </button>

      {/* ---------------- MODAL ---------------- */}
      {modalAbierto && (
        <AsistenteModal
          idioma={idioma}
          setIdioma={setIdioma}
          modo={modo}
          setModo={setModo}
          servicios={servicios}
          servicioActivo={servicioActivo}
          consultaInicial={consultaInicial}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  );
}
