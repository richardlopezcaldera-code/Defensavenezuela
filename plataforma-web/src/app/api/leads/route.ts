import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SITIO, urlWhatsApp } from "@/lib/config";
import {
  emailValido,
  hashIp,
  ipDe,
  limitar,
  limpiar,
  telefonoValido,
} from "@/lib/seguridad";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ORIGENES = [
  "web",
  "whatsapp",
  "instagram",
  "facebook",
  "linkedin",
  "tiktok",
  "youtube",
  "referido",
  "otro",
] as const;

export async function POST(req: Request) {
  const ip = ipDe(req);

  if (!limitar(`lead:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: "Demasiadas solicitudes. Intenta en unos minutos." },
      { status: 429 }
    );
  }

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  // Honeypot: los bots rellenan campos ocultos.
  if (limpiar(cuerpo.empresa_web)) {
    return NextResponse.json({ ok: true, whatsappUrl: urlWhatsApp("Hola") });
  }

  const nombre = limpiar(cuerpo.nombre, 120);
  const email = limpiar(cuerpo.email, 254);
  const telefono = limpiar(cuerpo.telefono, 30);
  const servicio = limpiar(cuerpo.servicio_slug, 80);
  const mensaje = limpiar(cuerpo.mensaje, 2000);
  const pais = limpiar(cuerpo.pais, 80);
  const idioma = ["es", "en", "pt"].includes(String(cuerpo.idioma)) ? String(cuerpo.idioma) : "es";
  const origenBruto = String(cuerpo.origen ?? "web");
  const origen = (ORIGENES as readonly string[]).includes(origenBruto) ? origenBruto : "web";

  if (!nombre || nombre.length < 2) {
    return NextResponse.json({ ok: false, error: "Indica tu nombre." }, { status: 400 });
  }
  if (!email || !emailValido(email)) {
    return NextResponse.json({ ok: false, error: "Email inválido." }, { status: 400 });
  }
  if (!telefono || !telefonoValido(telefono)) {
    return NextResponse.json({ ok: false, error: "Teléfono inválido." }, { status: 400 });
  }
  if (cuerpo.consentimiento !== true) {
    return NextResponse.json(
      { ok: false, error: "Debes autorizar el tratamiento de tus datos." },
      { status: 400 }
    );
  }

  const texto = [
    `Hola, soy ${nombre}.`,
    servicio ? `Me interesa: ${servicio.replace(/-/g, " ")}.` : null,
    pais ? `Escribo desde ${pais}.` : null,
    mensaje ? `Consulta: ${mensaje}` : null,
    `(Enviado desde ${SITIO.url})`,
  ]
    .filter(Boolean)
    .join(" ");

  const whatsappUrl = urlWhatsApp(texto);

  try {
    const { error } = await supabaseAdmin()
      .from("leads")
      .insert({
        nombre,
        email,
        telefono,
        pais,
        servicio_slug: servicio,
        mensaje,
        idioma,
        origen,
        utm_source: limpiar(cuerpo.utm_source, 100),
        utm_medium: limpiar(cuerpo.utm_medium, 100),
        utm_campaign: limpiar(cuerpo.utm_campaign, 100),
        landing_url: limpiar(cuerpo.landing_url, 500),
        consentimiento_datos: true,
        ip_hash: hashIp(ip),
        user_agent: limpiar(req.headers.get("user-agent"), 300),
      });

    if (error) throw error;
  } catch (e) {
    // El lead nunca se pierde: aunque falle la base, el cliente llega a WhatsApp.
    console.error("[leads] fallo al guardar:", e);
    return NextResponse.json({ ok: true, whatsappUrl, guardado: false });
  }

  return NextResponse.json({ ok: true, whatsappUrl, guardado: true });
}
