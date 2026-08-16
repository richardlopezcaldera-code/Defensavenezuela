import { NextResponse } from "next/server";
import { CONTEXTO_BASE, llamarGemini } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITIO } from "@/lib/config";
import { hashIp, ipDe, limitar, limpiar } from "@/lib/seguridad";
import { registrarConsultaIA } from "@/lib/registro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Turno = { role: "user" | "model"; text: string };

const PAISES = ["VEN", "CHI", "SINGLE"] as const;

/**
 * Carga el prompt del agente desde la base.
 * Vive en el servidor: el prompt es propiedad intelectual del estudio
 * y nunca debe viajar al navegador.
 */
async function promptDelAgente(slug: string | null, pais: string) {
  if (!slug) return null;

  try {
    const { data, error } = await supabaseAdmin()
      .from("agentes_ia")
      .select("system_prompt")
      .eq("slug", slug)
      .eq("pais", pais)
      .eq("activo", true)
      .maybeSingle();

    if (error) {
      console.error("[ia] no se pudo leer el agente:", error.message);
      return null;
    }

    return data?.system_prompt ?? null;
  } catch (e) {
    console.error("[ia] base no disponible:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function POST(req: Request) {
  const ip = ipDe(req);

  if (!limitar(`ia:${ip}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Has alcanzado el límite de consultas. Continúa por WhatsApp." },
      { status: 429 }
    );
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const mensaje = limpiar(cuerpo.mensaje, 2000);
  const idioma = ["es", "en", "pt"].includes(String(cuerpo.idioma)) ? String(cuerpo.idioma) : "es";
  const sessionId = limpiar(cuerpo.session_id, 64) ?? "anonima";
  const agenteSlug = limpiar(cuerpo.agente, 60);
  const paisBruto = String(cuerpo.pais ?? "SINGLE").toUpperCase();
  const pais = (PAISES as readonly string[]).includes(paisBruto) ? paisBruto : "SINGLE";
  const tipo = ["chat", "checklist", "analisis_inversion"].includes(String(cuerpo.tipo))
    ? String(cuerpo.tipo)
    : "chat";

  if (!mensaje) {
    return NextResponse.json({ ok: false, error: "Mensaje vacío." }, { status: 400 });
  }

  const historial: Turno[] = Array.isArray(cuerpo.historial)
    ? (cuerpo.historial as Turno[])
        .filter((t) => t && (t.role === "user" || t.role === "model") && typeof t.text === "string")
        .slice(-8)
        .map((t) => ({ role: t.role, text: t.text.slice(0, 2000) }))
    : [];

  const idiomaNombre = { es: "español", en: "inglés", pt: "portugués" }[idioma] ?? "español";

  // 1º el prompt del agente especializado; si no hay, el contexto general.
  const base = (await promptDelAgente(agenteSlug, pais)) ?? CONTEXTO_BASE;

  const instrucciones =
    tipo === "checklist"
      ? `${base}

TAREA: entrega una lista numerada de requisitos y pasos para el trámite indicado, pensada para un cliente que está fuera de Venezuela. Marca cuáles requisitos exigen apostilla y cuáles pueden gestionarse por poder. Idioma de la respuesta: ${idiomaNombre}.`
      : tipo === "analisis_inversion"
        ? `${base}

TAREA: analiza la viabilidad legal preliminar del proyecto de inversión descrito. Cubre: forma societaria recomendada, permisos sectoriales probables, riesgo cambiario y de sanciones, y los tres puntos de due diligence más críticos. Idioma de la respuesta: ${idiomaNombre}.`
        : `${base}

Idioma de la respuesta: ${idiomaNombre}. WhatsApp del equipo: ${SITIO.whatsappMostrar}.`;

  try {
    const resultado = await llamarGemini({
      systemPrompt: instrucciones,
      historial: tipo === "chat" ? historial : [],
      mensaje,
    });

    // Registro para seguimiento comercial. Nunca bloquea la respuesta.
    void registrarConsultaIA({
      session_id: sessionId,
      idioma,
      tipo,
      agente_slug: agenteSlug,
      pais,
      pregunta: mensaje,
      respuesta: resultado.texto,
      modelo: resultado.modelo,
      tokens_in: resultado.tokensIn,
      tokens_out: resultado.tokensOut,
      latencia_ms: resultado.latenciaMs,
      ip_hash: hashIp(ip),
    });

    return NextResponse.json({ ok: true, texto: resultado.texto });
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    console.error("[ia] error:", detalle);

    void registrarConsultaIA({
      session_id: sessionId,
      idioma,
      tipo,
      agente_slug: agenteSlug,
      pais,
      pregunta: mensaje,
      error: detalle.slice(0, 500),
      ip_hash: hashIp(ip),
    });

    return NextResponse.json(
      {
        ok: false,
        error: `El asistente no está disponible en este momento. Escríbenos por WhatsApp: ${SITIO.whatsappMostrar}`,
      },
      { status: 503 }
    );
  }
}
