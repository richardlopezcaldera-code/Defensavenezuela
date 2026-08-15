import { NextResponse } from "next/server";
import { CONTEXTO_BASE, llamarGemini } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITIO } from "@/lib/config";
import { hashIp, ipDe, limitar, limpiar } from "@/lib/seguridad";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Turno = { role: "user" | "model"; text: string };

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

  const instrucciones =
    tipo === "checklist"
      ? `${CONTEXTO_BASE}

TAREA: entrega una lista numerada de requisitos y pasos para el trámite indicado, pensada para un cliente que está fuera de Venezuela. Marca cuáles requisitos exigen apostilla y cuáles pueden gestionarse por poder. Idioma de la respuesta: ${idiomaNombre}.`
      : tipo === "analisis_inversion"
        ? `${CONTEXTO_BASE}

TAREA: analiza la viabilidad legal preliminar del proyecto de inversión descrito. Cubre: forma societaria recomendada, permisos sectoriales probables, riesgo cambiario y de sanciones, y los tres puntos de due diligence más críticos. Idioma de la respuesta: ${idiomaNombre}.`
        : `${CONTEXTO_BASE}

Idioma de la respuesta: ${idiomaNombre}. WhatsApp del equipo: +${SITIO.whatsapp}.`;

  try {
    const resultado = await llamarGemini({
      systemPrompt: instrucciones,
      historial: tipo === "chat" ? historial : [],
      mensaje,
    });

    // Registro para seguimiento comercial. Nunca bloquea la respuesta.
    void supabaseAdmin()
      .from("consultas_ia")
      .insert({
        session_id: sessionId,
        idioma,
        tipo,
        pregunta: mensaje,
        respuesta: resultado.texto,
        modelo: resultado.modelo,
        tokens_in: resultado.tokensIn,
        tokens_out: resultado.tokensOut,
        latencia_ms: resultado.latenciaMs,
        ip_hash: hashIp(ip),
      })
      .then(({ error }) => {
        if (error) console.error("[ia] no se pudo registrar la consulta:", error.message);
      });

    return NextResponse.json({ ok: true, texto: resultado.texto });
  } catch (e) {
    const detalle = e instanceof Error ? e.message : String(e);
    console.error("[ia] error:", detalle);

    void supabaseAdmin()
      .from("consultas_ia")
      .insert({
        session_id: sessionId,
        idioma,
        tipo,
        pregunta: mensaje,
        error: detalle.slice(0, 500),
        ip_hash: hashIp(ip),
      })
      .then(() => undefined);

    return NextResponse.json(
      {
        ok: false,
        error: "El asistente no está disponible en este momento. Escríbenos por WhatsApp.",
      },
      { status: 503 }
    );
  }
}
