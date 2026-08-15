export type Idioma = "es" | "en" | "pt";

export type Servicio = {
  id: string;
  slug: string;
  nombre: string;
  nombre_en: string | null;
  nombre_pt: string | null;
  descripcion: string | null;
  categoria: "documentos" | "migratorio" | "inversion" | "corporativo" | "fiduciario";
  requisitos: string[];
  duracion_estimada: string | null;
  precio_desde: number | null;
  moneda: string;
  orden: number;
};

export type MensajeChat = {
  role: "user" | "model";
  text: string;
};

export type RespuestaLead = {
  ok: boolean;
  whatsappUrl?: string;
  error?: string;
};

export function nombreServicio(s: Servicio, idioma: Idioma): string {
  if (idioma === "en" && s.nombre_en) return s.nombre_en;
  if (idioma === "pt" && s.nombre_pt) return s.nombre_pt;
  return s.nombre;
}
