What you get
Clear ownership: each brand has its own Git history, deploy pipeline, and access.
Simple Lovable/Cursor: one project = one repo; no path confusion.
Aligned with separate Strapi per company: company-a-frontend ↔ company-a-strapi (or whatever you name them).
Standard layout per repo
Each company repo is one Vite/React app (your Lovable export + Cursor Strapi work), with:

src/lib/api.ts (or equivalent) + env via VITE_STRAPI_URL / VITE_STRAPI_API_KEY
STRAPI_INTEGRATION_MANUAL.md + pointer from README.md
.env.example (no real secrets)
Same API contract everywhere; only content in Strapi and UI in that repo differ.

How to spin repo #2–#6 without redoing integration
Create a “golden template” once: the repo after Cursor has finished Strapi wiring, mocks, SEO, etc. Tag it e.g. template-v1.
For each new company: GitHub “Use this template” or duplicate repo, then rename (unicare-web → acme-recruitment-web).
In the new repo: change branding-only concerns (favicon, title defaults, theme tokens if split per app). Point .env to that company’s Strapi URL and read-only token.
Lovable: create/connect project → import from that GitHub repo (or push template first, then open in Lovable). First prompt: “Keep api.ts and data flow; only change layout/components/theme per brief.”
Git flow (recommended)
Source of truth: GitHub main after Cursor merges integration.
Lovable: if it pushes branches, merge via PR so Strapi layer isn’t accidentally regressed.
Tag releases (v1.0.0 when a site goes live) for rollback and support.
Strapi side (per company)
Deploy one Strapi app + one DB per company.
Same content-type names and endpoints as your universal guide so no frontend fork per industry unless you add optional modules.
Keeping all 6 repos from drifting
When you fix the API layer or a bug in one repo, cherry-ppick or patch the same files into others, or later extract @your-org/strapi-client to a small shared package and bump versions across repos.
Maintain a short CHANGELOG.md in the template (“template v1.1: fix populate X”) and repeat when you update clones.
One-line mental model
One repo per company = one product. Same playbook, same Strapi contract, different .env, different design and copy in Strapi—not different integration philosophy per repo.

If you want a next step, describe whether new sites are mostly new skin or new routes/sections; that decides if the template should emphasize theme-only changes vs optional route modules in each repo.

---

**Expanded playbook** (technical guardrails from integration: RichText, Strapi v5 populate, mocks, PR checklist): [LOVABLE_BUILD_GUIDELINE.md](./LOVABLE_BUILD_GUIDELINE.md)


Here is the flow in order, with which doc to use where. The same content is now in LOVABLE_BUILD_GUIDELINE.md under “Step-by-step playbook” so you can send that file (or the whole repo) as the single source of truth.

1. Send this frontend to GitHub (reference / template)
Create a GitHub repo and push the frontend (with api.ts, mocks, docs).
Keep .env out of git; keep .env.example.
Tag when stable (e.g. template-v1).
Optional: mark the repo as a GitHub template for “Use this template”.
2. Connect Lovable
In Lovable: Import from GitHub → pick that repo (one project = one repo).
Documents for Lovable (priority order):
LOVABLE_BUILD_GUIDELINE.md — what it may change (mostly UI) and what it must not break (api.ts, data flow, RichText, media helpers).
STRAPI_INTEGRATION_MANUAL.md — contract: content types, /api/... paths, populate—so new sections still match your Strapi shape.
massmodel.md — short multi-repo reminder.
Paste the “First prompt for Lovable” from the guideline into Lovable’s project instructions or first chat.
3. New company → new Git repos
Frontend: “Use this template” (or duplicate) → e.g. acme-frontend. Branding-only tweaks; same integration philosophy.
Backend: New Strapi + DB for that company (e.g. acme-strapi repo or separate deploy). Recreate the same content types / API shape as in STRAPI_INTEGRATION_MANUAL.md. Set public permissions and CORS (prod URL + local Vite port).
4. Prepare Cursor (company-specific)
Clone acme-frontend and open that folder in Cursor (one window per frontend repo is clearest).
For work sessions, use LOVABLE_BUILD_GUIDELINE.md + STRAPI_INTEGRATION_MANUAL.md; treat src/lib/api.ts as the integration source of truth.
Edit that company’s Strapi in a second Cursor window or workspace if you keep backend code locally.
5. API URL + key + test against real content
Run/deploy that company’s Strapi; note the API base URL.

Strapi Admin → API Tokens → read-only token for the frontend.

In the frontend: .env from .env.example:

VITE_STRAPI_URL=...
VITE_STRAPI_API_KEY=...

Restart npm run dev, check Network for /api/..., fix CORS or populate if needed (manual + api.ts).

Quick “who reads what”

Role	Doc
Lovable
LOVABLE_BUILD_GUIDELINE.md
Strapi schema / same structure for all sites
STRAPI_INTEGRATION_MANUAL.md (+ universal Strapi guide if you have it)
Cursor
Both + api.ts
README.md now points at the guideline and mentions this end-to-end playbook.