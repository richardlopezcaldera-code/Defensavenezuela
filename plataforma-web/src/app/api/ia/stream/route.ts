import { CONTEXTO_BASE, llamarGeminiStream } from "@/lib/gemini";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITIO } from "@/lib/config";
import { hashIp, ipDe, limitar, limpiar } from "@/lib/seguridad";
import { MARCA_ERROR } from "@/lib/marcas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Turno = { role: "user" | "model"; text: string };

const PAISES = ["VEN", "CHI", "SINGLE"] as const;

async function promptDelAgente(slug: string | null, pais: string) {
  if (!slug) return null;

  const { data, error } = await supabaseAdmin()
    .from("agentes_ia")
    .select("system_prompt")
    .eq("slug", slug)
    .eq("pais", pais)
    .eq("activo", true)
    .maybeSingle();

  if (error) {
    console.error("[ia/stream] no se pudo leer el agente:", error.message);
    return null;
  }

  return data?.system_prompt ?? null;
}

function textoPlano(cuerpo: string, status: number) {
  return new Response(cuerpo, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  const ip = ipDe(req);

  if (!limitar(`ia:${ip}`, 20, 10 * 60 * 1000)) {
    return textoPlano(
      `Has alcanzado el límite de consultas. Continúa por WhatsApp: ${SITIO.whatsappMostrar}`,
      429
    );
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return textoPlano("Solicitud inválida.", 400);
  }

  const mensaje = limpiar(cuerpo.mensaje, 2000);
  if (!mensaje) return textoPlano("Mensaje vacío.", 400);

  const sessionId = limpiar(cuerpo.session_id, 64) ?? "anonima";
  const agenteSlug = limpiar(cuerpo.agente, 60);
  const paisBruto = String(cuerpo.pais ?? "SINGLE").toUpperCase();
  const pais = (PAISES as readonly string[]).includes(paisBruto) ? paisBruto : "SINGLE";

  // Solo los últimos 8 turnos: el historial no crece sin límite.
  const historial: Turno[] = Array.isArray(cuerpo.historial)
    ? (cuerpo.historial as Turno[])
        .filter((t) => t && (t.role === "user" || t.role === "model") && typeof t.text === "string")
        .slice(-8)
        .map((t) => ({ role: t.role, text: t.text.slice(0, 2000) }))
    : [];

  const systemPrompt = (await promptDelAgente(agenteSlug, pais)) ?? CONTEXTO_BASE;
  const codificador = new TextEncoder();

  const flujo = new ReadableStream({
    async start(controlador) {
      const generador = llamarGeminiStream({ systemPrompt, historial, mensaje });

      try {
        let paso = await generador.next();
        while (!paso.done) {
          controlador.enqueue(codificador.encode(paso.value));
          paso = await generador.next();
        }

        const { texto, modelo, latenciaMs } = paso.value;

        void supabaseAdmin()
          .from("consultas_ia")
          .insert({
            session_id: sessionId,
            idioma: "es",
            tipo: "chat",
            agente_slug: agenteSlug,
            pais,
            pregunta: mensaje,
            respuesta: texto,
            modelo,
            latencia_ms: latenciaMs,
            ip_hash: hashIp(ip),
          })
          .then(({ error }) => {
            if (error) console.error("[ia/stream] no se registró la consulta:", error.message);
          });
      } catch (e) {
        const detalle = e instanceof Error ? e.message : String(e);
        console.error("[ia/stream] error:", detalle);

        // El aviso va dentro del flujo para que el usuario vea algo útil,
        // pero se marca para que el cliente NO lo guarde en el historial.
        controlador.enqueue(
          codificador.encode(
            MARCA_ERROR + `No pudimos completar la respuesta. Escríbenos por WhatsApp: ${SITIO.whatsappMostrar}`
          )
        );

        void supabaseAdmin()
          .from("consultas_ia")
          .insert({
            session_id: sessionId,
            tipo: "chat",
            agente_slug: agenteSlug,
            pais,
            pregunta: mensaje,
            error: detalle.slice(0, 500),
            ip_hash: hashIp(ip),
          })
          .then(() => undefined);
      } finally {
        controlador.close();
      }
    },
  });

  return new Response(flujo, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
