import "server-only";
import { supabaseAdmin } from "./supabase/admin";

export type RegistroConsulta = {
  session_id: string;
  idioma?: string;
  tipo?: string;
  agente_slug?: string | null;
  pais?: string | null;
  pregunta: string;
  respuesta?: string | null;
  modelo?: string | null;
  tokens_in?: number | null;
  tokens_out?: number | null;
  latencia_ms?: number | null;
  error?: string | null;
  ip_hash?: string | null;
};

/**
 * Registra la consulta sin poder tumbar la respuesta al usuario.
 *
 * supabaseAdmin() LANZA si faltan las variables de entorno. Si esa llamada
 * ocurre dentro de un bloque catch sin protección, la excepción escapa, la
 * función serverless muere y el navegador recibe un cuerpo vacío: el cliente
 * falla con "Unexpected end of JSON input". Por eso aquí se traga todo.
 */
export async function registrarConsultaIA(datos: RegistroConsulta): Promise<void> {
  try {
    const { error } = await supabaseAdmin().from("consultas_ia").insert(datos);
    if (error) console.error("[registro] no se guardó la consulta:", error.message);
  } catch (e) {
    console.error("[registro] registro deshabilitado:", e instanceof Error ? e.message : e);
  }
}
