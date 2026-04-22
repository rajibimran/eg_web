# Strapi Integration Manual — Unicare Medical Frontend

This guide explains how to connect this React frontend with a **Strapi v4/v5** backend so that every piece of content (text, images, menus, sections) is managed from the Strapi admin panel.

**Related:** [LOVABLE_BUILD_GUIDELINE.md](./LOVABLE_BUILD_GUIDELINE.md) — multi-brand repos, golden template, what not to break in `api.ts` / RichText / populate, and PR checklist for design-only changes.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Strapi Project Setup](#3-strapi-project-setup)
4. [Content Types to Create](#4-content-types-to-create)
5. [Field Mapping Reference](#5-field-mapping-reference)
6. [Connecting Frontend to Strapi](#6-connecting-frontend-to-strapi)
7. [How the API Layer Works](#7-how-the-api-layer-works)
8. [Image Handling](#8-image-handling)
9. [API Permissions Setup](#9-api-permissions-setup)
10. [Deployment Guide](#10-deployment-guide)
11. [Content Types — Detailed Schema](#11-content-types--detailed-schema)
12. [Troubleshooting](#12-troubleshooting)
13. [Backend bootstrap and seeding](#13-backend-bootstrap-and-seeding)
14. [Greenfield rebuild (clone frontend + Strapi in `backend/`)](#14-greenfield-rebuild-clone-frontend--strapi-in-backend)
15. [SEO component (`seo.entry`) and frontend head tags](#15-seo-component-seoentry-and-frontend-head-tags)

---

## 1. Architecture Overview

```
┌──────────────────┐        REST API         ┌──────────────────┐
│                  │  ◄───────────────────►  │                  │
│   React Frontend │     /api/services       │  Strapi Backend  │
│   (Vite + React) │     /api/news-posts     │  (Node.js)       │
│                  │     /api/site-config     │                  │
└──────────────────┘                         └──────────────────┘
        │                                            │
        │  Falls back to mock data                   │  PostgreSQL / SQLite
        │  when Strapi is unavailable                │  + Media uploads
        └────────────────────────────────────────────┘
```

**Key design principle:** Every component accepts data via props with mock defaults. The API layer (`src/lib/api.ts`) fetches from Strapi and falls back to mock data if Strapi is unavailable. This means:
- The site works standalone with mock data (no Strapi needed)
- Once you connect Strapi, content is served from the CMS
- Zero frontend code changes needed — just set the environment variable

---

## 2. Prerequisites

- **Node.js** ≥ 20 (this repo’s `backend` uses Strapi 5.42.x)
- **Strapi** v5.x recommended (`npx create-strapi-app@latest`); frontend `api.ts` still tolerates some v4-style payloads
- **PostgreSQL** (recommended for production) or SQLite (for development)
- A server/VPS to host Strapi (DigitalOcean, Railway, Render, etc.)

---

## 3. Strapi Project Setup

### 3.1 Create Strapi Project

```bash
npx create-strapi-app@latest unicare-cms --quickstart
# or for PostgreSQL:
npx create-strapi-app@latest unicare-cms --dbclient=postgres
```

### 3.2 Start Strapi

```bash
cd unicare-cms
npm run develop
```

Strapi admin will be at `http://localhost:1337/admin`. Create your admin account on first visit.

### 3.3 Plugins

- **Upload:** Strapi ships with the Upload plugin; use the **Media Library** for all images, icons, and videos referenced by this frontend (see §8).
- **SEO:** This project uses a **custom component** `seo.entry` (`backend/src/components/seo/entry.json`), not `@strapi/plugin-seo`. The React app reads those fields and renders `<title>`, meta tags, Open Graph / Twitter, and JSON-LD via `react-helmet-async` (see §15).

---

## 4. Content Types to Create

Create each of these in **Strapi Admin → Content-Type Builder**. The frontend API layer (`src/lib/api.ts`) maps to these exact API identifiers.

| # | Content Type | API ID (singular) | Type | Frontend API |
|---|---|---|---|---|
| 1 | Site Config | `site-config` | Single Type | `api.siteConfig.get()` |
| 2 | Navigation Item | `navigation` | Collection | `api.navigation.getAll()` |
| 3 | Service | `service` | Collection | `api.services.getAll()` |
| 4 | News Post | `news-post` | Collection | `api.news.getAll()` |
| 5 | Blog Article | `article` | Collection | `api.blog.getAll()` |
| 6 | Country Guideline | `country-guideline` | Collection | `api.countryGuidelines.getAll()` |
| 7 | Country flag | `country-flag` | Collection | `api.countryFlags.getAll()` |
| 7b | Region highlights section | `region-highlights-section` | Single Type | `api.regionHighlightsSection.get()` |
| 8 | Equipment Item | `equipment-item` | Collection | `api.equipment.getAll()` |
| 9 | Fitness Criteria | `fitness-criteria` | Collection | `api.fitnessCriteria.getAll()` |
| 10 | Stat | `stat` | Collection | `api.stats.getAll()` |
| 11 | Testimonial | `testimonial` | Collection | `api.testimonials.getAll()` |
| 12 | Service Package | `service-package` | Collection | `api.servicePackages.getAll()` |
| 13 | FAQ | `faq` | Collection | `api.faqs.getAll()` |
| 14 | Certification | `certification` | Collection | `api.certifications.getAll()` |
| 15 | Footer Quick Link | `footer-quick-link` | Collection | `api.footer.getQuickLinks()` |
| 16 | Footer Service Link | `footer-service-link` | Collection | `api.footer.getServiceLinks()` |
| 17 | Gallery Image | `gallery-image` | Collection | `api.gallery.getAll()` |
| 18 | Hero Section | `hero` | Collection | `api.hero.getByPage()` |
| 19 | About Page | `about-page` | Single Type | `api.about.get()` |
| 20 | Fitness Page | `fitness-page` | Single Type | `api.fitnessPage.get()` |
| 21 | Report Page | `report-page` | Single Type | `api.reportPage.get()` |
| 22 | Services Page | `services-page` | Single Type | `api.servicesPage.get()` |
| 23 | Booking Page | `booking-page` | Single Type | `api.bookingPage.get()` |
| 24 | Screening Process Page | `screening-process-page` | Single Type | *(hero + page single)* |
| 25 | Privacy Page | `privacy-page` | Single Type | `api.privacyPage.get()` |
| 26 | Appointment booking | `booking-request` | Collection | `api.bookingRequests.*` — submit + availability |
| 27 | Lab report PDF | `lab-report-file` | Collection | Patient/staff flows via `/api/lab-report-files/*` |
| 28 | Post Category | `post-category` | Collection | Blog/news taxonomy |
| 29 | Author | `author` | Collection | Optional byline |
| 30 | Service Category | `service-category` | Collection | Service listing tabs |
| 31 | Comment | `comment` | Collection | `/api/comments/*` |
| 32 | Contact submission | `contact-submission` | Collection | `/api/contact-submissions/submit` |

### 4.1 This monorepo (`uniweb`)

The Strapi app for this frontend lives in **`backend/`** inside the **uniweb** monorepo and is also published as **[uniadmin](https://github.com/rajibimran/uniadmin)** for deployment. You do **not** need to recreate types by hand unless you are starting from scratch elsewhere:

- **Content-types:** `backend/src/api/<api-name>/content-types/<singular-name>/schema.json`
- **Components:** `backend/src/components/<category>/*.json`
- **Public API access** and **optional seed data** run automatically on startup (see [§13](#13-backend-bootstrap-and-seeding)).

---

## 5. Field Mapping Reference

### What can be changed from Strapi

| Content Area | What You Can Change | Strapi Content Type |
|---|---|---|
| **Header** | Logo, menu items, menu order, dropdown items | Site Config + Navigation |
| **Hero Sections** | Title (H1), subtitle, slider images, optional **promo video (Media)**, CTA buttons | Hero |
| **Services Section** | Service titles, descriptions, icons, images, detail pages | Service |
| **Country flags** | Country names, flag images (Media), display order | Country flag |
| **Country Guidelines** | Tab content, **flag (Media)**, processing time, tips, visa text | Country Guideline |
| **Stats** | Numbers, labels, suffixes | Stat |
| **Service Packages** | Package names, features, pricing | Service Package |
| **Certifications** | Certification names + optional logo images (Media) | Certification |
| **News & Blog** | All posts, categories, dates, images, content | News Post / Article |
| **Equipment** | Equipment names, models, quantities, images | Equipment Item |
| **Fitness Criteria** | Category names, descriptions, item lists | Fitness Criterion collection |
| **Fitness page copy** | Disclaimer / notes below the criteria list + SEO | **Single:** Fitness Page |
| **FAQs** | Questions and answers | FAQ |
| **Footer** | Dynamic columns (`footerColumns` + link components), legacy quick/service columns, cert strip title, privacy label, copyright extras, help blurb | **Site Config** + **Footer Quick/Service Link** collections + **Certification** |
| **Booking** | Slot availability + confirmation email toggles | **Booking Page** single + **Site Config** (`bookingFormToEmail`, `bookingFormSendConfirmation`) + **Appointment booking** collection |
| **Report portal** | Sample copy + support phone; real PDFs | **Report Page** single + **Lab report PDF** collection (disk-backed) |
| **Staff uploads** | Lab PDF bulk upload (passport + phone) | Strapi **Users & Permissions** role **`lab-staff`** + `/api/lab-report-files/*` (see maintenance map) |
| **About Page** | Mission text, center description, values, gallery | About Page |
| **Contact Info** | Phone, email, address, working hours, map URL | Site Config |
| **Social Links** | Facebook, Instagram, LinkedIn URLs | Site Config |
| **SEO / JSON-LD / social previews** | Global defaults + per-page meta, OG image (Media), canonical, robots, schema.org JSON | Site Config `defaultSeo` + `seo.entry` on Hero, Service, Article, News Post, About Page, Fitness Page, Report Page, etc. |

---

## 6. Connecting Frontend to Strapi

### 6.1 Set Environment Variable

Create a `.env` file in the **frontend** project root (Vite). Strapi’s backend `.env` does **not** read `VITE_*` or `VITE_MOCK_DATA` — mock/demo toggles apply only to the React SPA build.

```env
VITE_STRAPI_URL=http://localhost:1337
VITE_STRAPI_API_KEY=your_strapi_api_token_here
# Optional (default Yes): Yes/true/1 = allow bundled mock fallbacks; No/false/0 = Strapi-only (empty when CMS is blank or API fails).
VITE_MOCK_DATA=Yes

# Lab staff upload (/staff/lab-reports): no extra VITE_* keys — staff sign in against Strapi (role lab-staff).
```

For production:
```env
VITE_STRAPI_URL=https://your-strapi-domain.com
VITE_STRAPI_API_KEY=your_production_readonly_token
VITE_MOCK_DATA=No
```

### 6.2 That's It!

The frontend automatically detects `VITE_STRAPI_URL` and (optionally) `VITE_STRAPI_API_KEY`.
- All API calls go to Strapi first
- If `VITE_STRAPI_API_KEY` is set, requests include `Authorization: Bearer <token>`
- When `VITE_MOCK_DATA` is **Yes** (default), the app falls back to bundled mock data if Strapi is not configured, a request fails, or a collection is empty in Strapi
- When `VITE_MOCK_DATA` is **No**, those cases yield empty sections and empty fields instead of mock content (so blank CMS entries are not replaced with demo copy)
- No code changes needed

### 6.3 Verify Connection

Open browser console. You should see API calls to your Strapi instance. If Strapi is down and mock mode is on, you may see:
```
[api] Strapi unavailable, using mock data for services
```
With `VITE_MOCK_DATA=No`, failed requests log a different message and return empty shapes instead of mock rows.

Quick API-key verification (PowerShell):

```powershell
$headers = @{ Authorization = "Bearer $env:VITE_STRAPI_API_KEY" }
Invoke-RestMethod "http://localhost:1337/api/heroes?filters[page][$eq]=home&populate=*" -Headers $headers
```

If you use Postman/Insomnia, send:
- Header: `Authorization: Bearer <your-token>`
- URL: `http://localhost:1337/api/services?populate=*`

---

## 7. How the API Layer Works

### File: `src/lib/api.ts`

The core function is `strapiGet<T>(endpoint, fallback)`:

```typescript
async function strapiGet<T>(endpoint: string, fallback: T): Promise<T> {
  if (!STRAPI_BASE_URL) return fallback;  // No Strapi URL = use mock data

  try {
    const res = await fetch(`${STRAPI_BASE_URL}/api/${endpoint}`);
    if (!res.ok) throw new Error(`Strapi ${res.status}`);
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn(`[api] Strapi unavailable, using mock data`);
    return fallback;  // Graceful fallback
  }
}
```

### Data Flow

```
Component renders
  → Calls api.services.getAll()
    → strapiGet("services?populate=*", mockServices)
      → If VITE_STRAPI_URL is set → fetch from Strapi
      → If not set or Strapi is down → return mock data
```

### Strapi v5 responses, media, and populate compatibility

`src/lib/api.ts` **flattens** v4-style `{ attributes }` and v5 flat documents, resolves **media** to absolute URLs when `VITE_STRAPI_URL` is set, and uses **`populate=*`** for core endpoints so relations/components load correctly in Strapi v5. Certifications return **`{ name, logoUrl }`** objects (not a bare string array) when Strapi is configured.

Important compatibility note:
- In this project, we intentionally moved away from nested v4-style query strings like `populate[seo][populate][openGraphImage]=*` for core frontend requests.
- With Strapi v5, those nested populate params caused **400 ValidationError** responses in runtime for several endpoints (`heroes`, `services`, `site-config`, `certifications`), which made the UI fall back to mock/default text.
- Current frontend constants in `src/lib/api.ts` (`SITE_CONFIG_POPULATE`, `HERO_POPULATE`, `SERVICE_POPULATE`, `ARTICLE_POPULATE`, `NEWS_POST_POPULATE`, `ABOUT_POPULATE`) use `populate=*` to avoid that failure mode.

### Document head (SEO)

`src/components/seo/SeoHelmet.tsx` (with **`react-helmet-async`** and `HelmetProvider` in `src/main.tsx`) merges **Site Config → `defaultSeo`** with optional per-page layers (e.g. Hero `seo`, Service `seo`, About `seo`). It outputs canonical URL, robots, Open Graph / Twitter tags, and a **`application/ld+json`** script when `structuredData` is set in Strapi.

### Adapting Strapi Response Format (legacy v4-only)

Strapi v4 wraps data in `{ data: { id, attributes: {...} } }`. You may need a transform layer. Add this to `api.ts` if your Strapi response structure differs:

```typescript
function transformStrapiData<T>(data: any): T {
  if (Array.isArray(data)) {
    return data.map(item => ({
      id: item.id,
      ...item.attributes,
      // Handle nested media
      image: item.attributes?.image?.data?.attributes?.url
        ? `${STRAPI_BASE_URL}${item.attributes.image.data.attributes.url}`
        : item.attributes?.image,
    })) as T;
  }
  return { id: data.id, ...data.attributes } as T;
}
```

---

## 8. Image Handling

### Strapi Media Library

Strapi stores uploaded images and returns relative URLs like `/uploads/image_abc123.jpg`. By default, **Strapi does not resize or heavily compress** what editors upload.

**Admin field labels:** In this project, each media field’s **label** in the Content Manager includes a suggested size (for example **Logo (50x65px)** or **Flag (80x50px)**), and the **description** under the field reminds editors about file weight. Those strings live in each content-type’s `schema.json` under `config.metadatas` → `edit.label` / `edit.description` (Strapi merges them into the default Content Manager metadata). If someone drops in a 8 MB phone photo, the frontend will request that full file—so **page weight and Largest Contentful Paint (LCP)** depend on what you upload.

### Recommended dimensions *and* file weight

Use **both** a sensible pixel size and a **compressed file size**. Targets below are **after** resizing and compression (e.g. Squoosh, TinyPNG, Photoshop “Export for web”, or `sharp` in a build script).

| Usage | Suggested dimensions (max side) | Target file size | Format |
|---|---|---|---|
| Hero slides | 1600 × 900 px | **≤ 250 KB** each | WebP or JPEG ~75–82% quality |
| Service hero / card | 1200 × 675 / 640 × 400 px | **≤ 150–200 KB** hero, **≤ 100 KB** card | WebP or JPEG |
| News / blog featured | 900 × 600 px | **≤ 120 KB** | WebP or JPEG |
| About mission / center | 900 × 600 px | **≤ 150 KB** | WebP or JPEG |
| About value cards / facility gallery | 640 × 400 px | **≤ 80–120 KB** each | WebP or JPEG |
| Testimonial photo | 256–400 px square | **≤ 60–100 KB** | WebP or JPEG |
| Country / region flags | 80–160 px wide | **≤ 30–50 KB** | PNG or WebP (flat graphics) |
| Certification logos | width ~120–200 px | **≤ 40–60 KB** each | SVG (best) or PNG |
| Site logo | ≤ 400 px wide | **≤ 50–80 KB** | SVG or PNG |
| Equipment photos | 800 × 600 px | **≤ 120 KB** | WebP or JPEG |

**Rule of thumb:** if a single image is **over ~300 KB** for a full-width hero or **over ~150 KB** for a card/thumbnail, compress or shrink it before upload. **Avoid** uploading originals straight from a camera (often 3–15 MB each).

### Before you upload

1. **Resize** to roughly the dimensions in the table (do not use 4000 px-wide images for a 160 px flag or a card).
2. **Compress** to hit the target file sizes; prefer **WebP** or optimized **JPEG** for photos.
3. **Fewer giant slides:** each extra hero slide is another large download—keep slides lean.

### Frontend Image URL Resolution

When using Strapi images, prepend the Strapi base URL:

```typescript
// In your transform function or component
const imageUrl = image.startsWith('http')
  ? image  // Already absolute URL
  : `${STRAPI_BASE_URL}${image}`;  // Strapi relative URL
```

This project’s `src/lib/api.ts` already resolves media URLs from the API; the bottleneck is usually **upload size**, not URL wiring.

### Media persistence (production / Docker)

Strapi stores uploads under **`public/uploads/`** on the server. That directory is **gitignored** — **`git pull` does not deploy media**. The **database** (e.g. `./data` in Docker) and **`public/uploads`** must stay in sync; restoring a DB without the matching files produces **404 / broken thumbnails** in Media Library.

**Docker:** Mount a volume or bind-mount **`./public/uploads`** into the container at the app’s `public/uploads` (same path as `WORKDIR` in your `Dockerfile`, often `/opt/app/public/uploads`). Otherwise, **container recreate** after `docker compose build` drops files that are not on a volume.

### Media fields (no URL text — use Media Library)

Editors should **upload** assets in Strapi; do **not** paste external image URLs into text fields for these. The Admin shows suggested sizes in the field label (from `schema.json` → `config.metadatas`).

| Where | Field(s) | Strapi type |
|---|---|---|
| Site Config | `logo` | Media (single); images or files |
| Country Guideline | `flag` | Media (single), images only |
| Country flag | `flag` | Media (single), images only |
| Certification | `logo` | Media (single), images only, optional |
| Gallery Image | `image` | Media (single), images only, required |
| Service | `heroImage`, `cardImage` | Media (single), images |
| Hero | `slides` | Media (multiple), images |
| About Page | `missionImage`, `centerImage` | Media (single), images |
| Component `about.value-item` | `img` | Media (single), images, required |
| Component `about.gallery-item` | `image` | Media (single), images, required |
| News Post / Article | `image` | Media (single), images |
| Testimonial | `photo` | Media (single), images |
| Equipment Item | `image` | Media (single), images |
| Service | `iconImage` | Media (single), images, optional — **preferred** over Lucide `icon` text in the UI |
| Hero | `promoVideo` | Media (single), **videos** only, optional — not a text URL field |
| Component `seo.entry` | `openGraphImage` | Media (single), images — social preview; use with **`openGraphImageAlt`** |

**Removed / avoided in this project:** plain-text **URL** fields for flags or gallery sources (`srcUrl`, `imageUrl` on value cards, etc.) — those were replaced by Media so the site serves files from your Strapi host/CDN. **Hero video** and **service icons** should be uploaded assets, not pasted URLs.

---

## 9. API Permissions Setup

### 9.1 Automatic grants (this backend)

On startup, `backend/src/index.ts` calls **`grantPublicContentApis`** (`backend/src/bootstrap/public-permissions.ts`). It adds **Users & Permissions → Public** actions if they are missing:

- **Single types** — only **`find`**:  
  `api::site-config.site-config`, `api::region-highlights-section.region-highlights-section`, `api::about-page.about-page`, and other `*-page` singles — see `backend/src/bootstrap/public-permissions.ts` for the full list.
- **Collection types** — **`find`** and **`findOne`** for:

| API (REST path uses plural `pluralName`) | Strapi UID (internal) |
|---|---|
| `/api/navigations` | `api::navigation.navigation` |
| `/api/news-posts` | `api::news-post.news-post` |
| `/api/articles` | `api::article.article` |
| `/api/country-guidelines` | `api::country-guideline.country-guideline` |
| `/api/country-flags` | `api::country-flag.country-flag` |
| `/api/products` | `api::product.product` |
| `/api/team-members` | `api::team-member.team-member` |
| `/api/resource-items` | `api::resource-item.resource-item` |
| `/api/locations` | `api::location.location` |
| `/api/equipment-items` | `api::equipment-item.equipment-item` |
| **`/api/fitness-criteria`** | **`api::fitness-criterion.fitness-criterion`** (singular type name; plural **route** is correct) |
| `/api/stats` | `api::stat.stat` |
| `/api/testimonials` | `api::testimonial.testimonial` |
| `/api/service-packages` | `api::service-package.service-package` |
| `/api/faqs` | `api::faq.faq` |
| `/api/certifications` | `api::certification.certification` |
| `/api/footer-quick-links` | `api::footer-quick-link.footer-quick-link` |
| `/api/footer-service-links` | `api::footer-service-link.footer-service-link` |
| `/api/gallery-images` | `api::gallery-image.gallery-image` |
| `/api/heroes` | `api::hero.hero` |
| `/api/services` | `api::service.service` |

So for collections, both **list** and **single-document** reads work for anonymous users, including country guidelines and country flags (the older manual table that omitted `findOne` for some types was wrong for this codebase).

### 9.2 Manual check in Admin (optional)

Strapi Admin → **Settings → Users & Permissions → Roles → Public** — confirm the actions above exist. If you add a **new** API later, either extend `public-permissions.ts` or enable permissions manually.

**Important:** Never enable `create`, `update`, or `delete` for the Public role.

### 9.3 Lab reports & booking (custom routes)

Public SPA flows use dedicated routes (not generic collection `create` for anonymous users where restricted):

| Flow | Method | Path | Notes |
|------|--------|------|--------|
| Report check — download PDF | `POST` | `/api/lab-report-files/download` | Body: patient id + phone; returns PDF when a **Lab report PDF** row matches |
| Staff login | `POST` | `/api/lab-report-files/staff-login` | Application user with **`lab-staff`** role |
| Staff upload | `POST` | `/api/lab-report-files/upload` | `Authorization: Bearer <jwt>`; multipart PDF |
| Booking — slots taken | `GET` | `/api/booking-requests/availability?date=YYYY-MM-DD` | Used by Book Appointment page |
| Booking — submit | `POST` | `/api/booking-requests/submit` | Creates **Appointment booking** row |

Exact permissions are granted in **`backend/src/bootstrap/public-permissions.ts`** and route configs under **`backend/src/api/*/routes/`**.

---

## 10. Deployment Guide

### 10.1 Frontend (Lovable / Vercel / Netlify)

Set the environment variable in your hosting platform:

```
VITE_STRAPI_URL=https://your-strapi-api.com
```

### 10.2 Strapi Backend

**Option A: Railway** (Easiest)
```bash
# Push Strapi to GitHub, connect to Railway
# Set DATABASE_URL and other env vars
```

**Option B: DigitalOcean App Platform**
```bash
# Deploy via GitHub integration
# Use managed PostgreSQL
```

**Option C: VPS (Ubuntu)**
```bash
# Install Node.js, PostgreSQL, Nginx
# Use PM2 for process management
pm2 start npm --name "strapi" -- run start
```

### 10.3 CORS Configuration

This repo uses **`backend/config/middlewares.ts`** (TypeScript). By default it allows:

- `http://localhost:8080` and `http://127.0.0.1:8080` (if your Vite dev server uses another port, add it or use env — see below)
- Any extra origins from **`FRONTEND_URLS`** (comma-separated), e.g.  
  `FRONTEND_URLS=http://localhost:5173,https://myapp.com`

```typescript
// backend/config/middlewares.ts (conceptually; Strapi 5 — no `enabled` key on cors)
{
  name: 'strapi::cors',
  config: {
    origin: ['http://localhost:8080', 'http://localhost:5173', ...extraOriginsFromEnv],
  },
},
```

After changing origins, restart Strapi.

### 10.4 Docker: persist uploads and align data

If you use **Docker Compose**:

- Mount **`./data`** (or your DB files) so Strapi data survives container recreation.
- **Also** mount **`./public/uploads` → `{WORKDIR}/public/uploads`** (e.g. `/opt/app/public/uploads`) so **Media Library files** are not lost on `docker compose build` / new containers.
- Optional mail fallback: **`SMTP_*`** and **`EMAIL_FROM`** in **backend** `.env` when Site config SMTP fields are empty (see **`backend/.env.example`**).

---

## 11. Content Types — Detailed Schema

### 11.1 Site Config (Single Type)

| Field | Type | Notes |
|---|---|---|
| siteName | Short Text | e.g., "Unicare Medical Services" |
| tagline | Short Text | e.g., "GCC Approved Medical Center" |
| logo | Media (Single) | Site logo (Admin label suggests **50×65px**; see §8) |
| phone | Short Text | e.g., "+88 02 48316027" |
| email | Email | e.g., "unicaremedicalbd@gmail.com" |
| address | Long Text | Full address |
| workingHours | Short Text | e.g., "Sat–Thu: 8:00 AM – 8:00 PM" |
| googleMapsEmbed | Long Text | Google Maps iframe embed URL |
| facebookUrl | Short Text | Social media URL |
| instagramUrl | Short Text | Social media URL |
| linkedinUrl | Short Text | Social media URL |
| showBlogSection / showNewsSection / commentsEnabled | Boolean | Toggles blog/news routes and comment blocks |
| contactFormToEmail, contactFormSendConfirmation | Email / Boolean | Contact form staff inbox + visitor confirmation |
| bookingFormToEmail, bookingFormSendConfirmation | Email / Boolean | Booking form staff inbox + visitor confirmation |
| smtpHost, smtpPort, smtpSecure, smtpUsername, smtpPassword, emailFrom | Various | Outbound mail (stripped from public API response); optional **env** fallback |
| footerBrandExtra | Long Text | Extra blurb under logo in footer |
| footerColumns | Repeatable **`site.footer-column`** | Dynamic footer columns (title + **`site.footer-link`** rows) |
| footerCertStripTitle, footerPrivacyLinkLabel, footerCopyrightExtra, footerMapPlaceholderLabel | Short Text | Footer chrome strings |
| footerLegacyQuickTitle, footerLegacyServicesTitle, footerLegacyHelpTitle, footerLegacyHelpBody | Short / Text | Legacy 3-column footer when `footerColumns` is empty |
| quickContactSectionTitle, quickContactSectionBody, quickContactFormHeading, quickContactSuccessHeading, quickContactSuccessBody, quickContactIframeTitle | Short / Text | Home “Get in touch” block copy |
| defaultSeo | Component (single) `seo.entry`, optional | Global SEO defaults merged before page-specific `seo` (see §15) |

### 11.2 Navigation Item

| Field | Type | Notes |
|---|---|---|
| label | Short Text | Display text, e.g., "Services" |
| href | Short Text | URL path, e.g., "/services" |
| order | Number (Integer) | Sort order |
| parent | Relation (Self) | For dropdown children |

### 11.3 Service

| Field | Type | Notes |
|---|---|---|
| title | Short Text | e.g., "Physical Examination" |
| slug | UID (from title) | e.g., "physical-examination" |
| icon | Short Text, optional | Lucide icon key **fallback** if `iconImage` is empty: "Stethoscope", "ScanLine", "TestTubes", "Syringe" |
| iconImage | Media (single), images, optional | **Preferred** listing/detail icon (~64×64px); overrides Lucide when set |
| description | Long Text | Short description for cards |
| category | Enumeration | Examination, Imaging, Laboratory, Preventive |
| heroImage | Media (Single) | Full-width hero for detail page |
| cardImage | Media (Single) | Thumbnail for service cards |
| fullDescription | Rich Text | Detailed description for detail page |
| benefits | Component (Repeatable) `service.simple-line` | One “List item” per bullet; field **Line** = plain text (not JSON). |
| tests | Component (Repeatable) `service.simple-line` | Same as benefits — one entry per test name. |
| pricing | Component (Repeatable) | { item, price, duration } |
| timeline | Component (Repeatable) | { step, title, description } |
| documents | Component (Repeatable) | { name, required } |
| relatedServices | Relation (Service, many) | Related service slugs |
| seo | Component (single) `seo.entry`, optional | Per-service SEO for `/services/:slug` |

**Component `service.simple-line`:** one required field **`text`** (short text). Each repeatable entry is one bullet for **benefits** or **tests** (not JSON).

### 11.4 News Post

Fields are ordered like a **blog-style** entry: body first, then **SEO** (right after **Content** in the admin form), then media and taxonomy.

| Field | Type | Notes |
|---|---|---|
| title | Short Text | Post title |
| slug | UID (from title) | URL-friendly slug |
| excerpt | Long Text | Short summary |
| content | Rich Text | Full article body |
| **seo** | Component (single) `seo.entry`, optional | In Admin this block is labeled **“SEO — search, social & schema (blog-style)”** — meta title/description, canonical, OG image (Media), Twitter card, JSON-LD, `noIndex`, AI/overview snippet. |
| image | Media (Single) | Featured image |
| date | Date | Publication date |
| category | Enumeration | Announcement, Equipment, Regulation, Notice, Guide |

If you do not see the SEO block after pulling schema changes, restart Strapi (`npm run develop`) and hard-refresh the admin. The block is optional: expand/fill it when you want story-specific SEO.

### 11.5 Blog Article

Same structure and field order as **News Post** (including **`seo`** immediately after **content**), with categories:
- Guide, Tips, Education, Technology

In Admin, the SEO block is labeled **“SEO — search, social & schema”**.

### 11.6 Country Guideline

| Field | Type | Notes |
|---|---|---|
| name | Short Text | e.g., "Saudi Arabia" |
| countryId | Short Text | e.g., "ksa" (used for tab switching) |
| flag | Media (Single, images) | Small flag; see §8 for dimensions & file size |
| processingTime | Short Text | e.g., "2 to 4 working days" |
| approvalNote | Short Text | e.g., "100% WAFID Approved" |
| expertTip | Long Text | Expert advice paragraph |
| mandatoryTests | Long Text | Mandatory tests description |
| rejectionCriteria | Long Text | Rejection reasons |
| specialRules | Long Text | Special rules text |
| visaCategories | Long Text | Visa types |

### 11.7 Equipment Item

| Field | Type | Notes |
|---|---|---|
| slNo | Short Text | Serial number |
| name | Short Text | Equipment name |
| model | Short Text | Model number |
| qty | Short Text | Quantity |
| origin | Short Text | Country of origin (optional) |
| status | Short Text | e.g., "OPERATIONAL" (optional) |
| image | Media (Single) | Equipment photo (optional) |

### 11.8 Fitness Criteria

| Field | Type | Notes |
|---|---|---|
| category | Short Text | e.g., "Infectious Diseases — Must Be Negative" |
| description | Long Text | Category description |
| itemLines | Repeatable **`service.simple-line`** | One component entry per bullet (`text` field) |

### 11.8b Fitness Page (Single Type)

| Field | Type | Notes |
|---|---|---|
| entryTitle | Short Text | Label in Strapi admin only |
| disclaimer | Long Text | Shown under the criteria list on `/fitness` |
| seo | Component (single) `seo.entry`, optional | Page SEO |

### 11.9 Stat

| Field | Type | Notes |
|---|---|---|
| label | Short Text | e.g., "Accuracy Rate" |
| value | Number | e.g., 100 |
| suffix | Short Text | e.g., "%" |

### 11.10 Testimonial

| Field | Type | Notes |
|---|---|---|
| name | Short Text | Person's name |
| photo | Media (Single) | Profile photo |
| rating | Number (Integer) | 1-5 |
| quote | Long Text | Testimonial text |

### 11.11 Service Package

| Field | Type | Notes |
|---|---|---|
| title | Short Text | Package name |
| description | Long Text | Package description |
| features | JSON | Valid JSON array of strings, e.g. `["Item one","Item two"]` — not a plain numbered list |
| pricing | Short Text | e.g., "Call for Pricing" |

### 11.12 FAQ

| Field | Type | Notes |
|---|---|---|
| question | Short Text | The question |
| answer | Long Text | The answer |
| order | Number | Display order |
| sitePage | Relation → **Hero** | Which page this FAQ belongs to (filter in API by hero `page`, e.g. `services`) |

### 11.13 Hero Section

| Field | Type | Notes |
|---|---|---|
| page | Short Text | Page identifier: "home", "services", "about", etc. |
| title | Short Text | H1 text |
| subtitle | Long Text | Subtitle text |
| slides | Media (Multiple) | Slider images |
| ctaButtons | Component (Repeatable) | { label, href, variant } |
| promoVideo | Media (single), videos, optional | Optional loop/background video — upload only, not a URL string |
| seo | Component (single) `seo.entry`, optional | SEO for that hero’s URL (e.g. home, services listing) |

### 11.14 About Page (Single Type)

| Field | Type | Notes |
|---|---|---|
| missionTitle | Short Text | e.g., "Our Mission" |
| missionText | Rich Text | Mission paragraph |
| missionImage | Media (Single) | Image for mission section |
| centerTitle | Short Text | e.g., "Our Center" |
| centerText | Rich Text | Center description |
| centerImage | Media (Single) | Image for center section |
| valuesSectionTitle | Short Text | Optional; section heading for value cards |
| values | Component (Repeatable) `about.value-item` | **title**, **desc**, **alt**, **img** (Media, required) — no URL text field |
| facilityGalleryTitle | Short Text | Optional |
| facilityGallerySubtitle | Long Text | Optional |
| gallery | Component (Repeatable) `about.gallery-item` | **image** (Media, required), **alt** — not a string `src` URL |
| seo | Component (single) `seo.entry`, optional | About page SEO; merged after hero `seo` in the frontend when both exist |

### 11.15 Certification

| Field | Type | Notes |
|---|---|---|
| name | Short Text | e.g., "GAMCA" (shown if no logo) |
| logo | Media (Single), images, optional | Badge image; frontend uses `api.certifications.getAll()` → `{ name, logoUrl }[]` |
| order | Number | Sort order |

### 11.16 Gallery Image (home gallery section)

| Field | Type | Notes |
|---|---|---|
| image | Media (Single), images, required | Facility photo |
| alt | Short Text | Required |
| order | Number | Sort order |

*Legacy `srcUrl` was removed — use Media only.*

### Report Page, appointment bookings, and lab PDFs

**Report Page (single):** `samplePatientName`, `sampleReportDate`, `sampleStatus` (demo copy), `supportPhone`, optional `seo` — used by **`/reports`** together with Hero `page=reports`.

**Appointment booking (collection):** created only via **`POST /api/booking-requests/submit`** — `patientName`, `email`, `phone`, `serviceId`, optional `serviceTitle`, `appointmentDate`, `timeSlot`, `status` (pending / confirmed / cancelled / rescheduled), optional `staffNotes`. Slot collisions use **`GET /api/booking-requests/availability?date=YYYY-MM-DD`**.

**Lab report PDF (collection):** metadata for the patient portal; PDF bytes live under **`private/lab-reports/`** on the server (not Strapi Media Library). **`POST /api/lab-report-files/download`** (public) returns a file when **passportNumber** + **phone** match a row. Staff bulk upload: **`lab-staff`** Users & Permissions role → **`POST /api/lab-report-files/staff-login`** then **`POST /api/lab-report-files/upload`** with JWT.

### 11.17 Component `seo.entry` (shared)

Single-use SEO block used on **Site Config** (`defaultSeo`), **Hero**, **Service**, **Article**, **News Post**, **About Page**, **Fitness Page**, **Report Page**, and other singles that expose `seo`.

| Field | Type | Notes |
|---|---|---|
| metaTitle | String, required in component | Browser title / `og:title` when this component is the winning layer |
| metaDescription | Text, required in component | Meta + OG + Twitter description |
| metaKeywords | String, optional | Meta keywords |
| canonicalPath | String, optional | Full `https://…` URL or site-relative path; if empty, the app uses the current route path |
| openGraphImage | **Media** (single), images | `og:image` / `twitter:image` — **not** a text URL field |
| openGraphImageAlt | String, optional | Accessibility + image SEO; describe the OG image |
| twitterCard | Enumeration | `summary` or `summary_large_image` (default) |
| structuredData | **JSON** | Valid JSON-LD (`@context`, `@type`, …); rendered as `<script type="application/ld+json">` |
| noIndex | Boolean | When true: `noindex, nofollow` |
| snippetForAiOverview | Text, optional | **AIO / answer-engine style** copy: short neutral summary for AI Overviews–style answers or featured-snippet style notes. Stored in Strapi and merged in `PageSeo`; **`SeoHelmet` does not emit a separate `<meta>` for it today** — use **`structuredData`** (JSON-LD) for machine-readable extras, or extend `SeoHelmet` if you need it in the HTML head. |

When a content type’s `seo` (or `defaultSeo`) is **left empty**, the frontend uses **fallback titles** from each page. When editors **add** the component, Strapi requires **metaTitle** and **metaDescription** on that component instance.

---

## 12. Troubleshooting

### Common Issues

| Problem | Solution |
|---|---|
| CORS errors | Add frontend URL to Strapi's CORS config (Section 10.3) |
| Media Library previews broken / `/uploads/...` 404 | **Files missing** under `public/uploads` (DB–disk mismatch) or Docker **without** a `public/uploads` volume — restore files + persist volume (§8, §10.4) |
| Images not loading | Prepend `STRAPI_BASE_URL` to relative image paths |
| Data structure mismatch | Add transform function (Section 7) to map Strapi attributes |
| 403 Forbidden | Confirm bootstrap ran (Section 9) or enable `find`/`findOne` manually for Public |
| `fitness-criteria` / plural errors | Content-type UID is **`fitness-criterion`**; REST path stays **`/api/fitness-criteria`** |
| Empty data returned | Check if content is published (not draft) in Strapi admin |
| Nested data not populated | Use `?populate=deep` or `?populate=*` in API queries |
| Strapi endpoints return 400 after schema/SEO updates | For Strapi v5, avoid legacy nested populate query syntax in frontend API calls; use `populate=*` for core endpoints (Section 7) |
| `<title>` / OG tags not updating | Ensure **`HelmetProvider`** wraps the app (`src/main.tsx`) and the route renders **`SeoHelmet`**; check Strapi **`seo`** / **`defaultSeo`** populate includes **`openGraphImage`** (see `HERO_POPULATE` / `SITE_CONFIG_POPULATE` in `api.ts`) |
| AIO field not in page source | **`snippetForAiOverview`** is stored and mapped in **`PageSeo`** but not emitted as its own meta tag by **`SeoHelmet`** yet — use **`structuredData`** or extend the component (§15) |

### Testing Your Setup

1. Start Strapi: `npm run develop`
2. Add some test content via admin panel
3. Test API directly: `http://localhost:1337/api/services?populate=*`
4. Set `VITE_STRAPI_URL=http://localhost:1337` in frontend `.env`
5. Start frontend: `npm run dev`
6. Check browser console for API calls

### Strapi v5 Notes

This project targets **Strapi v5** (`backend` package). Responses are often **flat** (`{ data: [{ documentId, title, ... }] }`), but `api.ts` still **normalizes** older `{ attributes }` shapes and **populates** media so one codebase works across versions.

---

## Quick Start Checklist

- [ ] Install and start Strapi (`backend/`: `npm run develop`)
- [ ] Schemas are already in this repo (`backend/src/api`); only create types manually if you cloned without them
- [ ] On first boot, bootstrap grants **Public** permissions (Section 9) — verify in Admin if needed
- [ ] Optional: run phased seeding (Section 13) or add content via Admin
- [ ] Set `VITE_STRAPI_URL` in the frontend `.env`
- [ ] Set `FRONTEND_URLS` (and/or adjust `middlewares.ts`) so CORS matches your dev port (Section 10.3)
- [ ] Docker/production: persist **`public/uploads`** (and database) — Section 10.4
- [ ] Optional: fill **Site Config → defaultSeo** and per-page **`seo.entry`** in Strapi for production SEO (Section 15)
- [ ] Test APIs, e.g. `http://localhost:1337/api/services?populate=*`
- [ ] Deploy Strapi and update `VITE_STRAPI_URL` for production

---

## 13. Backend bootstrap and seeding

### Public permissions

File: **`backend/src/bootstrap/public-permissions.ts`**, invoked from **`backend/src/index.ts`** → `bootstrap`.  
Ensures the **Public** role can read the APIs the React app calls (see Section 9).

### Phased content seed (`SEED_PHASE`)

File: **`backend/src/bootstrap/phased-content-seed.ts`**. Seeds demo content (including **Media Library** uploads from URLs where applicable). Control with environment variable **`SEED_PHASE`** before `npm run develop`:

| Phase | Typical contents |
|---|---|
| `layout` (default if unset) | Site config + logo, navigation, footer links, certifications |
| `home` | Stats, country flags, region highlights section, testimonials, packages, gallery, FAQs, country guidelines, home hero |
| `services` | Four services (with images), services hero, related services (best-effort) |
| `about` | About page + mission/center media + about hero |
| `contact` | Contact hero |
| `fitness` | Fitness criteria groups |
| `equipment` | Equipment items |
| `news` | News posts |
| `blog` | Blog articles |
| `all` | Runs the phases above in order |

**PowerShell examples**

```powershell
cd backend
$env:SEED_PHASE="layout"; npm run develop
# After checking Admin/API, stop and run e.g.:
$env:SEED_PHASE="home"; npm run develop
$env:SEED_PHASE="all"; npm run develop
```

Clear the variable when you want the default again: `Remove-Item Env:SEED_PHASE`.

**Note:** If you change field types (e.g. JSON → components, text → media), old DB rows may need to be re-saved or re-seeded.

---

## 14. Greenfield rebuild (clone frontend + Strapi in `backend/`)

Use this sequence when you **re-clone only the frontend** from git and need a **working Strapi + API** setup that matches this codebase.

1. **Frontend** — Clone the repo, `cd frontend`, `npm ci`, create `.env` with `VITE_STRAPI_URL=http://localhost:1337` (or production URL), `npm run dev`.
2. **Backend** — Either:
   - **Recommended:** use this monorepo’s **`backend/`** from the same git source (schemas, bootstrap, seeds live in `backend/src/api`, `backend/src/components`, `backend/src/bootstrap`, `backend/config`), **or**
   - Create a new Strapi app under `backend/` and **copy** those folders plus `package.json` / lockfile aligned to the same Strapi major version as this project.
3. **Environment** — Configure Strapi `.env` (database, `APP_KEYS`, `JWT_SECRET`, admin secrets) per [Strapi docs](https://docs.strapi.io).
4. **Install & run** — `cd backend`, `npm ci`, `npm run develop`. Content types register from `schema.json`; you should **not** recreate types manually if the files are present.
5. **Permissions** — On boot, `backend/src/index.ts` runs **`grantPublicContentApis`** (see §9). Confirm **Public** has `find` / `findOne` as expected.
6. **CORS** — Set **`FRONTEND_URLS`** (comma-separated) in Strapi env and/or edit `backend/config/middlewares.ts` so your Vite dev origin (e.g. `http://localhost:5173`) is allowed.
7. **Content** — Publish **Site Config** and **About Page** single types; publish collection entries. Prefer **Media uploads** for every image, **iconImage**, **promoVideo**, featured images, flags, logos, and **`seo.entry.openGraphImage`** — avoid storing asset URLs in plain text fields for those roles.
8. **Optional seed** — Use **`SEED_PHASE`** (§13) to populate demo content and some media-from-URL helpers where the seed supports it.
9. **Verify** — Hit `GET /api/site-config`, `/api/services`, `/api/heroes?filters[page][$eq]=home&populate=deep` (or the populate strings the frontend uses — see `src/lib/api.ts`) and load the site with the browser network tab open.

---

## 15. SEO component (`seo.entry`) and frontend head tags

### Strapi

- Component file: **`backend/src/components/seo/entry.json`**.
- Attach **`seo`** (single, non-repeatable) or **`defaultSeo`** on **Site Config** as documented in §11.1 and §11.17.
- **Mandatory editorial practice:** for each important public URL, fill at least **meta title** and **meta description**; add **OG image + alt** for social sharing; add valid **JSON-LD** for rich results where applicable; set **canonical** if duplicates exist; use **noIndex** on thank-you pages or internal tools.

### Schema.org (structured data)

- Put one or more JSON-LD objects (or an array) in **`structuredData`**. Examples editors and devs often use: **`MedicalClinic`**, **`LocalBusiness`**, **`WebPage`**, **`Article`**, **`NewsArticle`**, **`FAQPage`** — always valid JSON with `@context` / `@type` as required by [schema.org](https://schema.org).
- The frontend prints it verbatim as **`<script type="application/ld+json">`** (no extra wrapping). Invalid JSON will omit the script if stringification fails.

### AIO / answer-engine copy

- Field **`snippetForAiOverview`** (see §11.17) is the dedicated **AIO-style** editorial field: a concise, factual summary suitable for AI-style answers or internal briefing.
- It is **available on `PageSeo` in `api.ts`** when Strapi returns it, but **`SeoHelmet` currently does not add a dedicated HTML `<meta>` for it**. Prefer including the same facts in **`metaDescription`** and/or **`structuredData`** so crawlers and rich results see them; or extend `SeoHelmet` to surface this field if your SEO strategy requires a specific tag.

### Frontend

- **`react-helmet-async`** — `HelmetProvider` wraps the app in `src/main.tsx`.
- **`SeoHelmet`** — `src/components/seo/SeoHelmet.tsx`. It:
  - **Merge order:** builds `[defaultSeo, ...layers]` when **`useSiteDefault`** is true (default). **Later layers override** earlier ones for title, description, keywords, canonical path, OG image/alt, Twitter card, and JSON-LD; **`noIndex` is true if any layer sets it** (or use **`forceNoIndex`** below).
  - **`useSiteDefault={false}`** — used on the **404** page so global `defaultSeo` does not override the error title.
  - **`forceNoIndex`** — forces **`noindex, nofollow`** regardless of Strapi (e.g. **`NotFound`**, **booking success** on Book Appointment).
  - Renders `<title>`, `meta[name=description]`, `meta[name=keywords]`, `link[rel=canonical]`, `meta[name=robots]`, Open Graph and Twitter tags, and **`script[type=application/ld+json]`** when `structuredData` is present.
- **`ServiceMark`** — `src/components/service/ServiceMark.tsx` renders **`iconImage`** (Media URL from API) when set, otherwise the Lucide icon from the **`icon`** string.

**Where `SeoHelmet` is used (non-exhaustive):** home (`HeroSection`), Services listing, Service detail, About (hero + about `seo` layers), News, Blog, Contact, Equipment, Fitness, Privacy, Book (incl. success state), Report check, Screening process, 404.

Pages that only use static heroes (e.g. Book, Reports, Process, Privacy) still get **`SeoHelmet`** with sensible **fallback** titles/descriptions until you add matching **Hero** entries with `seo` in Strapi.

---

## Support

For Strapi documentation: https://docs.strapi.io
For frontend code structure, see `src/lib/api.ts`, `src/components/seo/SeoHelmet.tsx`, and `src/data/mockData.ts`.
