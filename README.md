# Zypher Agency — sitio web

Reconstrucción desde cero de [zypher-agency.onrender.com](https://zypher-agency.onrender.com) con
**Astro 7 + TypeScript strict + Tailwind CSS 4**. Visualmente idéntico al sitio original, con código
mantenible, formularios que funcionan de verdad, headers de seguridad y SEO corregido.

El relevamiento del sitio original (capturas, HTML, metadata, assets y la auditoría con todos los bugs
encontrados) está en [`reference/`](reference/) — empezá por [`reference/AUDIT.md`](reference/AUDIT.md).

---

## Requisitos

- Node.js **22.12+** (probado con 24)
- npm 10+

## Puesta en marcha

```bash
npm ci                 # instala dependencias exactas del lockfile
cp .env.example .env   # completá las variables (ver abajo)
npm run dev            # http://localhost:4321
```

| Script                                        | Qué hace                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                                 | Servidor de desarrollo con recarga en caliente                           |
| `npm run build`                               | `astro check` (tipos) + build de producción en `dist/`                   |
| `npm start` / `npm run preview`               | Sirve el build con `server.mjs` (headers de seguridad + redirects)       |
| `npm run lint`                                | ESLint (TypeScript + Astro)                                              |
| `npm run format` / `format:check`             | Prettier (con orden de clases de Tailwind)                               |
| `node tools/visual-compare.mjs <url> [rutas]` | Compara capturas contra `reference/screenshots` (ver "Fidelidad visual") |
| `node tools/generate-brand-assets.mjs`        | Regenera `public/og-image.jpg` y `public/favicon.ico`                    |

> La CSP no se aplica en `npm run dev` (limitación de Vite). Para probarla: `npm run build && npm start`.
>
> Astro 7 permite un solo `astro dev` por proyecto; para levantar un segundo usá
> `VITE_CACHE_DIR=node_modules/.vite-2 npx astro dev --port 4322 --ignore-lock`.
> En Git Bash (Windows), anteponé `MSYS_NO_PATHCONV=1` al pasar rutas como `/faq` a los scripts de `tools/`.

## Variables de entorno

Todas están documentadas en [`.env.example`](.env.example). Ningún secreto vive en el código: se leen
con `astro:env` y el esquema está declarado en `astro.config.mjs`.

| Variable                                             | Obligatoria       | Uso                                                                                                      |
| ---------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| `SITE_URL`                                           | recomendada       | Origen canónico (canonical, Open Graph, sitemap). Default `https://zypher-agency.online`                 |
| `RESEND_API_KEY`                                     | sí, en producción | Envío de los formularios por email ([Resend](https://resend.com))                                        |
| `CONTACT_TO_EMAIL`                                   | sí, en producción | Bandeja que recibe los leads                                                                             |
| `CONTACT_FROM_EMAIL`                                 | sí, en producción | Remitente verificado en Resend                                                                           |
| `PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | no                | Activa Cloudflare Turnstile en los formularios (si faltan, se usa honeypot + tiempo mínimo + rate limit) |

---

## Estructura

```
├── public/                  Archivos servidos tal cual (fuentes WOFF2, favicon, og-image, frames de la promo)
├── reference/               Relevamiento del sitio original + AUDIT.md (no se despliega)
├── server.mjs               Servidor de producción: headers de seguridad, 301 canónicos, caché
├── render.yaml              Blueprint de Render
├── tools/                   Scripts de mantenimiento (comparación visual, assets de marca)
└── src/
    ├── assets/images/       Imágenes optimizadas por astro:assets (AVIF/WebP + srcset)
    ├── components/
    │   ├── layout/          Header, Footer, Seo, ThemeToggle, PageTransition, AdminPromo
    │   ├── ui/              Piezas genéricas: Icon, Section, SocialLinks
    │   ├── sections/        Secciones compartidas entre páginas: PageHero, CtaBanner, ServicesGrid, PortfolioCarousel
    │   └── <área>/          Componentes propios de cada área (home, services, portfolio, faq, contact, admin, legal)
    ├── content/             CONTENIDO EDITABLE (YAML/JSON) + esquemas por área en content/collections/
    ├── content.config.ts    Registro de colecciones
    ├── data/                Datos globales: site.ts (marca, nav, redes), sitemap.ts, admin/
    ├── icons/               Íconos SVG (se usan con <Icon name="…" />)
    ├── layouts/             BaseLayout (sitio) y AdminLayout (demo admin)
    ├── lib/                 Lógica pura y testeable (validación/sanitizado/rate limit del formulario)
    ├── pages/               Rutas (mismas URLs que el sitio original) + api/ + sitemap.xml + robots.txt
    ├── scripts/             TypeScript de cliente (tema, reveal on scroll, transición de página…)
    └── styles/global.css    Design tokens (colores claro/oscuro, tipografía, animaciones) y base
```

## Cómo editar el contenido

No hace falta tocar componentes para cambiar textos, listados o imágenes:

| Quiero cambiar…                                                                            | Archivo                                                                                                                                                     |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Email, redes, links del nav/footer, nombre de marca                                        | `src/data/site.ts`                                                                                                                                          |
| Título SEO, descripción, hero y CTA final de una página                                    | `src/content/pages/<página>.yaml`                                                                                                                           |
| Políticas legales                                                                          | `src/content/legal/{privacy,terms,cookies}.yaml`                                                                                                            |
| Textos de cada sección (stats, proceso, beneficios, pricing, ROI, "How the studio works"…) | `src/content/sections/<sección>.yaml` (un archivo por bloque; ej. `home-stats.yaml`, `pricing.yaml`)                                                        |
| Servicios (tarjetas + páginas `/services/<slug>`)                                          | `src/content/services/<slug>.yaml` — `order` define el orden                                                                                                |
| Testimonios                                                                                | `src/content/testimonials/<persona>.yaml` (avatar en `src/assets/images/testimonials/`)                                                                     |
| Casos de estudio del portfolio                                                             | `src/content/portfolio/<slug>.yaml` — un archivo nuevo crea la página y la suma al carrusel y al sitemap; textos de la página `/portfolios` en `_page.yaml` |
| Preguntas frecuentes                                                                       | `src/content/faq/faq-page.yaml` (página FAQ) y `contact-quick-answers.yaml` (bloque de /contact)                                                            |
| Textos de los formularios de contacto (pasos, presupuestos, servicios, link de agenda)     | `src/content/contact/contact.yaml`                                                                                                                          |
| Datos de la demo admin                                                                     | `src/data/admin/sample.json` y `config.ts`                                                                                                                  |
| Colores, tipografía, radios, animaciones                                                   | `src/styles/global.css` (tokens en `:root` / `.dark` y `@theme`)                                                                                            |

Las colecciones están tipadas con Zod: si falta un campo o una imagen no existe, `npm run build` falla con
un mensaje claro. Las imágenes se referencian con rutas relativas (`../../assets/images/...`) y Astro las
convierte a AVIF/WebP con `width`/`height` explícitos y `srcset`.

## Formularios de contacto

`POST /api/contact` (ruta on-demand; el resto del sitio es estático):

1. Comprobación de origen (Astro `security.checkOrigin`) y límite de tamaño del cuerpo.
2. Rate limiting por IP (ventana deslizante en memoria).
3. Anti-spam: honeypot + tiempo mínimo de llenado + Cloudflare Turnstile opcional.
4. Validación con Zod por tipo de formulario, recorte de longitud y sanitizado (caracteres de control,
   escape de HTML en el email).
5. Envío por Resend; responde `{ ticket }`. Sin JavaScript, el formulario clásico funciona con un POST
   normal y redirección.

> El rate limit en memoria es correcto para una sola instancia (el plan actual de Render). Si se escala
> a varias instancias, moverlo a Redis/Upstash.

## Seguridad

- **CSP por página** generada por Astro con hashes SHA-256 de cada script (sin `unsafe-inline` en
  `script-src`); se envía como header HTTP. Incluye `frame-ancestors 'none'`, `object-src 'none'`,
  `base-uri 'self'`, `form-action 'self'`. Turnstile se agrega solo si está configurado.
- `server.mjs` agrega `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy` y `Cross-Origin-Opener-Policy` a todas las respuestas.
- Sin dependencias de runtime de terceros en el cliente (ni React, ni GSAP, ni analytics).
- `npm audit`: 0 vulnerabilidades.

## Fidelidad visual

```bash
npm run build && npm start &
node tools/visual-compare.mjs http://localhost:4321            # todas las páginas
node tools/visual-compare.mjs http://localhost:4321 /,/faq     # algunas
```

Genera en `compare/<página>.<viewport>/` la captura nueva, el diff y una vista lado a lado, e imprime el
porcentaje de píxeles distintos contra `reference/screenshots/`.

## Deploy (Render)

El repo incluye [`render.yaml`](render.yaml):

1. En Render: **New → Blueprint** y elegí este repositorio (o un Web Service Node con
   build `npm ci && npm run build` y start `npm start`).
2. Cargá las variables secretas en el dashboard (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
   `CONTACT_FROM_EMAIL` y, si usás Turnstile, sus dos claves).
3. Apuntá el dominio definitivo y poné ese origen en `SITE_URL`.

> ⚠️ El sitio original usa `https://zypher-agency.online` como dominio canónico pero ese dominio
> **no existe** (NXDOMAIN). Registralo y apuntalo a Render, o cambiá `SITE_URL` por el dominio real;
> si no, Google no consolida el posicionamiento en ninguna URL.

Cualquier otro host Node sirve igual (`npm run build && node server.mjs`, respeta `PORT` y `HOST`).

## Pendientes que dependen de vos

Contenido heredado del sitio original que es placeholder o requiere una decisión (ver `reference/AUDIT.md`):

- **Dominio**: definir el dominio real y ponerlo en `SITE_URL` (hoy `zypher-agency.online`, que no existe).
- **Email público**: `hello@zypher.example` (en `src/data/site.ts` y en los textos legales) es un dominio de ejemplo.
- **Link de agenda**: los formularios ofrecen "Book a call" a `cal.com/your-studio/intro` (placeholder, en `src/content/contact/contact.yaml`).
- **Live preview del demo admin**: abre `flux-theme.online` (sitio externo) en una pestaña nueva — decidir si se mantiene.
- **Redes**: los links apuntan a `instagram.com`, `twitter.com` y `behance.net` genéricos, no a perfiles.
- **Videos de portfolio**: siguen alojados en `cdn.dribbble.com` (9–17 MB c/u). Para no depender de Dribbble, subirlos a un storage propio/CDN y actualizar las URLs y `media-src` de la CSP.
- **Accesibilidad opcional**: Lighthouse marca `target-size` en el link "Behance" del footer (queda pegado a la fila de íconos, igual que en el original). Se resuelve separando 8 px esa fila (`pt-2`), lo que cambia levemente el diseño.
