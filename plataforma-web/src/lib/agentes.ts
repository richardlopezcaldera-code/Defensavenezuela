import { supabasePublico } from "./supabase/publico";

export type Pais = "VEN" | "CHI" | "SINGLE";

export type AgenteIA = {
  slug: string;
  pais: Pais;
  nombre: string;
  descripcion: string | null;
  titulo_chat: string | null;
  color: string;
  icono: string | null;
  consultas_rapidas: string[];
  categorias: { titulo: string; items: string[] }[];
  orden: number;
};

/** Campos públicos. El system_prompt NUNCA se expone al navegador. */
const CAMPOS_PUBLICOS =
  "slug, pais, nombre, descripcion, titulo_chat, color, icono, consultas_rapidas, categorias, orden";

export async function listarAgentes(): Promise<AgenteIA[]> {
  const { data, error } = await supabasePublico()
    .from("agentes_ia")
    .select(CAMPOS_PUBLICOS)
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("[agentes] no se pudieron leer:", error.message);
    return [];
  }

  return (data ?? []) as AgenteIA[];
}

/** Agrupa las variantes por país bajo un solo agente seleccionable. */
export function agruparPorSlug(agentes: AgenteIA[]) {
  const mapa = new Map<string, AgenteIA[]>();

  for (const a of agentes) {
    const lista = mapa.get(a.slug) ?? [];
    lista.push(a);
    mapa.set(a.slug, lista);
  }

  return [...mapa.entries()]
    .map(([slug, variantes]) => ({
      slug,
      variantes,
      tienePais: variantes.some((v) => v.pais !== "SINGLE"),
      orden: Math.min(...variantes.map((v) => v.orden)),
    }))
    .sort((a, b) => a.orden - b.orden);
}
