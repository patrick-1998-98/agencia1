# Auditoría del sitio original — zypher-agency.onrender.com

Relevamiento hecho el 2026-11-12 con Playwright (Chromium, `prefers-reduced-motion: reduce`, DPR 1) sobre
`https://zypher-agency.onrender.com`. Todo el material crudo está en esta carpeta:

| Carpeta / archivo | Contenido |
| --- | --- |
| `screenshots/` | Capturas full-page por página: `<slug>.desktop.png` (1440 px) y `<slug>.mobile.png` (390 px) |
| `html/` | HTML renderizado (post-hidratación) de cada página |
| `assets/site/` | Assets propios: fuentes OTF, imágenes, íconos, favicon, bundles JS/CSS originales (solo referencia) |
| `assets/external/` | Imágenes y videos que el sitio carga desde Dribbble y Pinterest (los `.mp4` no se versionan) |
| `data/crawl.json` | Metadata por página: title, metas, links, JSON-LD, headings, formularios, scripts, imágenes, requests |
| `data/outline/*.txt` | Árbol DOM legible (tags, clases, textos) por página |
| `data/css-tokens.txt` | Variables CSS, `@font-face`, keyframes y media queries extraídos del CSS compilado |
| `data/inline-styles.css` | Estilos inline por componente (promo del admin, odómetro) |
| `data/icons.json` | Set de íconos SVG del sitio |

---

## 1. Inventario de páginas

El sitio original es Astro (islas React + GSAP/ScrollTrigger + Lenis + ClientRouter) servido por Render detrás de Cloudflare.

| URL | Title | Indexable | Notas |
| --- | --- | --- | --- |
| `/` | Zypher — Digital Design & Development Agency \| Zypher Agency | sí | Hero, stats (odómetro), servicios, proceso (bento), "How the studio works", carrusel 3D, testimonios (marquee vertical), CTA |
| `/benefits` | Benefits — Why teams choose Zypher \| Zypher Agency | sí | Hero, grilla de 6 beneficios, proceso, "How the studio works", testimonio destacado |
| `/services` | Services — Brand, Web, Product \| Zypher Agency | sí | Hero, servicios, pricing (Sprint/Project/Retainer), comparación ROI, CTA |
| `/services/brand` · `/web` · `/product` | `<Servicio> — Services \| Zypher Agency` | sí | Detalle: deliverables + proceso. OG image = imagen de Pinterest |
| `/portfolios` | Portfolios — Selected work \| Zypher Agency | sí | Hero, marquee de clientes, carrusel 3D, highlight cards, CTA |
| `/portfolios/liquid-brokers` · `logo-revamp` · `alva-commerce` · `axone-studio` | `<Proyecto> — <Subtítulo> — <Cliente> \| Zypher Agency` | sí | Caso de estudio con galería (imágenes + videos de Dribbble) |
| `/faq` | FAQ — Frequently asked questions \| Zypher Agency | sí | Hero, acordeón por categorías, CTA |
| `/contact` | Contact — Start a project with Zypher \| Zypher Agency | sí | Hero, 3 flujos de contacto, info del estudio, FAQ corto, CTA |
| `/privacy` · `/terms` · `/cookies` | `<Política> — Zypher \| Zypher Agency` | sí | Páginas legales (actualizadas 2026-05-09) |
| `/admin` · `/admin/automations` · `/admin/automations/setup` | Tickets · Admin / Request type setup · Admin | **no** (`noindex, nofollow`) | Demo pública de un CRM (kanban) enlazada desde la tarjeta flotante "A CRM built into Zypher". Corre en modo demo: sin backend |

Fuentes de descubrimiento: links del nav y footer, `sitemap.xml` (16 URLs) y la tarjeta promo (`/admin`).
No existe `robots.txt` (404) ni `favicon.ico` (404).

### Redirects / URLs alternativas observadas

| Petición | Respuesta original | Problema |
| --- | --- | --- |
| `/services/` (barra final) | 200 (mismo contenido) | Contenido duplicado |
| `/index.html` | 200 | Contenido duplicado |
| Cualquier otra ruta | 404 con título "Page not found \| Zypher Agency" | — |

No hay redirects 301 configurados. En la reconstrucción se mantienen **todas** las URLs; `/<ruta>/` y `*.html` redirigen con 301 a la URL canónica.

---

## 2. Metadata SEO

Común a todas las páginas indexables:

- `<html lang="en">`, `viewport`, `theme-color #ffffff`
- `description`, `keywords` ("creative agency, photography, branding, design studio, web design, portfolio"), `author` (Zypher Agency)
- `canonical` = `https://zypher-agency.online<path>`
- Open Graph: `og:type=website`, `og:site_name`, `og:url`, `og:title` (= title sin el sufijo), `og:description`, `og:image`, `og:locale=en_US`
- Twitter: `summary_large_image`, `twitter:url/title/description/image`
- `robots` y `googlebot`: `index, follow`
- JSON-LD `Organization` (name, url, logo `favicon.svg`, description de la página, `sameAs` x.com/instagram)
- Íconos: `favicon.svg?v=2` (icon + shortcut icon), `apple-icon.png` 180×180

Valores exactos por página en `data/crawl.json`. Las admin solo tienen `robots: noindex, nofollow` y favicon.

---

## 3. Design tokens

### Color (modo claro / oscuro, toggled con la clase `.dark` en `<html>`, preferencia en `localStorage["zypher-theme"]`)

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `--background` | `#f4f6fb` | `#08090b` | Fondo de página |
| `--foreground` | `#0a0a0a` | `#f4f4f5` | Texto principal, nav, footer, CTA |
| `--card` | `#ffffff` | `#111114` | Tarjetas |
| `--card-foreground` | `#0a0a0a` | `#f4f4f5` | |
| `--muted` | `#f4f4f5` | `#18181b` | Fondos secundarios |
| `--muted-foreground` | `#71717a` | `#a1a1aa` | Texto secundario |
| `--border` | `#e4e4e7` | `#27272a` | Bordes |
| `--accent` | `#18181b` | `#f4f4f5` | |
| `--accent-foreground` | `#fafafa` | `#0a0a0a` | |
| `--hero-bg` | `#b7bdc1` | `#2a2d31` | Fondo del hero mientras carga la imagen |

Además: `::selection` invertido (fondo foreground), gradiente `hero-grain` (dos radiales blancos/durazno), promo del admin con borde cónico plateado. El demo admin usa su propio set de tokens (`--color-text-*`, `--color-background-*`, `--color-status-*`, …) mapeados a los anteriores.

### Tipografía

- Familia: **Neue Haas Grotesk Display Pro** (self-hosted, OTF) con fallback Inter → system-ui. Pesos cargados: 400 (55 Roman), 500 (65 Medium), 700 (75 Bold). Se declara un 200 (35 Extra Light) cuyo archivo nunca se usa.
- Escala (Tailwind v4): xs 12/16, sm 14/20, base 16/24, lg 18/28, xl 20/28, 2xl 24/32, 3xl 30/36, 4xl 36/40, 5xl 48, 6xl 60, 7xl 72 (line-height 1).
- Títulos: `font-medium` + `tracking-tight` (-0.025em); hero `leading-[1.05]`. Eyebrows: `text-xs uppercase tracking-[0.18em]`; labels de stats `tracking-[0.16em]`.
- Wordmark del footer: `text-[16vw]` / `md:text-[13vw]` `font-semibold`.
- Stats: odómetro con `clamp(2.25rem, 4vw, 3.25rem)`.

### Espaciado, radios, sombras

- Escala base Tailwind (`--spacing: .25rem`). Secciones: `px-6 py-20 md:py-28`; contenedores `max-w-5xl` (nav), `max-w-6xl` (secciones), `max-w-7xl` (footer), `max-w-360` (hero, 90rem).
- Radios: `--radius: 1.5rem` (cards `rounded-3xl`), hero/CTA/footer `rounded-[2.5rem]`, chips/botones `rounded-full`, promo `1rem`.
- Sombras: nav `0 8px 30px rgb(0 0 0 / .12)`, menú mobile `0 20px 60px rgb(0 0 0 / .25)`, promo `0 25px 50px -12px rgb(0 0 0 / .35)`, `hover:shadow-md` en el CTA del nav.

### Breakpoints

`sm 40rem (640)`, `md 48rem (768)`, `lg 64rem (1024)`, `xl 80rem (1280)`, `2xl 96rem (1536)` + `@media (hover:hover)` y `prefers-reduced-motion`.

### Animaciones y transiciones

| Elemento | Comportamiento original |
| --- | --- |
| Transición de página | Cortina negra "ZYPHER®" a pantalla completa: sube al cargar (0.85 s, power4.inOut) y baja al navegar (0.6 s); el contenido entra con fade + 24 px |
| Hero | Timeline GSAP: eyebrow → título → descripción → trust → thumbnail (scale .92) → fondo (scale 1.05) |
| Scroll reveal | Bloques suben 32 px + fade al llegar al 85 % del viewport (0.9 s, power3.out), algunos con stagger |
| Stats | Odómetro: cada dígito es una pista vertical que rueda 1.8 s (`cubic-bezier(.16,1,.3,1)`) |
| Proceso | Bento con progreso animado, `process-float` (5 s) y `process-glow` (6 s) |
| "Plugs into your stack" | Órbita de íconos `orbit-spin` 48 s |
| Testimonios | Columnas en marquee vertical (`marquee-y`, 60 s), pausa en hover, fade arriba/abajo |
| Clientes | Marquee horizontal 28 s |
| Carrusel de portfolio | Anillo 3D de tarjetas, arrastrable ("Drag to rotate") |
| Theme toggle | Interpola las variables de color 0.6 s |
| Promo admin | Aparece a 1 s, loop CSS de 7 s (drag & drop simulado), se oculta 7 días al cerrarla |
| Botones | `hover:-translate-y-0.5`, transiciones de color 150 ms |
| Scroll | Lenis (smooth scroll por JS) |

---

## 4. Componentes que se repiten

| Componente | Dónde |
| --- | --- |
| Header (píldora negra sticky, nav, theme toggle, "Get In Touch", menú mobile) | Todas menos admin |
| Footer (email, Studio/Resources/Social, íconos, wordmark ZYPHER®, legales) | Todas menos admin |
| Cortina de transición | Todas menos admin |
| Tarjeta promo del admin | Todas menos admin |
| Hero de página (imagen, grano, esquinas, eyebrow, h1, descripción, trust + redes, thumbnail) | Home (variante sin thumbnail), benefits, services, portfolios, faq, contact |
| Section (pill eyebrow + h2 + lead) | Casi todas las secciones |
| CTA banner (tarjeta negra con dos botones) | Home, services, portfolios, faq, contact |
| Grilla de servicios (3 tarjetas foto con label vertical) | Home, services |
| Proceso (bento) | Home, benefits |
| "How the studio works" (5 features) | Home, benefits |
| Carrusel 3D de portfolio | Home, portfolios |
| Acordeón FAQ | FAQ, contact |
| Botones píldora (primario/secundario), chips, eyebrows | Global |

---

## 5. Funcionalidad dinámica, formularios, scripts e integraciones

| Elemento | Qué hace realmente |
| --- | --- |
| **Formularios de contacto** (`/contact`: planner por pasos, ruteo por servicio, formulario clásico) | **No envían nada.** El hook de envío, sin `endpoint` configurado, espera 600 ms con `setTimeout` y muestra "Sent". Todos los leads se pierden. |
| Demo admin (`/admin*`) | App React (~300 KB) en modo demo: datos locales, `fetch('/api/admin…')` deshabilitado; los endpoints `/api/admin/*` y el EventSource `/api/admin/automations/stream` dan 404 |
| Theme toggle | `localStorage["zypher-theme"]` |
| Promo admin | `localStorage["adminPromo:dismissedAt"]` |
| Bloqueo de clic derecho y teclas | Script inline que cancela `contextmenu`, F12, Ctrl/Cmd+Shift+I/J/C/K, Ctrl/Cmd+U y **Ctrl/Cmd+S** |
| Lenis + GSAP + ScrollTrigger + ClientRouter | Animaciones y navegación SPA |

**Scripts de terceros:** ninguno. No hay analytics, píxeles, chat ni tag managers (aunque las políticas de privacidad/cookies mencionan "analytics"). Recursos externos: imágenes y videos hotlinkeados desde `cdn.dribbble.com` e `i.pinimg.com`.

---

## 6. Bugs y problemas encontrados

### Críticos

1. **Los formularios de contacto son falsos** — muestran "Sent" sin enviar nada (ver §5).
2. **Dominio canónico inexistente** — `canonical`, `og:url`, `twitter:url`, JSON-LD y el sitemap apuntan a `https://zypher-agency.online`, que **no resuelve (NXDOMAIN)**. Google no puede consolidar señales en una URL que no existe. Hay que registrar/apuntar ese dominio a Render o cambiar `SITE_URL` (ver README).
3. **`og:image` roto** — `/og-image.jpg` da 404, así que 9 páginas comparten sin imagen. Además, en 3 casos de estudio el `og:image` es un `.mp4` (las redes no lo aceptan).

### SEO

4. Sin `robots.txt` (404).
5. Contenido duplicado: `/ruta/` e `/index.html` responden 200 sin redirect.
6. Jerarquía de headings: los títulos de columnas del footer son `<h4>` sin h3 previo, el wordmark gigante es un `<h2>` (decorativo), en `/contact` hay un `h2 "Quick answers"` seguido de un `h3 "Quick answers"` duplicado.
7. `favicon.ico` 404 (los navegadores y algunos crawlers lo piden igual).
8. Las imágenes del hero (LCP) usan `loading="lazy"` → peor LCP.

### Performance

9. Imágenes PNG sin optimizar: hero 0.85–1.15 MB cada uno, avatares de testimonios ~600 KB cada uno (11 archivos, ~6.5 MB) para mostrarse a 40 px.
10. Fuentes en OTF (~51 KB c/u) en vez de WOFF2.
11. ~1 MB de JS (React + GSAP + ScrollTrigger + Lenis + ClientRouter + react-aria) para un sitio de contenido.
12. Imágenes y videos hotlinkeados a Dribbble/Pinterest (sin control de caché ni disponibilidad; los videos pesan 9–17 MB).

### Accesibilidad / UX

13. Bloqueo de clic derecho, Ctrl+S, Ctrl+U y atajos de DevTools: no protege nada (el código y los medios siguen siendo descargables) y rompe funciones normales del navegador.
14. Contraste: `--muted-foreground #71717a` sobre `--background #f4f6fb` = 4.47:1 (AA pide 4.5:1) — afecta a casi todos los textos secundarios.
15. `/portfolios` en mobile tiene overflow horizontal (la captura a 390 px sale de 414 px de ancho).
16. La tarjeta promo tapa el texto "Trusted by 60+ product teams" del hero en desktop (se mantiene igual en la reconstrucción por fidelidad; se puede cerrar).
17. Sin link "skip to content".

### Seguridad

18. Sin `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy` ni `Permissions-Policy` (solo HSTS y `nosniff`, puestos por Render/Cloudflare).
19. El demo `/admin` es público por diseño (no expone datos reales: todo es local y la API no existe), pero conviene que no parezca un panel real: queda `noindex` y fuera del sitemap.

### Menores

20. `@font-face` declara un peso 200 cuyo archivo no se usa.
21. Textos legales mencionan `zypher.agency` (otro dominio distinto al canónico) — revisar cuál es el dominio real.
22. `hello@zypher.example` es un dominio reservado de ejemplo: el email del footer/legales no funciona.

---

## 7. Qué cambia en la reconstrucción (sin cambios visuales)

Ver el README para el detalle. Resumen: formularios reales con validación en servidor, honeypot + tiempo mínimo + Turnstile opcional, rate limiting y envío por Resend; CSP por página con hashes + HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy; `robots.txt`, `sitemap.xml` generados, `favicon.ico`, `og-image.jpg` real y OG de casos de estudio con imagen fija; 301 para barra final y `.html`; imágenes vía `astro:assets` (AVIF/WebP, tamaños responsivos), fuentes WOFF2 con preload, cero dependencias JS de runtime de terceros; headings corregidos, skip link, contraste AA, foco visible y alternativas de teclado; eliminación del bloqueo de clic derecho/teclas.
