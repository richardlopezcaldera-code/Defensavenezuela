import { supabasePublico } from "@/lib/supabase/publico";
import type { Servicio } from "@/lib/tipos";
import Landing from "@/components/Landing";

// Revalida el catálogo cada 5 minutos: si editas un servicio en Supabase,
// la web se actualiza sola sin volver a desplegar.
export const revalidate = 300;

const RESPALDO: Servicio[] = [
  {
    id: "fallback-apostilla",
    slug: "apostilla",
    nombre: "Apostilla y Legalización",
    nombre_en: "Apostille & Legalization",
    nombre_pt: "Apostila e Legalização",
    descripcion:
      "Apostilla de La Haya y legalización de documentos venezolanos para uso en Chile y el exterior.",
    categoria: "documentos",
    requisitos: [],
    duracion_estimada: "10 a 25 días hábiles",
    precio_desde: null,
    moneda: "USD",
    orden: 1,
  },
  {
    id: "fallback-poder",
    slug: "poder-especial",
    nombre: "Poder Especial en el Exterior",
    nombre_en: "Special Power of Attorney",
    nombre_pt: "Procuração Especial",
    descripcion:
      "Redacción y protocolización de poderes otorgados desde el exterior para actuar en Venezuela.",
    categoria: "documentos",
    requisitos: [],
    duracion_estimada: "5 a 15 días hábiles",
    precio_desde: null,
    moneda: "USD",
    orden: 2,
  },
  {
    id: "fallback-inversion",
    slug: "inversion-extranjera",
    nombre: "Inversión Extranjera",
    nombre_en: "Foreign Investment",
    nombre_pt: "Investimento Estrangeiro",
    descripcion:
      "Estructuración legal, due diligence y registro de inversión extranjera en Venezuela.",
    categoria: "inversion",
    requisitos: [],
    duracion_estimada: "4 a 8 semanas",
    precio_desde: null,
    moneda: "USD",
    orden: 3,
  },
];

async function obtenerServicios(): Promise<Servicio[]> {
  const cliente = supabasePublico();
  if (!cliente) return RESPALDO;

  const { data, error } = await cliente
    .from("servicios")
    .select(
      "id, slug, nombre, nombre_en, nombre_pt, descripcion, categoria, requisitos, duracion_estimada, precio_desde, moneda, orden"
    )
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error || !data?.length) {
    if (error) console.error("[servicios] error al leer de Supabase:", error.message);
    return RESPALDO;
  }

  return data as Servicio[];
}

export default async function Pagina() {
  const servicios = await obtenerServicios();
  return <Landing servicios={servicios} />;
}
