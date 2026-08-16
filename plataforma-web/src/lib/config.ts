/**
 * Configuración central del sitio.
 * Datos reales tomados de defensavenezuela.com y del bio link.
 */

export const SITIO = {
  nombre: "DefensaVenezuela",
  marca: "defensavenezuela.ia",
  estudio: "López & Asociado",
  abogado: "Abg. Richard López Caldera",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://defensavenezuela.com",
  descripcion:
    "Asesoría legal para la diáspora venezolana e inversionistas: apostillas, poderes, trámites migratorios, constitución de empresas en Chile e inversión extranjera.",
  email: process.env.NEXT_PUBLIC_EMAIL_CONTACTO ?? "estudiosjuridicoslopezk@gmail.com",
  /** WhatsApp principal (Chile) */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "56994237663",
  whatsappMostrar: "+56 9 9423 7663",
  /** WhatsApp Venezuela */
  whatsappVe: process.env.NEXT_PUBLIC_WHATSAPP_VE ?? "584242390218",
  whatsappVeMostrar: "+58 424 239 0218",
} as const;

export const REDES = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM ?? "https://www.instagram.com/defensavenezuela.ia/",
  linkedin:
    process.env.NEXT_PUBLIC_LINKEDIN ??
    "https://www.linkedin.com/in/richard-lopez-caldera-041a092a3/",
  tiktok: process.env.NEXT_PUBLIC_TIKTOK ?? "https://tiktok.com/@defensavenezuela",
  youtube: process.env.NEXT_PUBLIC_YOUTUBE ?? "https://youtube.com/@defensavenezuela",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK ?? "",
} as const;

/** Canales que no son redes sociales pero sí puntos de contacto públicos */
export const CANALES = {
  telegram: process.env.NEXT_PUBLIC_TELEGRAM ?? "https://t.me/defensavenezuela",
  x: process.env.NEXT_PUBLIC_X ?? "https://x.com/defensavenezuela",
} as const;

/** Todo lo que se declara como sameAs en el JSON-LD */
export const PERFILES_PUBLICOS = [
  ...Object.values(REDES),
  ...Object.values(CANALES),
].filter(Boolean);

export const urlWhatsApp = (texto: string, pais: "CL" | "VE" = "CL") =>
  `https://wa.me/${pais === "VE" ? SITIO.whatsappVe : SITIO.whatsapp}?text=${encodeURIComponent(texto)}`;
