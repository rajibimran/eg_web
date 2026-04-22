# Lovable + multi-brand build guideline

Use this document at the **start** of every Lovable/Cursor session so design work does not regress the Strapi integration, API contract, or shared patterns established in this repo.

## One-line mental model

**One repo per company = one product.** Same playbook, same Strapi **content-type contract** (endpoint shapes, field names), different `.env`, different design and copy in Strapi—not a different integration philosophy per repo.

- **Backend**: One Strapi instance + one database **per company** (e.g. `company-a-strapi`).
- **Frontend**: Many repos/apps; each talks to **its** Strapi via env. **Only the UI layer and Strapi content differ**; the API surface (types, populate patterns, section wiring) stays aligned with this guide.

---

## Step-by-step playbook (GitHub → Lovable → new company → Cursor → live Strapi)

Follow these phases in order. **Which document to use when** is called out in each phase.

### Phase 1 — Put the reference frontend on GitHub (once per golden template)

1. Create a GitHub repository (e.g. `your-org/web-template` or `unicare-web`).
2. Push this frontend: `main` should contain the integrated app (`api.ts`, mocks, `RichText`, routing, SEO).
3. Add **no secrets**: ensure `.env` is gitignored; keep **`.env.example`** only.
4. When the integration is stable, **tag** the repo (e.g. `git tag template-v1 && git push origin template-v1`).
5. Optional: GitHub repo **Settings → General → Template repository** so new companies use **“Use this template”**.

**Docs on GitHub for humans:** `README.md` should link to this file and `STRAPI_INTEGRATION_MANUAL.md`.

---

### Phase 2 — Connect Lovable to GitHub (reference + future builds)

1. In Lovable: **Create project → Import from GitHub** (authorize the org/repo you pushed).
2. Lovable works on **one repo = one project**—import the **template** repo, not a monorepo root, unless your structure is clearly documented.

**What Lovable should follow (order matters):**

| Priority | Document | Role |
|----------|----------|------|
| **1** | **`LOVABLE_BUILD_GUIDELINE.md`** (this file) | Boundaries: do not break `api.ts`; design-only changes; first prompt; checklist. |
| **2** | **`STRAPI_INTEGRATION_MANUAL.md`** | **Contract reference**: content-type names, REST paths, populate patterns—use so new **sections** match Strapi, not to rewrite integration every time. |
| **3** | **`massmodel.md`** | Short reminder: one frontend repo per company, one Strapi per company. |

**Optional in Lovable:** paste the **First prompt for Lovable** (section below) into project instructions or the first chat so every build starts from the same rules.

**Git discipline:** if Lovable pushes branches, merge via **PR** and review diffs to `src/lib/api.ts`, providers, and env handling.

---

### Phase 3 — New company: new GitHub repos (frontend + backend)

You want **separate** repos (or separate deployables) per company.

**Frontend (new site):**

1. **Use this template** (or duplicate) the golden frontend repo → e.g. `acme-medical-web`.
2. Rename display strings in README; adjust branding-only files (favicon, default title, theme tokens) as needed.
3. Keep **`api.ts` and content-type assumptions** aligned with the template unless you are intentionally versioning the contract (then update `CHANGELOG.md` and `STRAPI_INTEGRATION_MANUAL.md`).

**Backend (that company’s Strapi):**

1. Deploy **one Strapi app + one database** for this company (new hosting stack or new Strapi project folder in a `acme-strapi` repo).
2. Recreate **the same content-type names and API shapes** as in `STRAPI_INTEGRATION_MANUAL.md` / your universal Strapi guide (`universal_strapi_guide.md` if present)—so the **same frontend code** works with different content.
3. **Public permissions**: enable `find` / `findOne` for the content types the site reads.
4. **CORS**: allow the company’s frontend origin (and `http://localhost:5173` or your Vite port for local dev).

---

### Phase 4 — Prepare Cursor for the company-specific frontend

1. **Clone** the new frontend repo locally and **open that folder** in Cursor (recommended: one Cursor window = one frontend repo).
2. Open and pin (or @-mention in chat) **`LOVABLE_BUILD_GUIDELINE.md`** + **`STRAPI_INTEGRATION_MANUAL.md`** when doing integration or new sections.
3. If you also edit Strapi in-repo: open the **backend** folder in a **second** Cursor window or a multi-root workspace—keeps “company A frontend” and “company A Strapi” clear.

**Cursor mental model:** integration and API shape live in **`api.ts`** + the manual; Cursor changes for a new brand are mostly **UI/theme/copy** and **env**, not a second bespoke API layer.

---

### Phase 5 — Point the frontend at this company’s Strapi (API URL + key + test)

1. **Deploy or run** that company’s Strapi and note the public API base (e.g. `https://strapi.acme.com`).
2. In Strapi Admin: **Settings → API Tokens** → create a token with **read-only** scope appropriate for public content (as you prefer for your security model).
3. In the **frontend** repo, copy `.env.example` → `.env` (never commit `.env`):

   ```bash
   VITE_STRAPI_URL=https://your-company-strapi.example.com
   VITE_STRAPI_API_KEY=your-read-only-token
   ```

4. Restart the Vite dev server (`npm run dev`) so env vars reload.
5. **Verify:** browser **Network** tab → calls to `/api/...` succeed; page sections load Strapi content. If CORS fails, fix Strapi CORS for your dev and prod origins. If populate is missing nested media, fix **populate** in `api.ts` (see manual—do not rely on `populate=*` for deep trees).

6. When satisfied, **commit** only code; **never** commit real tokens. Document deploy env vars in your hosting provider for production.

---

### Quick reference: who reads what

| Person / tool | Primary doc |
|---------------|-------------|
| **Lovable** (design / layout) | `LOVABLE_BUILD_GUIDELINE.md` |
| **Strapi admin / schema** | `STRAPI_INTEGRATION_MANUAL.md` + Strapi `universal` guide if present |
| **Cursor** (integration / fixes) | Same two + `api.ts` as source of truth |

## What you get (ownership & clarity)

| Concern | Approach |
|--------|----------|
| Git history / deploy / access | **Per brand**: separate repo, pipeline, permissions. |
| Lovable / Cursor | **One project = one repo**—no ambiguous paths. |
| Strapi | **Aligned naming**: `company-a-frontend` ↔ `company-a-strapi` (or your naming convention). |

## Standard layout per frontend repo

Each company repo is a Vite/React app (Lovable export + Strapi wiring) with:

| Artifact | Purpose |
|----------|---------|
| `src/lib/api.ts` | **Single source** for fetch helpers, mappers, `populate` queries, mock fallbacks. **Do not duplicate fetch logic in components.** |
| `.env` / `.env.example` | `VITE_STRAPI_URL`, `VITE_STRAPI_API_KEY` (no real secrets in git). |
| `STRAPI_INTEGRATION_MANUAL.md` | Tables of content types, endpoints, troubleshooting. **README** should point here. |
| `universal_strapi_guide.md` (if present) | Strapi-side schema and plugin notes. |

Same **API contract** everywhere: only Strapi **content** and **UI** in that repo differ.

## First prompt for Lovable (copy-paste)

> **Keep `src/lib/api.ts` and data flow unchanged.** Wire new sections to existing helpers and types. **Only change layout, components, theme, and copy** per the brief. Use `RichText` for any Strapi rich text / multiline field. Do not replace Strapi media objects with plain URL strings—use `getStrapiMediaUrl` / existing media helpers.

## How to spin repo #2–#N without redoing integration

1. **Golden template once**: After Cursor finishes Strapi wiring, mocks, SEO, routing, and RichText—**tag** e.g. `template-v1`.
2. **New company**: GitHub **“Use this template”** or duplicate repo → rename (`unicare-web` → `acme-recruitment-web`).
3. In the new repo: branding-only (favicon, default title, theme tokens). **Point `.env`** to that company’s Strapi URL and read-only API token.
4. **Lovable**: Create project → import from GitHub (or push template first). Use the first prompt above.

## Git flow (recommended)

- **Source of truth**: `main` on GitHub after integration merges.
- **Lovable pushes branches**: merge via **PR** so `api.ts`, providers, and env patterns are not accidentally regressed.
- **Tag releases** (`v1.0.0` when a site goes live) for rollback and support.

## Strapi side (per company)

- Deploy **one Strapi app + one DB** per company.
- Keep **content-type names and REST shapes** aligned with `STRAPI_INTEGRATION_MANUAL.md` so frontends do not fork by industry unless you add optional modules.
- **Public API**: enable `find` / `findOne` for the needed types; configure **CORS** for the frontend origin.

## Keeping N repos from drifting

- When you fix the API layer or a bug in one repo, **cherry-pick** or patch the same files into others, or later extract `@your-org/strapi-client` and bump versions.
- Maintain a short **`CHANGELOG.md`** in the template (e.g. “template v1.1: fix populate for about-page”) and repeat when you update clones.

---

## Technical rules (from recent integration work—do not regress)

### 1. API contract and section wiring

- **Scan** `api.ts` for existing functions (`getHomePage`, `getAboutPage`, `getNewsPosts`, etc.) and **reuse** them; add new getters only when a new content type or query is required.
- **Strapi v5 `populate`**: avoid relying on `populate=*` for deep components and nested media—it often **omits** nested data. Use **explicit** `populate` for pages with dynamic zones, components, and `image`/`seo` (see `STRAPI_INTEGRATION_MANUAL.md` and existing `api.ts` calls).
- **Single-type page data**: some sections use dedicated single types (e.g. services listing page, booking page). Prefer **page-level** fetches that match Strapi’s structure rather than overloading the home single type.

### 2. Rich text and multiline fields

- Strapi **Blocks** and long text must be normalized for React. Use **`richtextToPlainString`** (or equivalent) from `api.ts` where mapping, and render with **`RichText`** (`src/components/content/RichText.tsx`).
- **Do not** render long markdown-ish content as a single `<p>` without `RichText`—headings, lists, and line breaks will look wrong.
- Rich rendering uses `react-markdown` + `remark-gfm` + `remark-breaks` so editor line breaks and markdown features behave predictably.

### 3. Media and SEO

- **Images**: Strapi returns nested `data.attributes.url` objects—not always plain strings. Use **`getStrapiMediaUrl`** and existing patterns; do not store raw URL strings in content types unless that is the agreed contract.
- **SEO**: use the shared **SeoHelmet** (or equivalent) with mapped title/description/OG image from Strapi.

### 4. Routing and UX

- **Scroll to top** on route change is handled in the app router setup—preserve it when adding layouts.
- **News / blog**: prefer **`/news/:slug`** and **`/blog/:slug`** for single posts; list pages aggregate from Strapi collections.

### 5. Mocks

- When Strapi is unavailable, **`api.ts`** mock data should keep **section structure** aligned with real responses so UI does not branch on different shapes.

---

## Reference docs in this repo

| Doc | Use when |
|-----|----------|
| `STRAPI_INTEGRATION_MANUAL.md` | Content types, endpoints, populate examples, troubleshooting |
| `universal_strapi_guide.md` | Strapi project setup and plugins (if present) |
| `massmodel.md` | Short architecture summary (multi-repo mental model) |

---

## Checklist before merging a Lovable “design-only” PR

- [ ] No accidental rewrites of `api.ts` contract without review (or version bump in CHANGELOG).
- [ ] New copy fields from Strapi use **RichText** where appropriate.
- [ ] New pages use **explicit populate** if they include components/media.
- [ ] `.env.example` still lists required vars; no secrets committed.
- [ ] README still points to `STRAPI_INTEGRATION_MANUAL.md` and this guideline.
