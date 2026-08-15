import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de servidor con service_role, apuntando al esquema "defensa".
 * NUNCA importar este archivo desde un componente cliente:
 * la clave salta el RLS y da acceso total a la base.
 */
type ClienteDefensa = ReturnType<typeof crear>;

function crear() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "defensa" },
  });
}

let cache: ClienteDefensa | null = null;

export function supabaseAdmin(): ClienteDefensa {
  if (!cache) cache = crear();
  return cache;
}
