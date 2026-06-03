# eg_web — Brand B SPA (separate frontend)

This folder is a **copy of** `../um_web` with a **reduced route set** and **neutral shell defaults**. It uses the **same Strapi REST API** as the uniweb stack (see `universal_strapi_guide.md` and `docs/FRONTEND_STRAPI_MAINTENANCE_MAP.md` in this folder — some rows describe routes **not mounted** in this app).

## Intended deployment

- **Strapi:** `../eg_admin` on its **own subdomain** and **own database** (e.g. `cms.brandb.example.com`).
- **This SPA:** public site domain (e.g. `www.brandb.example.com`).
- **Git:** initialize a **separate repository** from this directory when ready; do not commit `.env`.

## Routes enabled here

| Path | Page |
|------|------|
| `/` | Home |
| `/services`, `/services/:slug` | Services |
| `/about` | About |
| `/book` | Book appointment |
| `/reports` | Report check (lab PDF portal API) |
| `/process` | Screening process |
| `/fitness` | Fitness criteria |
| `/equipment` | Equipment |
| `/contact` | Contact |
| `/privacy` | Privacy |

**Not mounted (API may still exist on Strapi):** `/blog`, `/news`, `/staff/login`, `/staff/lab-reports`.

Use **Site Config** in Strapi (`showBlogSection`, `showNewsSection`) so navigation from CMS does not point at removed routes, or edit **Navigation** entries accordingly.

## Environment

Copy `.env.example` → `.env` and set:

- `VITE_STRAPI_URL` — your **eg_admin** public URL (HTTPS in production).
- `VITE_STRAPI_API_KEY` — read-only API token as needed.
- `VITE_MOCK_DATA` — `No` in production.

## Local preview (with `eg_admin` on the same machine)

| App | URL | Default port |
|-----|-----|--------------|
| **eg_web** (Vite) | [http://localhost:5180/](http://localhost:5180/) | `5180` (set in `vite.config.ts`) |
| **eg_admin** (Strapi) | [http://localhost:1338/](http://localhost:1338/) API · [http://localhost:1338/admin](http://localhost:1338/admin) panel | `1338` (`eg_admin/.env` → `PORT`) |

Use `eg_web/.env` → `VITE_STRAPI_URL=http://127.0.0.1:1338`. First Strapi boot: open `/admin` and create the admin user. `FRONTEND_URLS` in `eg_admin/.env` must include the Vite origin for CORS.

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Visual rebrand

Replace theme tokens (`src/index.css`), typography, and components incrementally. **SEO** should come from Strapi (`defaultSeo`, `seo.entry`); `index.html` carries only minimal placeholders.

## Related

- Backend twin: **`../eg_admin`**
- Upstream reference implementation: **`../um_web`** + **`../um_admin`** (Unicare Medical — do not modify those for brand B work).
