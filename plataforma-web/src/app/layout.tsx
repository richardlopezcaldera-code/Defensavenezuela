import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PERFILES_PUBLICOS, SITIO } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO.url),
  title: {
    default: `${SITIO.nombre} | Apostillas, poderes e inversión — ${SITIO.abogado}`,
    template: `%s | ${SITIO.nombre}`,
  },
  description: SITIO.descripcion,
  keywords: [
    "apostilla venezolana",
    "poder desde el exterior Venezuela",
    "abogado venezolano en Chile",
    "residencia Chile venezolanos",
    "constituir empresa en Chile",
    "inversión extranjera Venezuela",
    "partida de nacimiento venezolana apostillada",
    "antecedentes penales venezolanos Chile",
  ],
  authors: [{ name: SITIO.abogado }],
  alternates: {
    canonical: "/",
    languages: { "es-CL": "/", "en-US": "/?lang=en", "pt-BR": "/?lang=pt" },
  },
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: SITIO.url,
    siteName: SITIO.nombre,
    title: `${SITIO.nombre} — Gestión legal en Venezuela, sin fronteras`,
    description: SITIO.descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITIO.nombre} — Gestión legal en Venezuela, sin fronteras`,
    description: SITIO.descripcion,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

const datosEstructurados = {
  "@context": "https://schema.org",
  "@type": "LegalService",
  name: SITIO.nombre,
  legalName: SITIO.estudio,
  description: SITIO.descripcion,
  url: SITIO.url,
  email: SITIO.email,
  telephone: `+${SITIO.whatsapp}`,
  areaServed: [
    { "@type": "Country", name: "Chile" },
    { "@type": "Country", name: "Venezuela" },
  ],
  availableLanguage: ["es", "en", "pt"],
  founder: { "@type": "Person", name: SITIO.abogado, jobTitle: "Abogado" },
  sameAs: PERFILES_PUBLICOS,
  knowsAbout: [
    "Apostilla de La Haya",
    "Poderes otorgados en el exterior",
    "Derecho migratorio chileno",
    "Inversión extranjera en Venezuela",
    "Constitución de sociedades",
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datosEstructurados) }}
        />
        {children}
      </body>
    </html>
  );
}
