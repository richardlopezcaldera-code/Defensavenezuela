import "server-only";

const MODELO = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

type Turno = { role: "user" | "model"; text: string };

export type ResultadoIA = {
  texto: string;
  modelo: string;
  latenciaMs: number;
  tokensIn?: number;
  tokensOut?: number;
};

/**
 * Llama a Gemini desde el SERVIDOR. La clave nunca llega al navegador.
 * Reintenta con backoff exponencial solo ante errores transitorios (429/5xx).
 */
export async function llamarGemini(opciones: {
  systemPrompt: string;
  historial?: Turno[];
  mensaje: string;
  maxIntentos?: number;
}): Promise<ResultadoIA> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada en el entorno.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`;
  const maxIntentos = opciones.maxIntentos ?? 3;
  const inicio = Date.now();

  const contents = [
    ...(opciones.historial ?? []).map((t) => ({
      role: t.role,
      parts: [{ text: t.text }],
    })),
    { role: "user" as const, parts: [{ text: opciones.mensaje }] },
  ];

  const cuerpo = {
    systemInstruction: { parts: [{ text: opciones.systemPrompt }] },
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1200,
    },
  };

  let ultimoError = "";

  for (let intento = 0; intento < maxIntentos; intento++) {
    const controlador = new AbortController();
    const timeout = setTimeout(() => controlador.abort(), 25_000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(cuerpo),
        signal: controlador.signal,
      });

      if (res.ok) {
        const data = await res.json();
        const texto: string | undefined =
          data?.candidates?.[0]?.content?.parts
            ?.map((p: { text?: string }) => p.text ?? "")
            .join("") || undefined;

        if (!texto) throw new Error("Respuesta vacía del modelo.");

        return {
          texto,
          modelo: MODELO,
          latenciaMs: Date.now() - inicio,
          tokensIn: data?.usageMetadata?.promptTokenCount,
          tokensOut: data?.usageMetadata?.candidatesTokenCount,
        };
      }

      const detalle = await res.text();
      ultimoError = `HTTP ${res.status}: ${detalle.slice(0, 300)}`;

      // 4xx que no sea 429 no se reintenta: es un error de configuración.
      if (res.status !== 429 && res.status < 500) break;
    } catch (e) {
      ultimoError = e instanceof Error ? e.message : String(e);
    } finally {
      clearTimeout(timeout);
    }

    if (intento < maxIntentos - 1) {
      await new Promise((r) => setTimeout(r, 2 ** intento * 800));
    }
  }

  throw new Error(`Gemini falló tras ${maxIntentos} intentos. ${ultimoError}`);
}

export const CONTEXTO_BASE = `Eres el asistente legal senior de DefensaVenezuela, el estudio del Abg. Richard López Caldera (Venezuela y Chile).

Alcance: apostillas y legalizaciones, poderes otorgados en el exterior, documentos de registro civil venezolano, residencia y regularización migratoria en Chile, constitución de empresas en Chile, inversión extranjera en Venezuela y estructuras fiduciarias LegalBridge Trust.

Reglas estrictas:
- Responde SIEMPRE en el idioma solicitado.
- Sé concreto y profesional. Máximo 200 palabras salvo que pidan una lista de requisitos.
- Nunca inventes plazos, aranceles ni artículos de ley que no conozcas con certeza: di que se confirma en la consulta.
- Aclara que la orientación es preliminar y no sustituye asesoría legal formal.
- No solicites números de documento, datos bancarios ni información sensible por este canal.
- Cierra invitando de forma elegante a continuar por WhatsApp con el equipo.`;

/**
 * Versión en streaming: devuelve los fragmentos según llegan.
 * El usuario ve texto a los ~2 segundos en vez de esperar la respuesta completa.
 */
export async function* llamarGeminiStream(opciones: {
  systemPrompt: string;
  historial?: Turno[];
  mensaje: string;
}): AsyncGenerator<string, { texto: string; modelo: string; latenciaMs: number }, void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no está configurada en el entorno.");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:streamGenerateContent?alt=sse`;
  const inicio = Date.now();

  const contents = [
    ...(opciones.historial ?? []).map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
    { role: "user" as const, parts: [{ text: opciones.mensaje }] },
  ];

  const controlador = new AbortController();
  const timeout = setTimeout(() => controlador.abort(), 55_000);

  let completo = "";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opciones.systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 1600 },
      }),
      signal: controlador.signal,
    });

    if (!res.ok || !res.body) {
      const detalle = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${detalle.slice(0, 200)}`);
    }

    const lector = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await lector.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lineas = buffer.split("\n");
      buffer = lineas.pop() ?? "";

      for (const linea of lineas) {
        if (!linea.startsWith("data:")) continue;
        const json = linea.slice(5).trim();
        if (!json || json === "[DONE]") continue;

        try {
          const dato = JSON.parse(json);
          const trozo: string =
            dato?.candidates?.[0]?.content?.parts
              ?.map((p: { text?: string }) => p.text ?? "")
              .join("") ?? "";
          if (trozo) {
            completo += trozo;
            yield trozo;
          }
        } catch {
          // Fragmento SSE incompleto: se ignora y se reintenta en la próxima vuelta.
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }

  if (!completo) throw new Error("El modelo no devolvió contenido.");

  return { texto: completo, modelo: MODELO, latenciaMs: Date.now() - inicio };
}
