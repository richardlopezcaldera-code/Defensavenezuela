/**
 * Configuración central del sitio.
 * Todo lo que antes estaba quemado en el JSX vive aquí.
 */

export const SITIO = {
  nombre: "DefensaVenezuela",
  estudio: "López & Asociado",
  abogado: "Abg. Richard López Caldera",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://defensavenezuela.com",
  descripcion:
    "Asesoría legal para la diáspora venezolana e inversionistas: apostillas, poderes, trámites migratorios, constitución de empresas en Chile e inversión extranjera.",
  email: process.env.NEXT_PUBLIC_EMAIL_CONTACTO ?? "contacto@defensavenezuela.com",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "56994237663",
} as const;

export const REDES = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM ?? "https://instagram.com/defensavenezuela",
  facebook: process.env.NEXT_PUBLIC_FACEBOOK ?? "https://facebook.com/defensavenezuela",
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN ?? "https://www.linkedin.com/company/defensavenezuela",
  tiktok: process.env.NEXT_PUBLIC_TIKTOK ?? "https://tiktok.com/@defensavenezuela",
  youtube: process.env.NEXT_PUBLIC_YOUTUBE ?? "https://youtube.com/@defensavenezuela",
} as const;

export const urlWhatsApp = (texto: string) =>
  `https://wa.me/${SITIO.whatsapp}?text=${encodeURIComponent(texto)}`;
