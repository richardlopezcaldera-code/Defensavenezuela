import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de solo lectura para el catálogo público de servicios.
 * Usa la clave publicable: el RLS solo deja ver servicios activos.
 */
export function supabasePublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: "defensa" },
  });
}
