"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Send, ArrowLeft, MessageCircle, AlertTriangle } from "lucide-react";
import type { AgenteIA, Pais } from "@/lib/agentes";
import { agruparPorSlug } from "@/lib/agentes";
import { MARCA_ERROR } from "@/lib/marcas";
import { SITIO, urlWhatsApp } from "@/lib/config";

type Mensaje = { rol: "user" | "model"; texto: string; error?: boolean };

/** Formato mínimo: negritas, títulos y viñetas. Sin HTML del modelo. */
function Formateado({ texto }: { texto: string }) {
  const lineas = texto.split("\n");

  return (
    <div className="space-y-1.5">
      {lineas.map((linea, i) => {
        const titulo = linea.match(/^#{1,3}\s+(.*)$/);
        if (titulo) {
          return (
            <p key={i} className="font-bold text-white pt-2">
              {titulo[1]}
            </p>
          );
        }

        const vineta = linea.match(/^[-*]\s+(.*)$/);
        const contenido = vineta ? vineta[1] : linea;
        const partes = contenido.split(/(\*\*[^*]+\*\*)/g);

        const cuerpo = partes.map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={j} className="font-semibold text-white">
              {p.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{p}</span>
          )
        );

        if (!linea.trim()) return <div key={i} className="h-2" />;

        return vineta ? (
          <p key={i} className="pl-4 relative before:content-['•'] before:absolute before:left-1 before:text-amber-500">
            {cuerpo}
          </p>
        ) : (
          <p key={i}>{cuerpo}</p>
        );
      })}
    </div>
  );
}

export default function CentroAgentes({ agentes }: { agentes: AgenteIA[] }) {
  const grupos = useMemo(() => agruparPorSlug(agentes), [agentes]);

  const [slugActivo, setSlugActivo] = useState(grupos[0]?.slug ?? "");
  const [pais, setPais] = useState<Pais>("VEN");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);

  const finRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string>("");

  if (!sessionRef.current && typeof window !== "undefined") {
    sessionRef.current = crypto.randomUUID().slice(0, 32);
  }

  const grupo = grupos.find((g) => g.slug === slugActivo) ?? grupos[0];

  const agente: AgenteIA | undefined = useMemo(() => {
    if (!grupo) return undefined;
    if (!grupo.tienePais) return grupo.variantes[0];
    return grupo.variantes.find((v) => v.pais === pais) ?? grupo.variantes[0];
  }, [grupo, pais]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  function cambiarAgente(slug: string) {
    setSlugActivo(slug);
    setMensajes([]);
  }

  function cambiarPais(p: Pais) {
    setPais(p);
    setMensajes([]);
  }

  async function enviar(textoDirecto?: string) {
    const texto = (textoDirecto ?? entrada).trim();
    if (!texto || cargando || !agente) return;

    setEntrada("");
    setCargando(true);

    // El historial solo lleva turnos válidos: los avisos de error quedan fuera.
    const historial = mensajes
      .filter((m) => !m.error)
      .slice(-8)
      .map((m) => ({ role: m.rol, text: m.texto }));

    setMensajes((prev) => [...prev, { rol: "user", texto }]);

    let acumulado = "";
    let huboError = false;

    try {
      const res = await fetch("/api/ia/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: texto,
          agente: agente.slug,
          pais: agente.pais,
          historial,
          session_id: sessionRef.current,
        }),
      });

      if (!res.ok || !res.body) {
        const aviso = await res.text().catch(() => "");
        throw new Error(aviso || `HTTP ${res.status}`);
      }

      const lector = res.body.getReader();
      const decoder = new TextDecoder();

      setMensajes((prev) => [...prev, { rol: "model", texto: "" }]);

      while (true) {
        const { done, value } = await lector.read();
        if (done) break;

        acumulado += decoder.decode(value, { stream: true });

        // El servidor marca los avisos para que no entren al historial.
        const partido = acumulado.split(MARCA_ERROR);
        const visible = partido.join("\n\n");
        huboError = partido.length > 1;

        setMensajes((prev) => {
          const copia = [...prev];
          copia[copia.length - 1] = { rol: "model", texto: visible, error: huboError };
          return copia;
        });
      }
    } catch (e) {
      const detalle = e instanceof Error ? e.message : "";
      setMensajes((prev) => [
        ...prev,
        {
          rol: "model",
          error: true,
          texto:
            detalle ||
            `No pudimos conectar con el asistente. Escríbenos por WhatsApp: ${SITIO.whatsappMostrar}`,
        },
      ]);
    } finally {
      setCargando(false);
    }
  }

  if (!grupo || !agente) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-slate-400">
        <p>No hay agentes disponibles.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* Barra superior */}
      <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-white/10 bg-slate-950/95 backdrop-blur sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-black tracking-tight text-white">
            DEFENSA<span className="text-amber-500">VENEZUELA</span>
          </span>
        </Link>

        <a
          href={urlWhatsApp("Hola, vengo del centro de agentes IA y quiero una consulta.")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-xs font-bold transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {SITIO.whatsappMostrar}
        </a>
      </header>

      {/* Selector de agente */}
      <div className="border-b border-white/10 bg-slate-900/60 px-4 md:px-6 pt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2.5">
          Seleccione el agente especializado
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {grupos.map((g) => {
            const v = g.variantes[0];
            const activo = g.slug === slugActivo;
            return (
              <button
                key={g.slug}
                onClick={() => cambiarAgente(g.slug)}
                style={activo ? { borderBottomColor: v.color } : undefined}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-t-xl whitespace-nowrap text-sm transition-colors border-b-2 ${
                  activo
                    ? "bg-slate-950 text-white font-semibold"
                    : "border-b-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-base">{v.icono}</span>
                <span>{v.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Panel lateral */}
        <aside className="hidden lg:flex w-72 flex-col border-r border-white/10 bg-slate-900/40">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-bold text-base flex items-center gap-2">
              <span>{agente.icono}</span> {agente.nombre}
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{agente.descripcion}</p>
          </div>

          {grupo.tienePais && (
            <div className="p-3 border-b border-white/10">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
                País
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(["VEN", "CHI"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => cambiarPais(p)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      pais === p
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                        : "border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {p === "VEN" ? "Venezuela" : "Chile"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
            {agente.categorias.map((cat) => (
              <div key={cat.titulo} className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 px-1.5 mb-1.5">
                  {cat.titulo}
                </p>
                {cat.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => enviar(item)}
                    disabled={cargando}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* Chat */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 md:px-6 py-3 border-b border-white/10 flex items-center justify-between">
            <div>
              <h1 className="font-bold">{agente.titulo_chat}</h1>
              <p className="text-[11px] text-slate-500">
                {agente.pais === "VEN"
                  ? "Derecho venezolano"
                  : agente.pais === "CHI"
                    ? "Derecho chileno"
                    : "defensavenezuela.ia"}{" "}
                · {SITIO.abogado}
              </p>
            </div>
            {grupo.tienePais && (
              <span className="text-[11px] px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 font-semibold">
                {agente.pais === "VEN" ? "Venezuela" : "Chile"}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4 scrollbar-hide">
            {mensajes.length === 0 && (
              <div className="max-w-md mx-auto text-center py-10">
                <div className="text-4xl mb-3">{agente.icono}</div>
                <h2 className="text-xl font-bold mb-2">{agente.nombre}</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">{agente.descripcion}</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Orientación informativa. No sustituye asesoría legal formal.
                </p>
              </div>
            )}

            {mensajes.map((m, i) => (
              <div key={i} className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.rol === "user"
                      ? "bg-amber-600 text-white rounded-br-sm"
                      : m.error
                        ? "bg-red-950/50 border border-red-800/40 text-red-200 rounded-bl-sm"
                        : "bg-slate-900 border border-white/10 text-slate-200 rounded-bl-sm"
                  }`}
                >
                  {m.error && (
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider mb-1.5">
                      <AlertTriangle className="w-3 h-3" /> Aviso
                    </div>
                  )}
                  <Formateado texto={m.texto} />
                </div>
              </div>
            ))}

            {cargando && mensajes[mensajes.length - 1]?.rol === "user" && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Analizando marco legal
                  </span>
                </div>
              </div>
            )}

            <div ref={finRef} />
          </div>

          {/* Consultas rápidas */}
          {mensajes.length === 0 && agente.consultas_rapidas.length > 0 && (
            <div className="px-4 md:px-6 pb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 mb-2">
                Consultas rápidas
              </p>
              <div className="flex gap-2 flex-wrap">
                {agente.consultas_rapidas.map((q) => (
                  <button
                    key={q}
                    onClick={() => enviar(q)}
                    disabled={cargando}
                    className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[11px] text-slate-400 hover:text-white hover:border-amber-500/40 transition-colors disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Entrada */}
          <div className="px-4 md:px-6 py-3 border-t border-white/10">
            <div className="flex gap-2 items-end">
              <textarea
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviar();
                  }
                }}
                rows={1}
                placeholder="Escriba su consulta..."
                className="flex-1 resize-none bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/50 transition-colors max-h-32"
              />
              <button
                onClick={() => enviar()}
                disabled={cargando || !entrada.trim()}
                aria-label="Enviar consulta"
                className="w-11 h-11 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-white/5 disabled:text-slate-600 grid place-items-center transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-600 text-center mt-2">
              {SITIO.abogado} · {SITIO.email} · {SITIO.whatsappMostrar}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
