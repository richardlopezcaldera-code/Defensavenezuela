import "server-only";
import { createHash } from "crypto";

/**
 * Rate limit en memoria. Suficiente para una landing en Vercel;
 * si el tráfico crece, mover a Upstash Redis o Supabase.
 */
const ventanas = new Map<string, { conteo: number; reinicio: number }>();

export function limitar(clave: string, maximo: number, ventanaMs: number): boolean {
  const ahora = Date.now();
  const actual = ventanas.get(clave);

  if (!actual || ahora > actual.reinicio) {
    ventanas.set(clave, { conteo: 1, reinicio: ahora + ventanaMs });
    return true;
  }

  if (actual.conteo >= maximo) return false;

  actual.conteo += 1;
  return true;
}

export function ipDe(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "desconocida"
  );
}

/** Guardamos hash, no la IP en claro: minimiza datos personales almacenados. */
export function hashIp(ip: string): string {
  const sal = process.env.IP_HASH_SALT ?? "defensavenezuela";
  return createHash("sha256").update(`${sal}:${ip}`).digest("hex").slice(0, 32);
}

export function limpiar(valor: unknown, max = 500): string | null {
  if (typeof valor !== "string") return null;
  const limpio = valor.trim().replace(/[\u0000-\u001F\u007F]/g, "");
  if (!limpio) return null;
  return limpio.slice(0, max);
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254;
}

export function telefonoValido(tel: string): boolean {
  const digitos = tel.replace(/\D/g, "");
  return digitos.length >= 7 && digitos.length <= 15;
}
