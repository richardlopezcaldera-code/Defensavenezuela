# DefensaVenezuela — Plataforma web

Sitio y captación de clientes del estudio del **Abg. Richard López Caldera**.
Atiende a la diáspora venezolana e inversionistas entre Venezuela y Chile.

Next.js 16 · React 19 · Tailwind 4 · Supabase · Gemini

---

## Arquitectura

```
src/
  app/
    page.tsx              Server component. Lee el catálogo de servicios de Supabase
    layout.tsx            SEO, Open Graph y JSON-LD (schema LegalService)
    sitemap.ts robots.ts
    api/
      leads/route.ts      Guarda el lead en la base y devuelve el enlace de WhatsApp
      ia/chat/route.ts    Asistente Gemini del lado servidor, con registro de consultas
  components/
    Landing.tsx           Nav, hero, servicios, CTA de inversión, footer
    AsistenteModal.tsx    Chat IA + formulario de contacto + generador de requisitos
    Redes.tsx             Iconos de marca (lucide v1 ya no los trae)
  lib/
    config.ts             Datos del estudio, WhatsApp y redes
    gemini.ts             Llamada a Gemini con reintentos y timeout
    seguridad.ts          Rate limit, honeypot, saneamiento, hash de IP
    i18n.ts               Textos es / en / pt
    tipos.ts
    supabase/
      admin.ts            service_role — SOLO servidor, salta el RLS
      publico.ts          Clave publicable — solo lee servicios activos
```

**Regla de oro:** `admin.ts` jamás debe importarse desde un componente cliente.
Esa clave da acceso total a la base.

---

## Base de datos

Supabase, proyecto `htjjxqvzxkrabozopxhe`, esquema **`defensa`**
(aislado del CRM comercial que vive en `public`).

| Tabla | Contenido |
|---|---|
| `servicios` | Catálogo editable sin tocar código |
| `leads` | Contactos con UTM, origen, estado y score |
| `clientes` | Ficha del cliente convertido |
| `expedientes` | Trámites con código `DV-2026-1000`, estado y honorarios |
| `expediente_eventos` | Bitácora del caso |
| `documentos` | Control de recaudos |
| `consultas_ia` | Registro del asistente, con latencia y tokens |
| `contenido_social` | Calendario editorial de redes |
| `checklist_plantillas` · `checklist_items` | Plantillas reutilizables (due diligence) |
| `expediente_checklist` | La plantilla aplicada a un expediente |
| `suscriptores` · `staff` | Base de correo y control de acceso |

**RLS activo en todas.** Por defecto nadie lee nada: solo staff autenticado y
activo. La única lectura pública es el catálogo de servicios.

Para editar un servicio no hace falta desplegar: se cambia en la tabla y la web
se actualiza sola en 5 minutos (`revalidate = 300` en `page.tsx`).

---

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar las claves secretas
npm run dev
```

### Variables de entorno

| Variable | Obligatoria | Para qué |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | sí | Guardar leads y consultas. **Secreta** |
| `GEMINI_API_KEY` | sí | Asistente IA. **Secreta** |
| `NEXT_PUBLIC_SUPABASE_URL` | no | Tiene valor por defecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | no | Publicable por diseño |
| `NEXT_PUBLIC_SITE_URL` | sí en producción | URLs canónicas y sitemap |
| `NEXT_PUBLIC_WHATSAPP` | no | Número de contacto |
| `IP_HASH_SALT` | recomendada | Anonimiza las IPs guardadas |

**Degradación controlada:** sin `GEMINI_API_KEY` el asistente responde un mensaje
de respaldo y deriva a WhatsApp. Sin `SUPABASE_SERVICE_ROLE_KEY` el lead no se
guarda pero WhatsApp igual se abre. El sitio nunca se cae del todo.

---

## Despliegue en Vercel

Al conectar el repositorio, el **Root Directory debe ser `plataforma-web`**,
no la raíz. Vercel detecta Next.js solo. Cargar las variables de entorno en
Project Settings → Environment Variables y redesplegar.

---

## Seguridad

- La clave de Gemini vive solo en el servidor, nunca llega al navegador
- Rate limit por IP: 5 leads y 20 consultas IA cada 10 minutos
- Honeypot antispam y consentimiento de datos obligatorio
- Las IPs se guardan como hash, no en claro
- Toda entrada del usuario se valida y sanea antes de tocar la base

## Comandos

```bash
npm run dev     # desarrollo
npm run build   # build de producción
npm run lint    # ESLint
```
