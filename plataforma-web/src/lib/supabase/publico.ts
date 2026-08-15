import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de solo lectura para el catálogo público de servicios.
 * La URL y la clave publicable son públicas por diseño: el RLS solo
 * permite leer servicios activos. Por eso van con valor por defecto,
 * para que el sitio funcione aunque falten las variables de entorno.
 */
const URL_POR_DEFECTO = "https://htjjxqvzxkrabozopxhe.supabase.co";
const CLAVE_POR_DEFECTO = "sb_publishable_2cjCAlklxi9-u1bj61loaw_aN0y7vcm";

export function supabasePublico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || URL_POR_DEFECTO;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || CLAVE_POR_DEFECTO;

  return createClient(url, key, {
    auth: { persistSession: false },
    db: { schema: "defensa" },
  });
}
