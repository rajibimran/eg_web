Universal Strapi Backend Guide (v5-first, v4-tolerant)
One backend contract for many frontend designs
Version: 1.2  
Scope: Marketing/corporate/service websites with reusable sections/pages across different frontend designs (Lovable, React, Next, Nuxt, Astro, custom).

**Changelog 1.2 (uniweb reference backend)**  
Neutral region strip: **`country-flag`** (collection) and **`region-highlights-section`** (single) replace legacy GCC-specific API IDs. Optional catalog-style types **`product`**, **`team-member`**, **`resource-item`**, **`location`** ship in `backend/` with draft/publish. See **§21–§24** for field lists, which REST path to call per UI section, and roadmap. **Editors:** use **`docs/FRONTEND_STRAPI_MAINTENANCE_MAP.md`** in the **uniweb** frontend repo for page/section → Strapi screen mapping.
---
1) Goal and philosophy
Build a design-agnostic Strapi backend where:
Content semantics stay stable.
Frontend visual design can change freely.
Most pages/sections are reused across projects.
API contract remains consistent for all frontend consumers.
Core rule
Model meaning, not styling:
Keep titles, summaries, CTAs, media, SEO, schema, relationships.
Do not store CSS classes, spacing, color hex, breakpoints, animation values, or layout-only controls.
---
2) Environment and security contract
Frontend env (mandatory)
Use Vite-safe variables only:
```env
VITE_STRAPI_URL=https://your-strapi-domain.com
VITE_STRAPI_API_KEY=your_readonly_api_token
VITE_MOCK_DATA=Yes
```
Important
`API_KEY` (without `VITE_`) is not available in browser runtime.
Frontend should send API key as:
`Authorization: Bearer <token>`
Token should be read-only and limited scope.
Access model
Public website endpoints:
allow `find`/`findOne` for required public content OR use read-only token.
Never expose admin credentials.
Never allow public `create/update/delete`.
---
3) Strapi version compatibility (critical)
This blueprint is Strapi v5-first with v4 tolerance in frontend normalizers.
Runtime lesson learned
Legacy nested query strings like:
`populate[seo][populate][openGraphImage]=*`
caused 400 ValidationError on Strapi v5 for several endpoints in practice.
Contract recommendation
For core website endpoints, default to:
`?populate=*`
plus `sort` and `filters` as needed.
Only use deep targeted populate trees if explicitly validated in your Strapi v5 instance. Strapi’s REST API supports population, filtering, sorting, and pagination, but explicit compatibility testing is important when using deeper query trees across versions.[web:12][web:26][web:29]
---
4) Recommended content model inventory
4.1 Single types (global)
`site-config`
Purpose: global identity + contact + fallback SEO
Field	Type	Required	Notes
`siteName`	string	yes	Brand/site name
`tagline`	string	yes	Short tagline
`logo`	media (single)	no	Image/file
`phone`	string	yes	Public phone
`email`	email	yes	Public email
`address`	text	yes	Full address
`workingHours`	string	yes	Display format
`googleMapsEmbed`	text	no	Embed URL
`facebookUrl`	string	no	Social
`instagramUrl`	string	no	Social
`linkedinUrl`	string	no	Social
`defaultSeo`	component `seo.entry` (single)	no	Global SEO defaults
`region-highlights-section`
Purpose: optional home (or landing) **banner strip** above a **country-flag** row or similar; frontend should hide the block until image + title + description exist and are published.
Field	Type	Required	Notes
`bannerImage`	media (single, images)	no	Wide banner
`bannerTitle`	string	no	Overlay headline
`bannerDescription`	text	no	Supporting copy
`about-page`
Purpose: reusable About content
Field	Type	Required	Notes
`missionTitle`	string	yes	
`missionText`	text/richtext	yes	
`missionImage`	media (single,image)	no	
`centerTitle`	string	yes	
`centerText`	text/richtext	yes	
`centerImage`	media (single,image)	no	
`valuesSectionTitle`	string	no	
`values`	component repeatable `about.value-item`	no	
`facilityGalleryTitle`	string	no	
`facilityGallerySubtitle`	text	no	
`gallery`	component repeatable `about.gallery-item`	no	
`seo`	component `seo.entry` (single)	no	
---
4.2 Collection types (shared, reusable)
`navigation`
`hero`
`service`
`news-post`
`article`
`faq`
`testimonial`
`stat`
`service-package`
`country-guideline`
`country-flag`
`equipment-item`
`fitness-criterion`
`certification`
`gallery-image`
`footer-quick-link`
`footer-service-link`
`country-flag` (optional region / selector strip)
Field	Type	Required	Notes
`name`	string	yes	Display label (e.g. country or region name)
`flag`	media (single, images)	yes	Small flag or badge image
`order`	integer	no	Sort order
Review note
The existing list already covers a strong core for service/corporate websites. However, not all collection types should be treated as universal core types. Some are generic across industries, while others are domain-specific and should be treated as extension modules to avoid polluting the shared base contract.[web:79][web:85]
Recommended universal core collections
These should remain in the standard base contract:
`navigation`
`hero`
`service`
`news-post`
`article`
`faq`
`testimonial`
`stat`
`gallery-image`
`footer-quick-link`
`footer-service-link`
Recommended domain-extension collections
These can remain in the project where needed, but should be classified internally as industry-specific extensions rather than universal minimum types:
`service-package`
`country-guideline`
`country-flag`
`equipment-item`
`fitness-criterion`
`certification`
This avoids duplication and keeps the generic backend clean while still allowing industry-specific growth.[web:47][web:54][web:65]
---
4.2A Corporate / profile extension
Use this extension when the website needs deeper company-profile content beyond the current `about-page` fields, such as chairman messages, vision, mission, values, management messages, and corporate profile material. Corporate websites commonly include this type of structured identity content, but it does not need to become a separate mandatory top-level model for every project.[web:76][web:77][web:79][web:82]
Recommended approach
Prefer expanding `about-page` first before creating a completely separate collection type.
Optional additional fields for `about-page`
Field	Type	Required	Notes
`visionTitle`	string	no	Vision heading
`visionText`	text/richtext	no	Vision statement
`corporateProfileTitle`	string	no	Company profile section title
`corporateProfileText`	text/richtext	no	Company overview
`historyTitle`	string	no	Company history label
`historyText`	text/richtext	no	History overview
`chairmanMessageTitle`	string	no	Section title
`chairmanMessageText`	text/richtext	no	Message body
`chairmanPhoto`	media (single,image)	no	Portrait
`managingDirectorMessageTitle`	string	no	Section title
`managingDirectorMessageText`	text/richtext	no	Message body
`managingDirectorPhoto`	media (single,image)	no	Portrait
`timelineTitle`	string	no	Timeline heading
`timeline`	component repeatable `about.timeline-item`	no	Milestones
`brochureFile`	media (single,file)	no	PDF/company brochure
Optional new helper component
`about.timeline-item` (`year`, `title`, `description`)
Why this extension exists
Vision, mission, management messages, and corporate profile information are standard corporate website sections, but they are best handled as structured company-profile content rather than many isolated standalone collection types.[web:76][web:77][web:79]
---
4.2B Resource center extension
Use this extension if the website includes downloadable resources, brochures, whitepapers, guides, templates, manuals, or content hubs beyond normal blog/news publishing. Resource hubs are common on modern marketing and B2B websites, and they usually need a reusable content type separate from `article` and `news-post`.[web:80][web:89]
Recommended new collection type: `resource-item`
Purpose: reusable content hub / download center item
Field	Type	Required	Notes
`title`	string	yes	Resource title
`slug`	uid	yes	Route-safe slug
`resourceType`	enum	yes	`guide`, `brochure`, `whitepaper`, `case-study`, `template`, `document`, `webinar`, `video`, `download`
`summary`	text	yes	Short summary
`content`	text/richtext	no	Optional landing/detail content
`featuredImage`	media (single,image)	no	Cover image
`downloadFile`	media (single,file)	no	Download asset
`externalUrl`	string	no	External resource URL
`publishDate`	datetime	no	Publish or release date
`categoryLabel`	string	no	Simple grouping
`seo`	component `seo.entry` (single)	no	If detail page is indexed
`isFeatured`	boolean	no	Editorial feature flag
`order`	integer	no	Manual sort
Content separation rule
Keep `article` for blog/editorial/educational posts.
Keep `news-post` for updates, notices, announcements, and company news.
Use `resource-item` for downloadable or library-style content assets.
This reduces duplication while covering a much wider range of content marketing use cases.[web:80][web:83][web:89]
---
4.2C Optional common extensions
These are not mandatory for every project, but they are common enough across business websites that they should be recognized as standard optional extensions rather than ad-hoc one-off additions.
`team-member` (recommended optional)
Use when the website needs a management, leadership, consultant, or team section.
Field	Type	Required	Notes
`name`	string	yes	Person name
`slug`	uid	no	If profile page is used
`designation`	string	yes	Role/title
`bio`	text/richtext	no	Profile content
`photo`	media (single,image)	no	Portrait
`email`	email	no	Optional
`linkedinUrl`	string	no	Optional social
`order`	integer	no	Manual sort
`seo`	component `seo.entry` (single)	no	Only if routed
`location` (recommended optional)
Use when the business has offices, branches, or service coverage areas.
Field	Type	Required	Notes
`name`	string	yes	Location title
`slug`	uid	no	If routed
`address`	text	no	Address
`phone`	string	no	Contact
`email`	email	no	Contact
`googleMapsEmbed`	text	no	Embed or map URL
`workingHours`	string	no	Hours
`heroImage`	media (single,image)	no	Optional visual
`seo`	component `seo.entry` (single)	no	Local SEO support
`order`	integer	no	Manual sort
`product` (industry optional)
Use for manufacturing, industrial, trading, or catalog-heavy businesses where product data should not be forced into `service`.
Field	Type	Required	Notes
`name`	string	yes	Product name
`slug`	uid	yes	Product route
`summary`	text	no	Listing summary
`description`	text/richtext	yes	Full description
`featuredImage`	media (single,image)	no	Main image
`gallery`	media (multiple,image)	no	Additional images
`brochureFile`	media (single,file)	no	Product brochure
`specificationFile`	media (single,file)	no	Technical specification
`categoryLabel`	string	no	Simple grouping
`certifications`	relation / repeatable reference	no	Optional link to certifications
`seo`	component `seo.entry` (single)	no	Routed SEO
`order`	integer	no	Manual sort
---
4.2D Industry module grouping rule
Before adding a new collection type, check whether the concept is truly universal or only relevant to a specific vertical. If it is mostly useful for a single sector, group it as an industry module instead of the universal base.[web:47][web:65][web:70]
Recommended module groups
Medical / clinic module
Examples:
`doctor-profile`
`treatment`
`condition`
`insurance-plan`
`patient-resource`
`appointment-method`
Healthcare websites often need structured treatment, provider, and clinic information beyond normal service pages, especially for patient-facing and local SEO use cases.[web:64][web:70][web:73]
Hospital module
Examples:
`department`
`specialty`
`facility`
`patient-service`
`visitor-info`
`emergency-info`
Recruitment module
Examples:
`job-listing`
`industry-sector`
`candidate-resource`
`employer-service`
`consultant-profile`
Recruitment websites commonly separate employer-focused content, candidate-focused content, consultant profiles, and job listings.[web:65][web:68][web:71]
Travel module
Examples:
`destination`
`tour-package`
`itinerary`
`travel-offer`
`visa-guideline`
`departure-date`
Manufacturing / industrial module
Examples:
`product`
`product-category`
`capability`
`industry-page`
`technical-document`
`facility`
`specification-sheet`
Industrial websites often require product, certification, capability, and technical document structures that are not necessary in the universal base.[web:47][web:49][web:54]
Decision rule
Create a new collection type only if at least one of the following is true:
It needs its own route/detail page.
It needs independent filtering, sorting, or listing.
It has relations to multiple other entities.
It is reused across several pages and does not fit cleanly as a component.
It contains business-specific data that should not pollute the universal core.
If those are not true, prefer a component or standard page field instead.
---
4.3 Components (shared schema contract)
`seo.entry` (mandatory pattern)
Use on all page-like entities:
Field	Type	Required	Notes
`metaTitle`	string	yes	
`metaDescription`	text	yes	
`metaKeywords`	string	no	
`canonicalPath`	string	no	Full URL or relative path
`openGraphImage`	media (single,image)	no	Media only
`openGraphImageAlt`	string	no	
`twitterCard`	enum	no	`summary` / `summary_large_image`
`structuredData`	text (long)	no	JSON-LD: paste valid JSON as plain text (parsed in the app)
`noIndex`	boolean	no	
`snippetForAiOverview`	text	no	AIO/editorial summary
Service helper components
`service.simple-line` with one field: `text` (string)
`service.pricing-row`
`service.timeline-step`
`service.document-item`
Hero helper components
`hero.cta-button` (`label`, `href`, `variant`)
About helper components
`about.value-item` (`title`,`desc`,`alt`,`img` media)
`about.gallery-item` (`image` media, `alt`)
`about.timeline-item` (`year`, `title`, `description`) — optional corporate extension helper
---
5) Editor-friendly input rules (non-technical users)
To keep CMS easy for editors and avoid JSON mistakes:
Prefer repeatable components over JSON fields for lists:
benefits, tests, timeline, pricing, documents, FAQs, etc.
`structuredData` is **plain text** (paste JSON-LD); the app parses it. Prefer frontend-generated JSON-LD from structured fields when you can.
For media:
use Media fields only (images/icons/videos), never URL text fields.
Add admin labels/descriptions in schema metadata:
show target sizes, clear examples, and “one item per entry” guidance.
Keep enums human-readable and limited.
For corporate-profile content, prefer grouped fields/components in `about-page` rather than creating too many isolated content types.
For resource hubs, keep downloads and content-hub items in a separate `resource-item` model instead of mixing them into blog/news.
---
6) Media policy (mandatory)
All visuals must be uploaded and managed via Strapi Media Library:
Icons: media field (`iconImage`) not URL
Hero slides: repeatable component **`hero.slide`** (`image` media required, `title`, `text`, repeatable **`ctaButtons`** using **`hero.cta-button`** so each slide can link to different offers or routes); not a flat multi-media field. Root **`hero.ctaButtons`** remains optional as a legacy fallback when a slide has no CTAs (the SPA merges root CTAs onto slides missing slide-level buttons).
Hero promo video: media single (videos)
OG images: media field in `seo.entry`
Service/about/news/blog/testimonial/equipment/gallery/flags/logos: media fields
Management/chairman/leadership photos: media fields
Brochures/spec files/resource downloads: media file fields
Avoid
string URL fields like `imageUrl`, `srcUrl`, `iconUrl`, `videoUrl` for primary assets.
---
7) Canonical API endpoint contract (v5-safe)
Use these endpoint patterns for frontend consumers:
`GET /api/site-config?populate=*`
`GET /api/about-page?populate=*`
`GET /api/services-page?populate=*`
`GET /api/booking-page?populate=*`
`GET /api/report-page?populate=*`
`GET /api/screening-process-page?populate=*`
`GET /api/privacy-page?populate=sections&populate[seo][populate]=openGraphImage`
`GET /api/navigations?populate=*&sort=order:asc`
`GET /api/heroes?filters[page][$eq]={page}&populate=*`  
For **per-slide images, copy, and slide CTAs**, Strapi v5 often needs explicit nested populate on `slideItems.image` and `slideItems.ctaButtons` (see `frontend/src/lib/api.ts` `HERO_POPULATE` in the uniweb repo); `populate=*` alone may omit nested media.
`GET /api/services?populate=*&sort=order:asc`
`GET /api/services?filters[slug][$eq]={slug}&populate=*`
`GET /api/news-posts?populate=*&sort=date:desc`
`GET /api/articles?populate=*&sort=date:desc`
`GET /api/faqs?populate[sitePage][fields][0]=page&sort=order:asc` (all rows; each FAQ’s **`sitePage`** is a published **Hero**)  
`GET /api/faqs?filters[sitePage][page][$eq]={page}&populate[sitePage][fields][0]=page&sort=order:asc` (per route; **`page`** is the Hero’s `page` field, e.g. `home`, `services`)
`GET /api/testimonials?populate=*&sort=order:asc`
`GET /api/stats?populate=*&sort=order:asc`
`GET /api/service-packages?populate=*&sort=order:asc`
`GET /api/country-guidelines?populate=*`
`GET /api/country-flags?populate=*&sort=order:asc`
`GET /api/region-highlights-section?populate[bannerImage][fields][0]=url&populate[bannerImage][fields][1]=name&populate[bannerImage][fields][2]=alternativeText`
`GET /api/equipment-items?populate=*&sort=order:asc`
`GET /api/fitness-criteria?populate=*&sort=order:asc`
`GET /api/certifications?populate=*&sort=order:asc`
`GET /api/gallery-images?populate=*&sort=order:asc`
`GET /api/footer-quick-links?populate=*&sort=order:asc`
`GET /api/footer-service-links?populate=*&sort=order:asc`  
`POST /api/contact-submissions/submit` — public contact forms (JSON body: `formKey`, `name`, `email`, optional `phone`, optional `serviceInterest`, `message`). Configure staff inbox, confirmation toggle, and **SMTP** in **`site-config`** (Admin); optional **`SMTP_*`** / **`EMAIL_FROM`** env vars apply only when Site config fields are empty.
Optional endpoints if extensions are enabled
`GET /api/resource-items?populate=*&sort=publishDate:desc`
`GET /api/resource-items?filters[slug][$eq]={slug}&populate=*`
`GET /api/team-members?populate=*&sort=order:asc`
`GET /api/locations?populate=*&sort=order:asc`
`GET /api/products?populate=*&sort=order:asc`
`GET /api/products?filters[slug][$eq]={slug}&populate=*`
---
8) SEO / Schema / AIO contract
8.1 SEO
Attach `seo.entry` on:
`site-config.defaultSeo`
`hero.seo`
`service.seo`
`news-post.seo`
`article.seo`
`about-page.seo`
`resource-item.seo` if enabled
`team-member.seo` if profile pages are routed
`location.seo` if location pages are routed
`product.seo` if product pages are routed
8.2 Structured data
Store JSON-LD in `structuredData`.
Frontend should render it inside:
`<script type="application/ld+json">...</script>`
Prefer frontend-generated JSON-LD from structured CMS data for standard page types, and use `structuredData` for overrides or advanced cases.[web:31][web:34]
8.3 AIO field
`snippetForAiOverview` is editorial AI-summary support.
Frontend may map it but not necessarily render a dedicated meta tag by default.
Use concise summaries for services, articles, resources, and corporate sections where AI-ready summaries are useful.[web:31]
8.4 Common schema recommendations
Recommended default schema mapping:
Homepage: `WebSite` + `Organization` or `LocalBusiness`
About page: `AboutPage`
Contact page: `ContactPage`
Article detail: `Article` / `BlogPosting`
News detail: `NewsArticle`
FAQ-heavy page: `FAQPage`
Service detail: `Service`
Location page: `LocalBusiness` or relevant subtype
Medical sites: healthcare-related organization/business schema where appropriate.[web:31][web:64][web:70][web:73]
---
9) Permissions checklist (public website)
For all publicly rendered entities:
enable `find` and `findOne` on collection types.
enable `find` on single types.
Critical examples:
`site-config`, `about-page`
`heroes`, `services`, `articles`, `news-posts`
`navigations`, footer links, certifications
`stats`, `faqs`, `testimonials`
`country-guidelines`, `country-flags`, `region-highlights-section`
`equipment-items`, `fitness-criteria`, `gallery-images`
`resource-items`, `team-members`, `locations`, `products` only if those extensions are enabled
Never enable public mutation actions.
---
10) Seed and publish behavior
If using bootstrap seeds:
Ensure seed scripts are schema-compatible (field type changes can break seed).
Prefer phase-based seed:
`layout`, `home`, `services`, `about`, `contact`, `fitness`, `equipment`, `news`, `blog`, `resources`, `all`.
If content exists but not visible:
verify `published` status and public read permissions.
If endpoint returns empty unexpectedly:
check DB target, seed phase, and publish state.
For modular projects, seed universal content first, then seed industry modules only if the project uses them.
---
11) Frontend integration contract (for any design)
Every frontend should implement:
API normalizer layer:
supports Strapi v4/v5 shapes.
Media URL resolver:
prefix `VITE_STRAPI_URL` for `/uploads/...`.
Safe fetch wrapper with fallback:
no UI crash on CMS outage.
Layout provider for global data:
site config + nav + footer + certifications fetched once.
Page-level fetches:
hero/content by route.
SEO renderer:
title, meta, canonical, robots, OG/Twitter, JSON-LD.
Extension-aware rendering:
render `resource-item`, `team-member`, `location`, `product`, and industry modules only if present in the project.
Legal and multilingual handling where needed:
support canonical, hreflang, and localized legal pages when i18n is enabled.[web:35][web:38][web:41]
---
12) Verification matrix
Test	Expected
`/api/heroes?filters[page][$eq]=home&populate=*`	returns home hero title/subtitle/slides
`/api/services?populate=*`	returns published service list with media fields
`/api/site-config?populate=*`	returns logo/contact/defaultSeo
Change hero title in admin + publish	frontend hero text updates after refresh
Add API key header	endpoint still returns same published data (auth + content aligned)
Remove API key (public mode)	works if Public permissions are configured
SEO JSON-LD in Strapi	appears in rendered page source script tag
`/api/resource-items?populate=*`	returns published resources if extension enabled
Management message/about-page update	updated corporate profile content appears in frontend after publish
Localized policy page update	localized frontend route reflects updated content when i18n enabled
---
13) Multi-frontend reuse strategy
To reuse backend across many frontend designs:
Keep this model stable and semantic.
Add new fields only if they are content-semantic, not style-semantic.
Let each frontend map normalized data to its own components.
Maintain one shared API contract document and changelog.
Version contract changes (e.g. `v1`, `v1.1`) and deprecate safely.
Keep the universal core small and stable; add vertical-specific items as optional modules rather than expanding the base endlessly.[web:47][web:85]
---
14) Known pitfalls and prevention
Strapi v5 400 from nested populate
Use `populate=*` baseline for core endpoints.
Content-type naming collisions on startup
Strapi requires globally unique names for each content type metadata.
`info.singularName` and `info.pluralName` must not duplicate another type.
For single types, keep plural explicitly pluralized:
`about-page` -> `about-pages`
`site-config` -> `site-configs`
Keep `collectionName` unique as well (for example `about_pages`, `site_configs`).
Frontend env not working
Ensure env key starts with `VITE_`.
“Data not updating”
Usually publish state, permissions, or fallback path.
Editors entering JSON accidentally
replace JSON lists with repeatable components.
Media mismatch
enforce media-only policy for icons/images/videos.
Too many business-specific collections in the universal core
group vertical types as optional modules.
Blog/news/resource duplication
keep clear editorial intent: `article` for blog/editorial, `news-post` for updates, `resource-item` for downloadable/library content.[web:80][web:83][web:89]
About content becoming fragmented
expand `about-page` with grouped corporate fields before creating many small standalone corporate types.[web:79][web:82]
---
15) Quick start checklist (new project)
[ ] Create Strapi v5 app
[ ] Add content types/components from this blueprint
[ ] Ensure every schema has unique `singularName`, `pluralName`, and `collectionName`
[ ] Configure media fields for all visuals (no URL text)
[ ] Configure SEO component `seo.entry`
[ ] Decide which optional extensions are needed: `resource-item`, `team-member`, `location`, `product`, industry modules
[ ] Enable i18n only where needed
[ ] Grant public read permissions for required APIs
[ ] Create read-only API token
[ ] Seed or enter baseline content
[ ] Verify key endpoints with `populate=*`
[ ] Connect frontend with `VITE_STRAPI_URL` + `VITE_STRAPI_API_KEY`
[ ] Confirm hero/title/content changes reflect in UI
---
16) Minimal API auth test
```powershell
$headers = @{ Authorization = "Bearer $env:VITE_STRAPI_API_KEY" }
Invoke-RestMethod "http://localhost:1337/api/services?populate=*" -Headers $headers
Invoke-RestMethod "http://localhost:1337/api/heroes?filters[page][$eq]=home&populate=*" -Headers $headers
```
---
17) Final recommendation
Use this blueprint as your universal backend base and keep frontend-specific logic in each frontend repo’s normalization/rendering layer.  
That gives you:
one robust CMS contract,
faster frontend redesign cycles,
lower backend rebuild time,
consistent SEO/schema/media quality across all projects.
The most scalable operating model is:
universal core for common business websites,
corporate/profile extension for richer about/company content,
resource-center extension for downloadable assets and hubs,
industry modules for medical, recruitment, travel, manufacturing, hospital, and other verticals only when actually needed.[web:47][web:65][web:70][web:79]
---
18) Standard pages coverage
This blueprint is intended to cover standard website pages and content patterns without forcing every project into the same frontend design. Common pages and sections can be handled using the existing core model plus the optional extensions listed above.[web:79][web:80][web:85]
Standard pages covered by the core or recommended extensions
Home
About / Corporate profile
Contact
Services index
Service detail
Blog / Articles index
Blog / Article detail
News / Updates index
News / Update detail
FAQ
Gallery
Management / Team
Locations / Branches
Resources / Downloads
Product pages where applicable
Thank-you page
404 page
Legal and trust pages recommended in most projects
Privacy Policy
Cookie Policy
Terms and Conditions
Disclaimer
Accessibility Statement (recommended)
Refund Policy where relevant
Modeling guidance
Do not create separate collection types for every legal page. Prefer normal routed page content unless the legal or compliance workflow clearly requires a dedicated model.[web:35][web:38][web:41]
---
19) Multilingual guidance
If multilingual support is required, enable localization only on content types that actually need translated content. This reduces CMS complexity and keeps editorial operations manageable.[web:35][web:38][web:41]
Recommended i18n targets
`site-config` where site copy differs by language
`about-page`
`hero`
`service`
`article`
`news-post`
`faq`
`resource-item` if enabled
legal pages where multilingual clarity is required
Frontend expectations
locale-aware routing
correct localized canonical URLs
hreflang support
localized policy and cookie pages when needed
consistent default language fallback
---
20) Final implementation prompt for Strapi v5
Use the following prompt with an AI assistant, dev agent, or internal builder if you want to generate or document the full Strapi implementation from this guide.
```text
Create a Strapi v5 backend implementation based on the following blueprint:
- universal, design-agnostic backend for multi-frontend websites
- v5-first, v4-tolerant frontend integration
- semantic content only, no style-specific fields
- shared global single types: site-config, about-page, region-highlights-section, plus page singles as needed (services-page, booking-page, report-page, screening-process-page, privacy-page)
- shared collection types: navigation, hero, service, news-post, article, faq, testimonial, stat, service-package, country-guideline, country-flag, equipment-item, fitness-criterion, certification, gallery-image, footer-quick-link, footer-service-link
- shared single types include: site-config, about-page, region-highlights-section, and page singles (services-page, booking-page, report-page, screening-process-page, privacy-page) as used by the project
- optional extensions: resource-item, team-member, location, product
- optional industry modules for medical, hospital, recruitment, travel, and manufacturing
- shared SEO component: seo.entry with metadata, canonicalPath, openGraphImage, twitterCard, structuredData, noIndex, snippetForAiOverview
- shared helper components for service, hero, and about
- media-only policy for primary assets
- use populate=* as the default public API contract unless deeper populate trees are explicitly validated in the target Strapi v5 instance
- include permissions guidance, API token guidance, seed guidance, and v4/v5 normalization notes
- include standard page coverage: about, management, mission, vision, blog, news, resources, gallery, products, legal pages, and multilingual support where needed

Generate:
1. content type definitions
2. component definitions
3. optional extension definitions
4. public API endpoint list
5. editor guidance
6. permissions checklist
7. seed checklist
8. frontend integration checklist
9. naming-collision prevention notes
10. a changelog-ready contract summary
```
API key usage reminder
Use a read-only API token for frontend consumption and send it as:
```http
Authorization: Bearer <token>
```
Keep admin credentials private, and never allow public mutation actions.

---
## 21) Uniweb `backend/` — content types, REST paths, and fields

**Convention:** Strapi REST uses **`pluralName`** in the path (`/api/{plural}`). Single types use the singular API id (e.g. `/api/site-config`). All listed types use **`draftAndPublish: true`** unless noted. **`seo.entry`** fields: `metaTitle`, `metaDescription`, `metaKeywords`, `canonicalPath`, `openGraphImage`, `openGraphImageAlt`, `twitterCard`, `structuredData` (long text, JSON-LD), `noIndex`, `snippetForAiOverview`.

### 21.1 Master index (call from frontend)

| Strapi UID | REST list / read | Kind | Purpose |
|------------|------------------|------|---------|
| `api::site-config.site-config` | `GET /api/site-config` | Single | Branding, contact, social URLs, toggles, contact-form inbox + **SMTP** (secrets removed in HTTP response), `defaultSeo` |
| `api::contact-submission.contact-submission` | `POST /api/contact-submissions/submit` (public); **no** public `find` | Collection | Website messages; manage in **Content Manager → Contact submission** |
| `api::navigation.navigation` | `GET /api/navigations` | Collection | Menu (`label`, `href`, `order`, parent/children relation) |
| `api::hero.hero` | `GET /api/heroes?filters[page][$eq]=…` | Collection | Per-route hero (`page` unique string) |
| `api::service.service` | `GET /api/services` | Collection | Service cards + detail (`slug`); `category` → **Service Category** |
| `api::service-category.service-category` | `GET /api/service-categories` | Collection | Names/slugs/order for service filters + relation target |
| `api::article.article` | `GET /api/articles` | Collection | Blog (`postCategory`, `author`, `isFeatured`, `commentsOpen`) |
| `api::news-post.news-post` | `GET /api/news-posts` | Collection | News (same field pattern as blog) |
| `api::post-category.post-category` | `GET /api/post-categories` | Collection | Taxonomy; `scope` = `blog` \| `news` |
| `api::author.author` | `GET /api/authors` | Collection | Optional byline + avatar |
| `api::comment.comment` | `POST /api/comments/submit`, `GET /api/comments/approved?…` | Collection | Public submit + read approved (no public `find` on raw list) |
| `api::faq.faq` | `GET /api/faqs` (+ optional `filters[sitePage][page][$eq]=…`) | Collection | FAQ list; **`sitePage`** relation → **Hero** (pick published hero in Admin = dropdown of page slots) |
| `api::testimonial.testimonial` | `GET /api/testimonials` | Collection | Quotes |
| `api::stat.stat` | `GET /api/stats` | Collection | Numeric highlights |
| `api::service-package.service-package` | `GET /api/service-packages` | Collection | Package cards |
| `api::country-guideline.country-guideline` | `GET /api/country-guidelines` | Collection | Country-specific guideline rows |
| `api::country-flag.country-flag` | `GET /api/country-flags` | Collection | Name + flag + order (region strip) |
| `api::region-highlights-section.region-highlights-section` | `GET /api/region-highlights-section` | Single | Banner strip + depends on `country-flags` in UI |
| `api::equipment-item.equipment-item` | `GET /api/equipment-items` | Collection | Equipment table |
| `api::fitness-criterion.fitness-criterion` | `GET /api/fitness-criteria` | Collection | Fitness categories + repeatable **`service.simple-line`** `itemLines` |
| `api::certification.certification` | `GET /api/certifications` | Collection | Partner/accreditation logos |
| `api::gallery-image.gallery-image` | `GET /api/gallery-images` | Collection | Image + alt + order |
| `api::footer-quick-link.footer-quick-link` | `GET /api/footer-quick-links` | Collection | Footer column links |
| `api::footer-service-link.footer-service-link` | `GET /api/footer-service-links` | Collection | Footer service links |
| `api::about-page.about-page` | `GET /api/about-page` | Single | Mission/center/values/gallery/YouTube + `seo` |
| `api::services-page.services-page` | `GET /api/services-page` | Single | `comparisonRows` only (filter tabs come from **Service Category**) |
| `api::booking-page.booking-page` | `GET /api/booking-page` | Single | `timeSlotLines` (**`service.simple-line`**) + `seo` |
| `api::fitness-page.fitness-page` | `GET /api/fitness-page` | Single | `disclaimer` + `seo` for `/fitness` |
| `api::report-page.report-page` | `GET /api/report-page` | Single | Sample report hints + `seo` |
| `api::booking-request.booking-request` | `GET /api/booking-requests/availability`, `POST /api/booking-requests/submit` | Collection | Public book flow; not open `find` for anonymous listing |
| `api::lab-report-file.lab-report-file` | `POST /api/lab-report-files/download`, `POST …/staff-login`, `POST …/upload` | Collection | Patient PDF portal + **`lab-staff`** JWT upload; files on disk under `private/lab-reports/` |
| `api::screening-process-page.screening-process-page` | `GET /api/screening-process-page` | Single | Checklist + `steps` component + `seo` |
| `api::privacy-page.privacy-page` | `GET /api/privacy-page` | Single | `title`, repeatable `privacy.section`, `seo` |
| `api::product.product` | `GET /api/products` | Collection | Catalog / portfolio (optional site) |
| `api::team-member.team-member` | `GET /api/team-members` | Collection | Team grid (optional site) |
| `api::resource-item.resource-item` | `GET /api/resource-items` | Collection | Downloads / resource hub (optional site) |
| `api::location.location` | `GET /api/locations` | Collection | Branches / offices (optional site) |

### 21.2 Field lists (schemas in `backend/src/api/.../schema.json`)

**`site-config`:** `siteName`, `tagline`, `logo` (media), `phone`, `email`, `address`, `workingHours`, `googleMapsEmbed`, `facebookUrl`, `instagramUrl`, `linkedinUrl`, `showBlogSection`, `showNewsSection`, `commentsEnabled`, **contact form:** `contactFormToEmail`, `contactFormSendConfirmation`, **booking form:** `bookingFormToEmail`, `bookingFormSendConfirmation`, **outbound mail:** `smtpHost`, `smtpPort`, `smtpSecure`, `smtpUsername`, `smtpPassword`, `emailFrom` (all **stripped** from public `GET /api/site-config` except secrets are never exposed; server uses Site config first, then optional **`SMTP_*` / `EMAIL_FROM` env** when fields empty), **footer / home contact UI:** `footerBrandExtra`, repeatable **`footerColumns`** (`site.footer-column` with nested **`site.footer-link`**), `footerCertStripTitle`, `footerPrivacyLinkLabel`, `footerCopyrightExtra`, `footerMapPlaceholderLabel`, `footerLegacyQuickTitle`, `footerLegacyServicesTitle`, `footerLegacyHelpTitle`, `footerLegacyHelpBody`, `quickContactSectionTitle`, `quickContactSectionBody`, `quickContactFormHeading`, `quickContactSuccessHeading`, `quickContactSuccessBody`, `quickContactIframeTitle`, `defaultSeo` (component).

**`contact-submission`:** `formKey` (`contact_page` \| `home_quick`), `name`, `email`, optional `phone`, optional `serviceInterest`, `message`, `isRead`. **`draftAndPublish`:** off. Created only via **`POST /api/contact-submissions/submit`** (not the generic REST create for anonymous users).

**`navigation`:** `label`, `href`, `order`, `parent` / `children` (self-relation).

**`hero`:** `page` (string, unique), `title`, `subtitle`, `slideItems` (repeatable **`hero.slide`**: `image` media, `title`, `text`, repeatable **`ctaButtons`** **`hero.cta-button`**), optional root `ctaButtons` (same component; used when a slide omits CTAs), `promoVideo` (media video), `seo`.

**`service-category`:** `name`, `slug`, `description`, `sortOrder`, inverse `services`.

**`service`:** `title`, `slug`, `icon`, `iconImage`, `description`, `category` (many-to-one → **service-category**), `heroImage`, `cardImage`, `fullDescription` (richtext), `benefits` / `tests` (**`service.simple-line`**: `text`), `pricing` (**`service.pricing-row`**), `timeline` (**`service.timeline-step`**), `documents` (**`service.document-item`**), `relatedServices` / `inverseRelatedServices` (M2M), `seo`.

**`post-category`:** `name`, `slug`, `scope` (`blog` \| `news`), `description`, `sortOrder`; inverse relations `articles` / `newsPosts`.

**`author`:** `name`, `slug`, `bio`, `email`, `avatar` (media); inverse `articles` / `newsPosts`.

**`article`:** `title`, `slug`, `excerpt`, `content` (richtext), `image`, `date`, `postCategory` (→ post-category), `author` (→ author), `isFeatured` (boolean; only one should be true per collection — enforced on save), `commentsOpen`, `seo`.

**`news-post`:** same editorial fields as **`article`** (use **post-category** with `scope: news`).

**`comment`:** `postType` (`article` \| `news-post`), `targetSlug`, `authorName`, `authorEmail`, `body`, `isApproved`, optional `parent` / `replies` (threading). **`draftAndPublish`:** off. **Draft vs published posts:** use Strapi’s built-in **Draft & Publish** on **Article** and **News Post** — only **Published** entries are returned to the public SPA by default.

**`faq`:** `question`, `answer`, `order`, **`sitePage`** (many-to-one → **Hero**, required). Editors choose **which published Hero / page slot** this FAQ belongs to (no free-text route key). API filters use the linked Hero’s **`page`** string.

**`testimonial`:** `name`, `photo`, `rating` (1–5), `quote`, `order`.

**`stat`:** `label`, `value`, `suffix`, `order`.

**`service-package`:** `title`, `description`, `featureLines` (**`service.simple-line`**: one row per bullet), `pricing`, `order`.

**`country-guideline`:** `name`, `countryId`, `flag`, `processingTime`, `approvalNote`, `expertTip`, `mandatoryTests`, `rejectionCriteria`, `specialRules`, `visaCategories`.

**`country-flag`:** `name`, `flag` (media), `order`.

**`region-highlights-section`:** `bannerImage`, `bannerTitle`, `bannerDescription`.

**`equipment-item`:** `slNo`, `name`, `model`, `qty`, `origin`, `status`, `image`.

**`fitness-criterion`:** `category`, `description`, `itemLines` (**`service.simple-line`**).

**`fitness-page`:** `entryTitle` (admin label), `disclaimer`, `seo`.

**`certification`:** `name` (optional), `logo` (optional media), `shortDescription` (optional text), `verificationUrl` (optional string URL — logo/name link in UI), `order`.

**`gallery-image`:** `image`, `alt`, `order`.

**`footer-quick-link` / `footer-service-link`:** `label`, `href`, `order`.

**`about-page`:** `missionTitle`, `missionText`, `missionImage`, `centerTitle`, `centerText`, `centerImage`, `valuesSectionTitle`, `values` (**`about.value-item`**), `facilityGalleryTitle`, `facilityGallerySubtitle`, `gallery` (**`about.gallery-item`**), `virtualTourYoutubeUrl`, `seo`.

**`services-page`:** `comparisonRows` (**`services.comparison-row`**).

**`booking-page`:** `timeSlotLines` (**`service.simple-line`**: one line per slot label), `seo`.

**`booking-request`:** `patientName`, `email`, `phone`, `serviceId`, `serviceTitle`, `appointmentDate`, `timeSlot`, `status`, `staffNotes`. Created via **`POST /api/booking-requests/submit`**; **`draftAndPublish`:** off.

**`report-page`:** `samplePatientName`, `sampleReportDate`, `sampleStatus`, `supportPhone`, `seo`.

**`lab-report-file`:** `passportNumber`, `phoneDigits`, `originalFileName`, `storedFileName` (private), `mimeType`, `fileSize`. PDF bytes under **`private/lab-reports/`** on server. Public **`POST /api/lab-report-files/download`**; staff **`POST …/staff-login`** + **`POST …/upload`** with JWT (**`lab-staff`** role).

**`screening-process-page`:** `checklistTitle`, `checklistDescription`, `totalTimeLabel`, `steps` (**`screening.process-step`**: `title`, `description`, `estimatedTime`, `detailLines` as **`service.simple-line`**), `seo`.

**`privacy-page`:** `title`, `sections` (**`privacy.section`**: `heading`, `body`), `seo`.

**`product`:** `name`, `slug`, `summary`, `description` (richtext), `featuredImage`, `gallery`, `brochureFile`, `specificationFile`, `categoryLabel`, `order`, `seo`.

**`team-member`:** `name`, `slug`, `designation`, `bio`, `photo`, `email`, `linkedinUrl`, `order`, `seo`.

**`resource-item`:** `title`, `slug`, `resourceType` (enum), `summary`, `content`, `featuredImage`, `downloadFile`, `externalUrl`, `publishDate`, `categoryLabel`, `isFeatured`, `order`, `seo`.

**`location`:** `name`, `slug`, `address`, `phone`, `email`, `googleMapsEmbed`, `workingHours`, `heroImage`, `order`, `seo`.

---
## 22) Uniweb `frontend/src` — which `api.*` helper matches which UI

Normalized fetch layer: **`frontend/src/lib/api.ts`**. Layout bootstrap: **`StrapiLayoutContext.tsx`** (`siteConfig`, `navigation`, footer links, certifications).

| UI location | Source file(s) | Strapi / API |
|-------------|----------------|--------------|
| Header (logo, phone, nav) | `components/layout/Header.tsx` | `site-config`, `navigation` (via context) |
| Footer | `components/layout/Footer.tsx` | `site-config` (`footerColumns` + legacy footer strings), `footer-quick-link`, `footer-service-link`, `certification` (via context) |
| Home hero | `components/home/HeroSection.tsx` | `api.hero.getByPage("home", …)` → **`heroes`** |
| Home services grid | `components/home/ServicesSection.tsx` | `api.services.getAll()` → **`services`** |
| Home region banner + flags | `components/home/RegionHighlightsSection.tsx` | `api.regionHighlightsSection.get()` + `api.countryFlags.getAll()` |
| Home trust / stats / packages / certs strip | `components/home/TrustSection.tsx` | `api.stats`, `api.servicePackages`, `api.certifications` |
| Home country guidelines | `components/home/CountryGuidelinesSection.tsx` | `api.countryGuidelines` → **`country-guidelines`** |
| Home “Get in touch” | `components/home/QuickContactSection.tsx` | **`site-config`** + `POST /api/contact-submissions/submit` (`formKey`: `home_quick`) |
| Services page | `pages/Services.tsx` | `services`, **`faqs`** via `api.faqs.getByPage("services")`, `services-page`, `hero` page `services` |
| Service detail | `pages/ServiceDetail.tsx` | `services` (+ `hero` if you add it) |
| About | `pages/About.tsx` | `about-page`, `hero` page `about` |
| Blog list / post | `pages/Blog.tsx`, `BlogPost.tsx` | `articles` (+ `post-categories`, `authors`), `hero` page `blog`; `POST/GET /api/comments/*` when comments on |
| News list / post | `pages/News.tsx`, `NewsPost.tsx` | `news-posts` (same relations), `hero` page `news` |
| Nav + route gates | `StrapiLayoutContext.tsx`, `SectionRoute.tsx`, `App.tsx` | `site-config.showBlogSection` / `showNewsSection` |
| Book appointment | `pages/BookAppointment.tsx` | `booking-page`, `services`, `hero` page `book`, `booking-requests` availability + submit |
| Report check | `pages/ReportCheck.tsx` | `report-page`, `hero` page `reports`, `POST /api/lab-report-files/download` |
| Staff login | `pages/StaffLogin.tsx` | `POST /api/lab-report-files/staff-login` |
| Staff lab PDF upload | `pages/LabReportBulkUpload.tsx` | `POST /api/lab-report-files/upload` (Bearer JWT) |
| Screening process | `pages/ScreeningProcess.tsx` | `screening-process-page`, `hero` page `process` |
| Contact | `pages/Contact.tsx` | `services`, `hero` page `contact`, `POST /api/contact-submissions/submit` (`formKey`: `contact_page`) |
| Fitness | `pages/FitnessPage.tsx` | `fitness-page` (single), `fitness-criteria`, `hero` page `fitness` |
| Equipment | `pages/EquipmentPage.tsx` | `equipment-items`, `hero` page `equipment` |
| Privacy | `pages/Privacy.tsx` | `privacy-page` |
| **Not wired in this SPA yet** | — | Use REST for **`products`**, **`team-members`**, **`resource-items`**, **`locations`** when you add pages/sections. |

**`hero.page` values used today:** `home`, `services`, `about`, `blog`, `news`, `book`, `reports`, `process`, `contact`, `fitness`, `equipment` (see `api.ts` defaults and each page’s `getByPage` call). **FAQ `sitePage`** must point at the **Hero** row for that slot (create/publish the Hero first, then pick it on the FAQ).

---
## 23) Editor / maintainer quick reference

For non-developers: **`docs/FRONTEND_STRAPI_MAINTENANCE_MAP.md`** in the **uniweb** repo maps **each website page and section** to the **Strapi Content Manager** entry to edit. Keep that file updated when you add routes or sections.

---
## 24) Gaps, issues, and next steps (universal backend roadmap)

**Current limitations / debt**

- **Service categories** use the **`service-category`** collection and a relation on **`service`** (filter tabs load from `/api/service-categories`).
- **List-shaped CMS data** uses repeatable **`service.simple-line`** (or other typed components) instead of raw JSON in Strapi for packages, booking slots, fitness bullets, and process step details.
- **Optional types** (`product`, `team-member`, `resource-item`, `location`) have no first-class sections in the sample `frontend` yet—only REST + permissions; add `api.ts` helpers when you standardize list/detail shapes.
- **Docker / VPS:** persist **`public/uploads`** (bind mount or named volume) alongside the database; otherwise Media Library and `/uploads/...` break after container recreate. **`git pull` does not sync uploads.**
- **Hero `page` is a free string**; typos hide content. Consider enum or guarded seed list.
- **`masterstrapi/`** folder may still use older IDs (`gcc-country`); align or treat as legacy snapshot.
- **Breaking renames** (`gcc-*` → neutral) require new DB or migration for existing deployments.

**Recommended next steps**

1. Add **typed API helpers** in `frontend/src/lib/api.ts` for `products`, `team-members`, `resource-items`, `locations` (list + by slug) with shared `populate` constants.
2. Replace remaining **domain-specific** copy in seeds with neutral placeholders per vertical.
3. Publish **`FRONTEND_STRAPI_MAINTENANCE_MAP.md`** to your internal wiki and link from Strapi Admin custom dashboard (optional).
4. Add **OpenAPI or static JSON contract** export from Strapi (plugin or generated) for Lovable/Cursor consumers.
5. **i18n**: enable only on types that need translation; document locale in the maintenance map.
6. **E-commerce**: keep out of this template; if needed, use a dedicated shop module or external commerce API.
