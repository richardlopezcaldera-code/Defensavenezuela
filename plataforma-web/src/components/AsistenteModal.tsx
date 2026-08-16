"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, ClipboardCheck, Loader2, Send, X, ArrowRight, AlertCircle } from "lucide-react";
import type { Idioma, MensajeChat, Servicio } from "@/lib/tipos";
import { nombreServicio } from "@/lib/tipos";
import { textos } from "@/lib/i18n";

export type ModoAsistente = "contacto" | "ia" | "checklist" | "inversion";

type Props = {
  idioma: Idioma;
  setIdioma: (i: Idioma) => void;
  modo: ModoAsistente;
  setModo: (m: ModoAsistente) => void;
  servicios: Servicio[];
  servicioActivo: string | null;
  consultaInicial: string | null;
  onCerrar: () => void;
};

function nuevaSesion() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `s-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function leerUtm() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source") ?? undefined,
    utm_medium: p.get("utm_medium") ?? undefined,
    utm_campaign: p.get("utm_campaign") ?? undefined,
    origen: p.get("utm_source") ?? "web",
    landing_url: window.location.href,
  };
}

export default function AsistenteModal({
  idioma,
  setIdioma,
  modo,
  setModo,
  servicios,
  servicioActivo,
  consultaInicial,
  onCerrar,
}: Props) {
  const t = textos[idioma];

  const [historial, setHistorial] = useState<MensajeChat[]>([]);
  const [entrada, setEntrada] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [checklist, setChecklist] = useState<string | null>(null);
  const [enviandoLead, setEnviandoLead] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [servicioSel, setServicioSel] = useState(servicioActivo ?? "");

  const sesion = useRef<string>(nuevaSesion());
  const finChat = useRef<HTMLDivElement>(null);
  const arranque = useRef(false);

  // --------------------------------------------------------
  // Llamada al asistente (siempre a través de nuestro servidor)
  // --------------------------------------------------------
  /**
   * Lee la respuesta sin reventar si el cuerpo viene vacío.
   * Si la función del servidor muere, el navegador recibe 0 bytes y
   * res.json() lanza "Unexpected end of JSON input": un error técnico
   * que el cliente no debe mostrarle nunca a un visitante.
   */

  const consultarIA = useCallback(
    async (mensaje: string, tipo: "chat" | "checklist" | "analisis_inversion") => {
      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje,
          idioma,
          tipo,
          session_id: sesion.current,
          historial: tipo === "chat" ? historial.slice(-8) : [],
        }),
      });
      const data = await res
        .json()
        .catch(() => null as { ok?: boolean; error?: string; texto?: string } | null);

      if (!res.ok || !data?.ok || !data.texto) {
        throw new Error(data?.error ?? t.error_generico);
      }

      return data.texto;
    },
    [idioma, historial, t.error_generico]
  );

  const enviarChat = useCallback(
    async (mensaje: string) => {
      const limpio = mensaje.trim();
      if (!limpio || escribiendo) return;

      setHistorial((h) => [...h, { role: "user", text: limpio }]);
      setEntrada("");
      setEscribiendo(true);

      try {
        const texto = await consultarIA(limpio, "chat");
        setHistorial((h) => [...h, { role: "model", text: texto }]);
      } catch (e) {
        setHistorial((h) => [
          ...h,
          { role: "model", text: e instanceof Error ? e.message : t.error_generico },
        ]);
      } finally {
        setEscribiendo(false);
      }
    },
    [consultarIA, escribiendo, t.error_generico]
  );

  const generarChecklist = useCallback(
    async (slug: string) => {
      const servicio = servicios.find((s) => s.slug === slug);
      if (!servicio) return;

      setEscribiendo(true);
      setChecklist(null);

      try {
        const texto = await consultarIA(
          `Trámite: ${servicio.nombre}. ${servicio.descripcion ?? ""}`,
          "checklist"
        );
        setChecklist(texto);
      } catch (e) {
        setChecklist(e instanceof Error ? e.message : t.error_generico);
      } finally {
        setEscribiendo(false);
      }
    },
    [consultarIA, servicios, t.error_generico]
  );

  // --------------------------------------------------------
  // Arranque según el modo con el que se abrió el modal
  // --------------------------------------------------------
  useEffect(() => {
    if (arranque.current) return;
    arranque.current = true;

    if (modo === "checklist" && servicioActivo) {
      void generarChecklist(servicioActivo);
      setModo("contacto");
    } else if (modo === "inversion" && consultaInicial) {
      setModo("ia");
      void enviarChat(consultaInicial);
    }
    // Intencionalmente solo al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    finChat.current?.scrollIntoView({ behavior: "smooth" });
  }, [historial, escribiendo]);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = "";
    };
  }, [onCerrar]);

  // --------------------------------------------------------
  // Envío del lead: primero se guarda, luego se abre WhatsApp
  // --------------------------------------------------------
  const enviarLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (enviandoLead) return;

    const fd = new FormData(e.currentTarget);
    setEnviandoLead(true);
    setAviso(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: fd.get("nombre"),
          email: fd.get("email"),
          telefono: fd.get("telefono"),
          pais: fd.get("pais"),
          servicio_slug: fd.get("servicio"),
          mensaje: fd.get("mensaje"),
          consentimiento: fd.get("consentimiento") === "on",
          empresa_web: fd.get("empresa_web"), // honeypot
          idioma,
          ...leerUtm(),
        }),
      });

      const data = await res
        .json()
        .catch(() => null as { ok?: boolean; error?: string; whatsappUrl?: string } | null);

      if (!res.ok || !data?.ok) {
        setAviso({ tipo: "error", texto: data?.error ?? t.error_generico });
        return;
      }

      setAviso({ tipo: "ok", texto: t.lead_ok });
      if (data.whatsappUrl) window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch {
      setAviso({ tipo: "error", texto: t.error_generico });
    } finally {
      setEnviandoLead(false);
    }
  };

  const enModoChat = modo === "ia" || modo === "inversion";

  return (
    <div
      className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center backdrop-blur-xl p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      role="dialog"
      aria-modal="true"
      aria-label={t.titulo}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full h-[min(88vh,720px)] flex flex-col overflow-hidden my-4">
        {/* Cabecera */}
        <div className="bg-slate-900 p-5 sm:p-6 text-white flex justify-between items-start gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shrink-0">
              <Bot className="w-6 h-6 text-amber-500" />
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-base sm:text-lg uppercase leading-tight tracking-tight truncate">
                {t.titulo}
              </h2>
              <div className="flex gap-1.5 mt-2">
                {(["es", "en", "pt"] as Idioma[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setIdioma(l)}
                    aria-pressed={idioma === l}
                    className={`text-[9px] px-2.5 py-1 rounded border font-black transition-colors ${
                      idioma === l
                        ? "bg-amber-600 border-amber-600 text-white"
                        : "border-slate-700 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setModo(enModoChat ? "contacto" : "ia")}
              className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg hover:bg-amber-500/20 transition-colors uppercase"
            >
              {enModoChat ? t.modo_contacto : t.modo_ia}
            </button>
            <button
              onClick={onCerrar}
              aria-label="Cerrar"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="flex-grow overflow-y-auto bg-slate-50 scrollbar-hide">
          {enModoChat ? (
            <div className="flex flex-col h-full p-5 sm:p-7">
              <div className="flex-grow space-y-4">
                {historial.length === 0 && !escribiendo && (
                  <div className="text-center py-20">
                    <Bot className="w-16 h-16 text-slate-200 mx-auto mb-5" />
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                      {t.chat_vacio}
                    </p>
                  </div>
                )}

                {historial.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-4 sm:p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-slate-900 text-white rounded-tr-sm font-semibold"
                          : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {escribiendo && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl rounded-tl-sm flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {t.analizando}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={finChat} />
              </div>
            </div>
          ) : (
            /* ---------------- FORMULARIO ---------------- */
            <div className="p-5 sm:p-7">
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">{t.sub}</p>

              <form onSubmit={enviarLead} className="space-y-4">
                {/* honeypot: invisible para humanos */}
                <input
                  type="text"
                  name="empresa_web"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] opacity-0 h-0 w-0"
                />

                <input
                  name="nombre"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  placeholder={t.nom}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-amber-500 font-medium transition-colors"
                />
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t.email}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-amber-500 font-medium transition-colors"
                />
                <input
                  name="telefono"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder={t.tel}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-amber-500 font-medium transition-colors"
                />
                <input
                  name="pais"
                  autoComplete="country-name"
                  placeholder={t.pais}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-amber-500 font-medium transition-colors"
                />

                <select
                  name="servicio"
                  required
                  value={servicioSel}
                  onChange={(e) => setServicioSel(e.target.value)}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-amber-500 font-medium cursor-pointer transition-colors"
                >
                  <option value="">{t.sel}</option>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.slug}>
                      {nombreServicio(s, idioma)}
                    </option>
                  ))}
                </select>

                <textarea
                  name="mensaje"
                  rows={3}
                  maxLength={2000}
                  placeholder={t.placeholder_chat}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-amber-500 font-medium resize-none transition-colors"
                />

                <button
                  type="button"
                  disabled={!servicioSel || escribiendo}
                  onClick={() => generarChecklist(servicioSel)}
                  className="w-full text-[10px] font-black text-amber-700 bg-amber-50 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors border border-amber-200 uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {escribiendo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ClipboardCheck className="w-3.5 h-3.5" />
                  )}
                  {t.checklist_btn}
                </button>

                {checklist && (
                  <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl text-xs leading-relaxed border border-amber-500/30">
                    <h3 className="font-black uppercase text-amber-500 mb-3 flex items-center gap-2 tracking-widest text-[10px]">
                      <ClipboardCheck className="w-3.5 h-3.5" /> {t.checklist_titulo}
                    </h3>
                    <div className="whitespace-pre-wrap">{checklist}</div>
                  </div>
                )}

                <label className="flex items-start gap-3 text-xs text-slate-500 leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    name="consentimiento"
                    required
                    className="mt-0.5 w-4 h-4 accent-amber-600 shrink-0"
                  />
                  <span>{t.consentimiento}</span>
                </label>

                {aviso && (
                  <p
                    role="status"
                    className={`text-xs font-bold flex items-center gap-2 p-3 rounded-xl ${
                      aviso.tipo === "ok"
                        ? "text-green-700 bg-green-50"
                        : "text-red-700 bg-red-50"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" /> {aviso.texto}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={enviandoLead}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-800 transition-colors flex items-center justify-center gap-3 disabled:opacity-60"
                >
                  {enviandoLead ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {t.enviando}
                    </>
                  ) : (
                    <>
                      {t.btn} <ArrowRight className="w-4 h-4 text-amber-500" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Barra de entrada del chat */}
        {enModoChat && (
          <div className="p-4 border-t border-slate-200 flex gap-3 bg-white">
            <input
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void enviarChat(entrada);
                }
              }}
              placeholder={t.placeholder_chat}
              aria-label={t.placeholder_chat}
              className="flex-grow p-4 rounded-2xl border-2 border-slate-200 outline-none focus:border-amber-500 font-medium text-sm transition-colors"
            />
            <button
              onClick={() => void enviarChat(entrada)}
              disabled={escribiendo || !entrada.trim()}
              aria-label="Enviar"
              className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-slate-800 transition-colors active:scale-95 disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Pie legal */}
        <div className="bg-slate-50 px-4 py-3 text-center border-t border-slate-200">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-relaxed">
            {t.aviso_ia}
          </p>
        </div>
      </div>
    </div>
  );
}
