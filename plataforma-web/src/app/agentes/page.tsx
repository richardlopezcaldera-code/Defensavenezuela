import type { Metadata } from "next";
import { listarAgentes } from "@/lib/agentes";
import CentroAgentes from "@/components/CentroAgentes";

// El catálogo se relee cada 5 minutos: editar un agente en la base
// se refleja en el sitio sin volver a desplegar.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Centro de Agentes IA",
  description:
    "Agentes jurídicos especializados en derecho venezolano y chileno: general, due diligence, tributario, bienes raíces y migración.",
  alternates: { canonical: "/agentes" },
};

export default async function PaginaAgentes({
  searchParams,
}: {
  searchParams: Promise<{ agente?: string; pais?: string }>;
}) {
  const [agentes, params] = await Promise.all([listarAgentes(), searchParams]);

  return (
    <CentroAgentes
      agentes={agentes}
      slugInicial={params.agente}
      paisInicial={params.pais?.toUpperCase()}
    />
  );
}
