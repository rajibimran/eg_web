# Frontend ↔ Strapi maintenance map (uniweb)

This document tells **editors and site owners** which **Strapi Content Manager** area to open when changing a visible part of this **React app**. Developers and AI assistants should pair this with **`universal_strapi_guide.md`** (API fields, REST paths, and integration rules).

**Strapi Admin:** Content Manager → filter by **Collection** or **Single** type name below. Always **Save** and **Publish** (draft content is hidden on the public site when `draftAndPublish` is on).

**Backend repo:** Production Strapi is deployed as **uniadmin** (`https://github.com/rajibimran/uniadmin.git`). The SPA is **uniweb** (`https://github.com/rajibimran/uniweb.git`).

**Frontend env only (Vite React app, not Strapi):** `VITE_MOCK_DATA=Yes` (default) allows bundled demo data in the SPA when Strapi is missing or a section is empty; set **`VITE_MOCK_DATA=No`** so only published Strapi content appears (blank CMS fields stay blank). Strapi’s own `.env` does not define this. See **`frontend/.env.example`** — lab staff sign-in uses Strapi **Users & Permissions** (no extra `VITE_*` secrets for uploads).

---

## Global layout (every page)

| What the visitor sees | Where in Strapi | API / notes |
|----------------------|-----------------|-------------|
| Logo, site name, tagline, phone, email, address, hours, map embed, social links; **show/hide Blog & News** (`showBlogSection`, `showNewsSection`); **global comments** (`commentsEnabled`); **contact / booking mail** — staff inboxes (`contactFormToEmail`, `bookingFormToEmail`), confirmation toggles, **SMTP** (host, port, secure, username, password, From) — passwords are **not** returned by the public API; optional **`SMTP_*` / `EMAIL_FROM`** on the **server** apply when Site config mail fields are empty | **Single:** Site Config | `GET /api/site-config` |
| **Footer** — dynamic columns (**`footerColumns`**: title + links via **`site.footer-column`** / **`site.footer-link`**), certification strip title, privacy link label, copyright extra, map placeholder; **legacy** 3-column mode titles/help text (`footerLegacyQuickTitle`, `footerLegacyServicesTitle`, `footerLegacyHelpTitle`, `footerLegacyHelpBody`) when `footerColumns` is empty; brand blurb (`footerBrandExtra`); **certification logos** row still uses **Collection: Certification** | **Single:** Site Config + **Collection:** Certification | Site config + `GET /api/certifications` |
| **Home “Get in touch”** block headings / success copy | **Single:** Site Config | `quickContactSectionTitle`, `quickContactSectionBody`, `quickContactFormHeading`, `quickContactSuccessHeading`, `quickContactSuccessBody`, `quickContactIframeTitle` |
| Main menu (and nested items if used) | **Collection:** Navigation | `GET /api/navigations` — order via `order`; parent/child for dropdowns |
| Footer “quick” column links (legacy layout) | **Collection:** Footer Quick Link | `GET /api/footer-quick-links` |
| Footer “services” column links (legacy layout) | **Collection:** Footer Service Link | `GET /api/footer-service-links` |

*Loaded once in **`StrapiLayoutContext`** — not per-page.*

**Staff links in the header** (`/staff/lab-reports`, `/staff/login`) are **fixed routes** in the React app, not Strapi Navigation entries.

---

## Staff — lab report PDF upload (not a CMS page)

| What | Where | Notes |
|------|--------|--------|
| Bulk upload PDFs tied to passport + phone | **Frontend:** `/staff/login` → `/staff/lab-reports` | Staff authenticate as a Strapi **application user** with role **`lab-staff`** (Users & Permissions). JWT is stored in the browser; uploads go to **`POST /api/lab-report-files/upload`**. |
| Admin / auditing | **Strapi:** Collection **Lab report PDF** | Rows hold metadata; binary files live under **`private/lab-reports/`** on the server (persist that directory in Docker — see **`STRAPI_INTEGRATION_MANUAL.md`** §10). |

Editors do not “design” this screen in Content Manager; they manage **users/roles** and **Lab report PDF** entries if needed.

---

## Home page (`/` → `pages/Index.tsx`)

| Section (UI) | React file | Strapi content |
|--------------|------------|----------------|
| Hero carousel / video / CTAs | `components/home/HeroSection.tsx` | **Collection:** Hero — filter by **`page` = `home`** |
| Services grid | `components/home/ServicesSection.tsx` | **Collection:** Service (all published entries, sorted as API defines) |
| Region banner + country pills/cards | `components/home/RegionHighlightsSection.tsx` | **Single:** Region highlights section (`bannerImage`, `bannerTitle`, `bannerDescription`) **and** **Collection:** Country flag (one entry per country, `order`) |
| Stats, packages, certification strip | `components/home/TrustSection.tsx` | **Collections:** Stat, Service Package, Certification |
| Country guideline cards / tabs | `components/home/CountryGuidelinesSection.tsx` | **Collection:** Country Guideline |
| “Get in touch” contact + map + form | `components/home/QuickContactSection.tsx` | **Single:** Site Config (phone, email, address, hours, map, quick-contact strings). Form → **`POST /api/contact-submissions/submit`** with `formKey` = `home_quick`; rows in **Contact submission** |

---

## Inner pages (route → Strapi)

| Route / page | React file | Primary Strapi types |
|--------------|------------|----------------------|
| Services listing | `pages/Services.tsx` | Hero (`page` = `services`), **Single:** Services Page (comparison table only), **Collection:** Service (each links to a **Service Category**), **Collection:** Service Category (filter tab order), **FAQ** — link each FAQ’s **`sitePage`** to the **published Hero** whose **Page** = `services` (relation picker in Admin); the app uses `filters[sitePage][page][$eq]=services` |
| Service detail | `pages/ServiceDetail.tsx` | **Collection:** Service (match **Slug** in admin to URL segment) |
| About | `pages/About.tsx` | Hero (`about`), **Single:** About Page |
| Blog list | `pages/Blog.tsx` | Hero (`blog`), **Collection:** Article — **Post Category** (`scope: blog`), optional **Author**; **Featured** (`isFeatured`); list **search** is client-side; route hidden if Site Config `showBlogSection` is off |
| Blog post | `pages/BlogPost.tsx` | **Collection:** Article (by **Slug**); optional **Comments** block if Site Config `commentsEnabled` and post `commentsOpen` |
| News list | `pages/News.tsx` | Hero (`news`), **Collection:** News Post — **Post Category** (`scope: news`), optional **Author**; **Featured**; **search**; route hidden if `showNewsSection` is off |
| News post | `pages/NewsPost.tsx` | **Collection:** News Post (by **Slug**); optional **Comments** same rules as blog |
| Post categories (taxonomy) | *(used by blog/news)* | **Collection:** Post Category — set **`scope`** to `blog` or `news` when creating |
| Authors (byline) | *(used by blog/news)* | **Collection:** Author |
| Comment moderation | *(optional)* | **Collection:** Comment — public submits via API; **approve** `isApproved` in admin |
| Contact form messages | *(home + contact pages)* | **Collection:** Contact submission — each row is one send; filter by **`formKey`** (`contact_page` vs `home_quick`). Optional **`isRead`** for triage. Not publicly listable via REST. |
| Book appointment | `pages/BookAppointment.tsx` | Hero (`book`), **Single:** Booking Page (`timeSlotLines`: add one “List item” per slot), **Collection:** Service. **Slots / submissions:** **`GET /api/booking-requests/availability?date=YYYY-MM-DD`**, **`POST /api/booking-requests/submit`** — rows in **Appointment booking** (`booking-request`). |
| Report check | `pages/ReportCheck.tsx` | Hero (`reports`), **Single:** Report Page (`samplePatientName`, `sampleReportDate`, `sampleStatus`, `supportPhone`, `seo`). **PDF download:** public **`POST /api/lab-report-files/download`** with patient id + phone (matches **Lab report PDF** entries). |
| Staff login | `pages/StaffLogin.tsx` | Strapi **Users & Permissions** — **`POST /api/lab-report-files/staff-login`** |
| Staff lab uploads | `pages/LabReportBulkUpload.tsx` | Same; **`POST /api/lab-report-files/upload`** with JWT |
| Screening process | `pages/ScreeningProcess.tsx` | Hero (`process`), **Single:** Screening Process Page |
| Contact | `pages/Contact.tsx` | Hero (`contact`), **Collection:** Service (as used on that page), **Contact submission** (via same submit API with `formKey` = `contact_page`) |
| Fitness criteria | `pages/FitnessPage.tsx` | Hero (`fitness`), **Single:** Fitness Page (`disclaimer`, `seo`), **Collection:** Fitness Criterion |
| Equipment | `pages/EquipmentPage.tsx` | Hero (`equipment`), **Collection:** Equipment Item |
| Privacy policy | `pages/Privacy.tsx` | **Single:** Privacy Page (`sections` = heading + body blocks) |

---

## Hero entries (`page` field)

The **Hero** collection has one document per logical page. In Strapi, open **Hero** and match **`page`** to:

| `page` value | Used on |
|--------------|---------|
| `home` | Home |
| `services` | Services |
| `about` | About |
| `blog` | Blog |
| `news` | News |
| `book` | Book appointment |
| `reports` | Report check |
| `process` | Screening process |
| `contact` | Contact |
| `fitness` | Fitness |
| `equipment` | Equipment |

Each hero supports **Slides** (`slideItems`: image, title, text per slide), **CTA buttons**, optional **promo video**, and **SEO** component.

---

## Optional types (not used by default SPA sections)

These exist in the **uniadmin** Strapi app for reuse on **new** or **client-specific** frontends. Enable sections that call the REST API (or add wrappers in `api.ts`).

| Strapi type | Typical UI |
|-------------|------------|
| Product | Product grid, spec pages, downloads |
| Team Member | Team / leadership grid |
| Resource Item | Guides, PDFs, case studies |
| Location | Branches, map list |

REST: `/api/products`, `/api/team-members`, `/api/resource-items`, `/api/locations` (see `universal_strapi_guide.md` §21).

---

## Production reminders (ops)

- **Media files** (`/uploads/...`) live under **`public/uploads`** on the Strapi host. **`git pull` does not sync them** (folder is gitignored). For Docker, **bind-mount or volume** `./public/uploads` so rebuilds do not wipe uploads; keep **database + uploads** backups together.
- **CORS:** Backend **`FRONTEND_URLS`** (comma-separated) must include the live SPA origin (see **`STRAPI_INTEGRATION_MANUAL.md`** §10.3).

---

## Keeping this map accurate

When you add a **new page** or **section component**:

1. Note the **`api.*` calls** (or `fetch` URLs) in the React file.
2. Add a row under the right route table above.
3. If you introduce a **new Strapi content type**, document it in **`universal_strapi_guide.md`** §21 and in the **uniadmin** repo (`public-permissions.ts`) if it should be public.

---

## Related docs

- **`universal_strapi_guide.md`** — Full contract: fields, endpoints, permissions, pitfalls, roadmap §24.
- **`STRAPI_INTEGRATION_MANUAL.md`** — Integration detail, Docker/media troubleshooting, and tables for this app.
