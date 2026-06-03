/**
 * API Service Layer — Strapi Integration Ready
 *
 * Bundled mock/demo rows live in this **frontend** repo (`@/data/*`). Strapi (backend) has no mock toggle.
 * To integrate Strapi:
 *   1. Set VITE_STRAPI_URL in the **frontend** `.env` (Vite)
 *   2. (Optional) Set VITE_STRAPI_API_KEY for authenticated read access
 *   3. Create matching content types in Strapi
 *   4. `VITE_MOCK_DATA` (frontend only, default Yes) controls whether those bundled rows are used as fallbacks
 *
 * Usage:
 *   const articles = await api.blog.getAll();
 *   const news = await api.news.getAll();
 *   const service = await api.services.getBySlug("physical-examination");
 *   const siteConfig = await api.siteConfig.get();
 */

import type {
  EquipmentItem,
  FAQItem,
  FitnessCriteria,
  FooterLink,
  NavItem,
  ServiceCard,
  ServiceDetail,
  ServicePackage,
  StatItem,
  Testimonial,
} from "@/data/mockData";
import {
  certificationBadges as defaultCerts,
  comparisonData as defaultComparisonData,
  equipmentList as defaultEquipment,
  facilityImages as defaultGallery,
  fitnessCriteria as defaultFitnessCriteria,
  footerQuickLinks as defaultQuickLinks,
  footerServices as defaultFooterServices,
  homeFAQs,
  navItems as defaultNavItems,
  serviceFAQs as defaultFAQs,
  servicePackages as defaultPackages,
  services as defaultServices,
  serviceDetails as defaultServiceDetails,
  stats as defaultStats,
  testimonials as defaultTestimonials,
} from "@/data/mockData";

export const STRAPI_BASE_URL = import.meta.env.VITE_STRAPI_URL || "";
const STRAPI_API_KEY = import.meta.env.VITE_STRAPI_API_KEY || "";

/** Strapi Users & Permissions role `type` for lab PDF uploads (`/staff/lab-reports`). */
export const LAB_STAFF_ROLE_TYPE = "lab-staff";

/** True when the app should load layout/pages from Strapi (no mock-first UI). */
export const IS_STRAPI_CONFIGURED = Boolean(STRAPI_BASE_URL.trim());

/** Frontend-only (Vite `import.meta.env`). Strapi ignores this. Yes/true/1/on (default) = allow bundled `@/data` fallbacks; No/false/0/off = SPA shows empty sections when CMS is blank or API fails. */
function readMockDataEnabled(): boolean {
  const raw = import.meta.env.VITE_MOCK_DATA ?? import.meta.env.VITE_MOCKDATA;
  const v = String(raw ?? "Yes").trim().toLowerCase();
  if (["no", "false", "0", "off", "n"].includes(v)) return false;
  return true;
}

export const IS_MOCK_DATA_ENABLED = readMockDataEnabled();

/**
 * Offline / demo hydration from `@/data` when Strapi URL is unset.
 * When false and Strapi is unset, pages start empty instead of mock rows.
 */
export const USE_LOCAL_MOCK_HYDRATION = !IS_STRAPI_CONFIGURED && IS_MOCK_DATA_ENABLED;

/** Page title for `<title>` / OG when Strapi SEO is absent. Avoids hardcoding brand in page files. */
export function formatPageTitle(pagePart: string, siteName: string): string {
  const p = pagePart.trim();
  const s = siteName.trim();
  if (!p) return s || "Home";
  if (!s) return p;
  return `${p} — ${s}`;
}

/** Strapi string, blocks JSON, or other → markdown-ish string for `<RichText />`. */
function strapiRichOrTextToMarkdown(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return richtextToPlainString(val);
  return String(val);
}

export interface FooterColumnConfig {
  title: string;
  body: string;
  showMap: boolean;
  links: { label: string; href: string }[];
}

function mapFooterColumns(raw: unknown): FooterColumnConfig[] {
  return normalizeComponentList(raw)
    .map((r) => {
      const title = String(r.title ?? "").trim();
      if (!title) return null;
      const links = normalizeComponentList(r.links)
        .map((l) => ({
          label: String(l.label ?? "").trim(),
          href: String(l.href ?? "").trim(),
        }))
        .filter((l) => l.label && l.href);
      return {
        title,
        body: String(r.body ?? "").trim(),
        showMap: Boolean(r.showMap),
        links,
      };
    })
    .filter(Boolean) as FooterColumnConfig[];
}

interface StrapiResponse<T> {
  data: T;
  meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } };
}

/** Prepend Strapi origin for `/uploads/...` paths (Section 8). */
function toAbsoluteStrapiUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return pathOrUrl;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  const base = STRAPI_BASE_URL.replace(/\/$/, "");
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

/** Strapi v4 media shape, v5 flat media, or plain URL string → relative or absolute path. */
function extractRelativeMediaPath(media: unknown): string | undefined {
  if (media == null) return undefined;
  if (typeof media === "string") return media;
  if (typeof media !== "object") return undefined;
  const m = media as Record<string, unknown>;
  if (typeof m.url === "string") return m.url;
  const data = m.data;
  if (data == null) return undefined;
  if (Array.isArray(data)) {
    const first = data[0];
    return extractRelativeMediaPath(first);
  }
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    const attrs = d.attributes;
    if (attrs && typeof attrs === "object" && typeof (attrs as { url?: string }).url === "string") {
      return (attrs as { url: string }).url;
    }
    if (typeof d.url === "string") return d.url;
  }
  return undefined;
}

function resolveMediaToAbsolute(media: unknown): string | undefined {
  const path = extractRelativeMediaPath(media);
  if (!path) return undefined;
  return toAbsoluteStrapiUrl(path);
}

/** Strapi v4 `{ id, attributes }` vs v5 flat document (Section 7). */
function flattenStrapiEntity(entry: unknown): Record<string, unknown> | null {
  if (entry == null || typeof entry !== "object") return null;
  if (Array.isArray(entry)) {
    return entry.length > 0 ? flattenStrapiEntity(entry[0]) : null;
  }
  const e = entry as Record<string, unknown>;
  if (e.attributes !== null && typeof e.attributes === "object" && "attributes" in e) {
    const attrs = e.attributes as Record<string, unknown>;
    return { ...attrs, ...(e.id !== undefined ? { id: e.id } : {}), ...(e.documentId !== undefined ? { documentId: e.documentId } : {}) };
  }
  return e;
}

function unwrapStrapiCollection(raw: unknown): Record<string, unknown>[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => flattenStrapiEntity(item)).filter(Boolean) as Record<string, unknown>[];
  }
  const one = flattenStrapiEntity(raw);
  return one ? [one] : [];
}

function normalizeComponentList(rows: unknown): Record<string, unknown>[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => flattenStrapiEntity(row) ?? (typeof row === "object" && row !== null ? (row as Record<string, unknown>) : null))
    .filter(Boolean) as Record<string, unknown>[];
}

function richtextToPlainString(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (!Array.isArray(val)) return "";

  const inlineText = (node: unknown): string => {
    if (node == null) return "";
    if (typeof node === "string") return node;
    if (typeof node !== "object") return "";
    const n = node as Record<string, unknown>;
    if (typeof n.text === "string") {
      let text = n.text;
      if (n.code === true) text = `\`${text}\``;
      if (n.bold === true) text = `**${text}**`;
      if (n.italic === true) text = `*${text}*`;
      if (n.strikethrough === true) text = `~~${text}~~`;
      if (n.underline === true) text = `<u>${text}</u>`;
      return text;
    }
    if (Array.isArray(n.children)) return n.children.map(inlineText).join("");
    return "";
  };

  const blockText = (node: unknown): string => {
    if (node == null || typeof node !== "object") return inlineText(node);
    const n = node as Record<string, unknown>;
    const type = String(n.type ?? "");
    const children = Array.isArray(n.children) ? (n.children as unknown[]) : [];
    const text = children.map(inlineText).join("").trim();
    if (!type || type === "paragraph") return text;
    if (type === "heading") {
      const levelRaw = Number(n.level ?? 2);
      const level = Number.isFinite(levelRaw) ? Math.min(6, Math.max(1, levelRaw)) : 2;
      return `${"#".repeat(level)} ${text}`;
    }
    if (type === "quote") return text ? `> ${text}` : "";
    if (type === "code") {
      const lang = String(n.language ?? "").trim();
      return `\`\`\`${lang}\n${text}\n\`\`\``;
    }
    if (type === "list") {
      const format = String(n.format ?? "unordered");
      const items = children.map((it, idx) => {
        const itemText = inlineText(it).trim();
        if (!itemText) return "";
        return format === "ordered" ? `${idx + 1}. ${itemText}` : `- ${itemText}`;
      });
      return items.filter(Boolean).join("\n");
    }
    return text;
  };

  return val.map(blockText).filter(Boolean).join("\n\n");
}

function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((x): x is string => typeof x === "string");
}

/** Service benefits/tests: repeatable `service.simple-line` components, or legacy JSON / string[]. */
function mapServiceStringList(val: unknown): string[] {
  const comps = normalizeComponentList(val);
  const fromComponents = comps
    .map((r) => String(r.text ?? "").trim())
    .filter(Boolean);
  if (fromComponents.length > 0) return fromComponents;
  if (Array.isArray(val)) {
    const plain = asStringArray(val);
    if (plain.length > 0) return plain;
  }
  return parseJsonStringArray(val);
}

function unwrapRelationList(raw: unknown): unknown[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object" && raw !== null && "data" in raw) {
    const d = (raw as { data: unknown }).data;
    if (Array.isArray(d)) return d;
    if (d != null) return [d];
  }
  return [];
}

function mapRelatedSlugs(raw: unknown): string[] {
  const slugs: string[] = [];
  for (const it of unwrapRelationList(raw)) {
    const f = flattenStrapiEntity(it);
    if (f && typeof f.slug === "string" && f.slug) slugs.push(f.slug);
  }
  return slugs;
}

function mapMediaListToSlides(mediaField: unknown): { src: string; alt: string }[] {
  const rawItems: unknown[] = [];
  if (Array.isArray(mediaField)) rawItems.push(...mediaField);
  else if (mediaField && typeof mediaField === "object" && "data" in (mediaField as object)) {
    const d = (mediaField as { data: unknown }).data;
    if (Array.isArray(d)) rawItems.push(...d);
    else if (d != null) rawItems.push(d);
  }

  const slides: { src: string; alt: string }[] = [];
  for (const item of rawItems) {
    const url = resolveMediaToAbsolute(item);
    if (!url) continue;
    const flat = flattenStrapiEntity(item) ?? (typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {});
    const alt = String(
      (flat.alternativeText as string | undefined) ??
        (flat.caption as string | undefined) ??
        (flat.name as string | undefined) ??
        ""
    );
    slides.push({ src: url, alt });
  }
  return slides;
}

/** Repeatable components may be a plain array or `{ data: [...] }` (Strapi v5). */
function unwrapComponentRepeatable(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "data" in (raw as object)) {
    const d = (raw as { data: unknown }).data;
    if (Array.isArray(d)) return d;
    if (d != null) return [d];
  }
  return [];
}

/** Strapi `hero.slide` repeatable: image + title + text per carousel slide. */
function mapSlideItemsToHeroSlides(
  slideItemsField: unknown,
  fallbackTitle: string,
  fallbackSubtitle: string
): HeroSlide[] {
  const rows = normalizeComponentList(unwrapComponentRepeatable(slideItemsField));
  const out: HeroSlide[] = [];
  for (const row of rows) {
    const url = resolveMediaToAbsolute(row.image);
    if (!url) continue;
    const mediaFlat = flattenStrapiEntity(row.image) ?? {};
    const altFromMedia = String(
      (mediaFlat.alternativeText as string | undefined) ??
        (mediaFlat.caption as string | undefined) ??
        (mediaFlat.name as string | undefined) ??
        ""
    );
    const slideTitle = String(row.title ?? "").trim();
    const slideText = String(row.text ?? "").trim();
    const slideCtas = mapCtaButtons((row as Record<string, unknown>).ctaButtons);
    out.push({
      src: url,
      alt: altFromMedia || slideTitle || fallbackTitle,
      ...(slideTitle ? { title: slideTitle } : {}),
      ...(slideText ? { text: slideText } : {}),
      ...(slideCtas?.length ? { ctaButtons: slideCtas } : {}),
    });
  }
  return out;
}

function mapCtaButtons(raw: unknown): PageHero["ctaButtons"] {
  const rows = normalizeComponentList(raw);
  if (rows.length === 0) return undefined;
  const out: NonNullable<PageHero["ctaButtons"]> = [];
  for (const o of rows) {
    const label = String(o.label ?? "");
    const href = String(o.href ?? "");
    const variant = o.variant === "secondary" ? "secondary" : "primary";
    if (label && href) out.push({ label, href, variant });
  }
  return out.length ? out : undefined;
}

/** SEO + JSON-LD + social preview (Strapi component `seo.entry`). */
export interface PageSeo {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalPath: string;
  openGraphImage: string;
  openGraphImageAlt: string;
  twitterCard: "summary" | "summary_large_image";
  structuredData: unknown;
  noIndex: boolean;
  snippetForAiOverview: string;
}

function mapPageSeo(raw: unknown): PageSeo | undefined {
  const row = flattenStrapiEntity(raw);
  if (!row) return undefined;
  const metaTitle = String(row.metaTitle ?? "").trim();
  const metaDescription = String(row.metaDescription ?? "").trim();
  const metaKeywords = String(row.metaKeywords ?? "").trim();
  const canonicalPath = String(row.canonicalPath ?? "").trim();
  const openGraphImage = resolveMediaToAbsolute(row.openGraphImage) ?? "";
  const openGraphImageAlt = String(row.openGraphImageAlt ?? "").trim();
  const snippetForAiOverview = String(row.snippetForAiOverview ?? "").trim();
  const structuredData = parseStructuredDataField(row.structuredData);
  const noIndex = Boolean(row.noIndex);
  const tw = row.twitterCard;

  const hasPayload =
    Boolean(metaTitle) ||
    Boolean(metaDescription) ||
    Boolean(metaKeywords) ||
    Boolean(canonicalPath) ||
    Boolean(openGraphImage) ||
    structuredData != null ||
    Boolean(snippetForAiOverview) ||
    noIndex;

  if (!hasPayload) return undefined;

  return {
    metaTitle,
    metaDescription,
    metaKeywords,
    canonicalPath,
    openGraphImage,
    openGraphImageAlt,
    twitterCard: tw === "summary" || tw === "summary_large_image" ? tw : "summary_large_image",
    structuredData,
    noIndex,
    snippetForAiOverview,
  };
}

function mapSiteConfig(raw: unknown, defaults: SiteConfig): SiteConfig {
  const base = IS_MOCK_DATA_ENABLED ? defaults : emptySiteConfig;
  const flat = flattenStrapiEntity(raw);
  if (!flat) return base;

  const logo = resolveMediaToAbsolute(flat.logo) ?? base.logo;
  const footerLogo = resolveMediaToAbsolute(flat.footerLogo) ?? base.footerLogo ?? "";

  return {
    siteName: String(flat.siteName ?? base.siteName),
    tagline: String(flat.tagline ?? base.tagline),
    logo,
    footerLogo,
    phone: String(flat.phone ?? base.phone),
    email: String(flat.email ?? base.email),
    address: String(flat.address ?? base.address),
    workingHours: String(flat.workingHours ?? base.workingHours),
    googleMapsEmbed: String(flat.googleMapsEmbed ?? base.googleMapsEmbed),
    socialLinks: {
      ...base.socialLinks,
      ...(flat.facebookUrl ? { facebook: String(flat.facebookUrl) } : {}),
      ...(flat.instagramUrl ? { instagram: String(flat.instagramUrl) } : {}),
      ...(flat.linkedinUrl ? { linkedin: String(flat.linkedinUrl) } : {}),
      ...(flat.twitterUrl ? { twitter: String(flat.twitterUrl) } : {}),
      ...(flat.youtubeUrl ? { youtube: String(flat.youtubeUrl) } : {}),
    },
    showBlogSection: flat.showBlogSection !== false,
    showNewsSection: flat.showNewsSection !== false,
    commentsEnabled: flat.commentsEnabled === true,
    contactFormToEmail: String(flat.contactFormToEmail ?? base.contactFormToEmail).trim(),
    contactFormSendConfirmation: flat.contactFormSendConfirmation !== false,
    bookingFormToEmail: String(flat.bookingFormToEmail ?? base.bookingFormToEmail).trim(),
    bookingFormSendConfirmation: flat.bookingFormSendConfirmation !== false,
    defaultSeo: mapPageSeo(flat.defaultSeo) ?? base.defaultSeo,
    footerBrandExtra: String(flat.footerBrandExtra ?? base.footerBrandExtra ?? "").trim(),
    footerColumns: (() => {
      const cols = mapFooterColumns(flat.footerColumns);
      return cols.length > 0 ? cols : base.footerColumns;
    })(),
    footerCertStripTitle: String(flat.footerCertStripTitle ?? base.footerCertStripTitle ?? "").trim(),
    footerPrivacyLinkLabel: String(flat.footerPrivacyLinkLabel ?? base.footerPrivacyLinkLabel ?? "").trim(),
    footerCopyrightExtra: String(flat.footerCopyrightExtra ?? base.footerCopyrightExtra ?? "").trim(),
    footerMapPlaceholderLabel: String(flat.footerMapPlaceholderLabel ?? base.footerMapPlaceholderLabel ?? "").trim(),
    footerLegacyQuickTitle: String(flat.footerLegacyQuickTitle ?? base.footerLegacyQuickTitle ?? "").trim(),
    footerLegacyServicesTitle: String(flat.footerLegacyServicesTitle ?? base.footerLegacyServicesTitle ?? "").trim(),
    footerLegacyHelpTitle: String(flat.footerLegacyHelpTitle ?? base.footerLegacyHelpTitle ?? "").trim(),
    footerLegacyHelpBody: String(flat.footerLegacyHelpBody ?? base.footerLegacyHelpBody ?? "").trim(),
    quickContactSectionTitle: String(flat.quickContactSectionTitle ?? base.quickContactSectionTitle ?? "").trim(),
    quickContactSectionBody: String(flat.quickContactSectionBody ?? base.quickContactSectionBody ?? "").trim(),
    quickContactFormHeading: String(flat.quickContactFormHeading ?? base.quickContactFormHeading ?? "").trim(),
    quickContactSuccessHeading: String(flat.quickContactSuccessHeading ?? base.quickContactSuccessHeading ?? "").trim(),
    quickContactSuccessBody: String(flat.quickContactSuccessBody ?? base.quickContactSuccessBody ?? "").trim(),
    quickContactIframeTitle: String(flat.quickContactIframeTitle ?? base.quickContactIframeTitle ?? "").trim(),
    homeTrustIntroEyebrow: String(flat.homeTrustIntroEyebrow ?? base.homeTrustIntroEyebrow ?? "").trim(),
    homeTrustIntroHeading: String(flat.homeTrustIntroHeading ?? base.homeTrustIntroHeading ?? "").trim(),
    homeTrustIntroBody: String(flat.homeTrustIntroBody ?? base.homeTrustIntroBody ?? "").trim(),
    homeTrustIntroCtaLabel: String(flat.homeTrustIntroCtaLabel ?? base.homeTrustIntroCtaLabel ?? "").trim(),
    homeTrustIntroCtaHref: String(flat.homeTrustIntroCtaHref ?? base.homeTrustIntroCtaHref ?? "").trim(),
    homeTrustStatsEyebrow: String(flat.homeTrustStatsEyebrow ?? base.homeTrustStatsEyebrow ?? "").trim(),
    homeTrustStatsHeading: String(flat.homeTrustStatsHeading ?? base.homeTrustStatsHeading ?? "").trim(),
    homeServicesEyebrow: String(flat.homeServicesEyebrow ?? base.homeServicesEyebrow ?? "").trim(),
    homeServicesHeading: String(flat.homeServicesHeading ?? base.homeServicesHeading ?? "").trim(),
    homeServicesSubheading: String(flat.homeServicesSubheading ?? base.homeServicesSubheading ?? "").trim(),
    chatbotScript: String(flat.chatbotScript ?? base.chatbotScript ?? "").trim(),
  };
}

export function createEmptyPageHero(page: string): PageHero {
  return { page, title: "", subtitle: "", slides: [] };
}

function mapPageHero(raw: unknown, fallback: PageHero): PageHero {
  const base = IS_MOCK_DATA_ENABLED ? fallback : createEmptyPageHero(String(fallback.page));
  const list = unwrapStrapiCollection(raw);
  const first = list[0];
  if (!first) return base;

  const rootTitle = String(first.title ?? base.title);
  const rootSubtitle = String(first.subtitle ?? base.subtitle);

  const fromSlideItems = mapSlideItemsToHeroSlides(first.slideItems, rootTitle, rootSubtitle);
  const legacyMediaSlides =
    fromSlideItems.length === 0 ? mapMediaListToSlides((first as Record<string, unknown>).slides) : [];

  const slidesBase =
    fromSlideItems.length > 0
      ? fromSlideItems
      : legacyMediaSlides.length > 0
        ? legacyMediaSlides
        : IS_MOCK_DATA_ENABLED
          ? base.slides
          : [];

  const rootCtas = mapCtaButtons(first.ctaButtons) ?? base.ctaButtons;
  const slides = slidesBase.map((s) => ({
    ...s,
    ctaButtons:
      s.ctaButtons && s.ctaButtons.length > 0
        ? s.ctaButtons
        : rootCtas && rootCtas.length > 0
          ? rootCtas
          : undefined,
  }));
  const promoVideoUrl = resolveMediaToAbsolute(first.promoVideo) ?? "";

  return {
    page: String(first.page ?? base.page),
    title: rootTitle,
    subtitle: rootSubtitle,
    slides,
    ctaButtons: rootCtas,
    ...(promoVideoUrl ? { promoVideoUrl } : {}),
    seo: mapPageSeo(first.seo) ?? base.seo,
  };
}

function mapValueItemImg(row: Record<string, unknown>): string {
  return resolveMediaToAbsolute(row.img) ?? "";
}

export function getEmptyAboutPageContent(): AboutPageContent {
  return {
    missionTitle: "",
    missionText: "",
    missionImage: "",
    centerTitle: "",
    centerText: "",
    centerImage: "",
    valuesSectionTitle: "",
    values: [],
    facilityGalleryTitle: "",
    facilityGallerySubtitle: "",
    gallery: [],
    virtualTourYoutubeUrl: "",
  };
}

function mapAboutPage(raw: unknown, defaults: AboutPageContent): AboutPageContent {
  const base = IS_MOCK_DATA_ENABLED ? defaults : getEmptyAboutPageContent();
  const flat = flattenStrapiEntity(raw);
  if (!flat) return base;

  const valueRows = normalizeComponentList(flat.values);
  const values =
    valueRows.length > 0
      ? valueRows.map((row) => ({
          title: String(row.title ?? ""),
          desc: String(row.desc ?? ""),
          alt: String(row.alt ?? ""),
          img: mapValueItemImg(row) || base.values[0]?.img || "",
        }))
      : base.values;

  const galleryRows = normalizeComponentList(flat.gallery);
  const gallery =
    galleryRows.length > 0
      ? galleryRows.map((row) => ({
          src: resolveMediaToAbsolute(row.image) || base.gallery[0]?.src || "",
          alt: String(row.alt ?? ""),
        }))
      : base.gallery;

  const missionText =
    richtextToPlainString(flat.missionText) || String(flat.missionText ?? base.missionText);
  const centerText =
    richtextToPlainString(flat.centerText) || String(flat.centerText ?? base.centerText);

  return {
    missionTitle: String(flat.missionTitle ?? base.missionTitle),
    missionText,
    missionImage: resolveMediaToAbsolute(flat.missionImage) ?? base.missionImage,
    centerTitle: String(flat.centerTitle ?? base.centerTitle),
    centerText,
    centerImage: resolveMediaToAbsolute(flat.centerImage) ?? base.centerImage,
    valuesSectionTitle: String(flat.valuesSectionTitle ?? base.valuesSectionTitle),
    values,
    facilityGalleryTitle: String(flat.facilityGalleryTitle ?? base.facilityGalleryTitle),
    facilityGallerySubtitle: String(flat.facilityGallerySubtitle ?? base.facilityGallerySubtitle),
    gallery,
    virtualTourYoutubeUrl: String(flat.virtualTourYoutubeUrl ?? "").trim(),
    seo: mapPageSeo(flat.seo) ?? base.seo,
  };
}

function normalizePriority(val: unknown): number {
  const n = Number(val ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

function mapServiceCards(raw: unknown, fallback: ServiceCard[]): ServiceCard[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  const sorted = [...list].sort(
    (a, b) =>
      normalizePriority(a.priority) - normalizePriority(b.priority) ||
      String(a.title ?? "").localeCompare(String(b.title ?? ""))
  );
  return sorted.map((row) => {
    const slug = String(row.slug ?? "");
    const cardImage = resolveMediaToAbsolute(row.cardImage) ?? resolveMediaToAbsolute(row.heroImage);
    const iconImage = resolveMediaToAbsolute(row.iconImage);
    return {
      icon: String(row.icon ?? "CircleDot"),
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      href: slug ? `/services/${slug}` : "#",
      category: mapServiceCategoryLabel(row.category),
      ...(cardImage ? { cardImage } : {}),
      ...(iconImage ? { iconImage } : {}),
    };
  });
}

function mapServiceDetail(row: Record<string, unknown>): ServiceDetail | undefined {
  const slug = String(row.slug ?? "");
  if (!slug) return undefined;

  const hero =
    resolveMediaToAbsolute(row.heroImage) ??
    resolveMediaToAbsolute(row.cardImage) ??
    "";

  const description =
    richtextToPlainString(row.fullDescription) || String(row.description ?? "");

  const pricingRows = normalizeComponentList(row.pricing).map((r) => ({
    item: String(r.item ?? ""),
    price: String(r.price ?? ""),
    duration: String(r.duration ?? ""),
  }));

  const timelineRows = normalizeComponentList(row.timeline).map((r) => ({
    step: Number(r.step ?? 0),
    title: String(r.title ?? ""),
    description: String(r.description ?? ""),
  }));

  const documentRows = normalizeComponentList(row.documents).map((r) => ({
    name: String(r.name ?? ""),
    required: Boolean(r.required),
  }));

  const related = mapRelatedSlugs(row.relatedServices);
  const iconImage = resolveMediaToAbsolute(row.iconImage);

  return {
    slug,
    icon: String(row.icon ?? "CircleDot"),
    title: String(row.title ?? ""),
    category: mapServiceCategoryLabel(row.category),
    heroImage: hero,
    description,
    benefits: mapServiceStringList(row.benefits),
    tests: mapServiceStringList(row.tests),
    pricing: pricingRows,
    timeline: timelineRows,
    documents: documentRows,
    relatedSlugs: related,
    ...(iconImage ? { iconImage } : {}),
    seo: mapPageSeo(row.seo),
  };
}

function mapServiceDetailResponse(raw: unknown, fallback: ServiceDetail | undefined): ServiceDetail | undefined {
  const base = IS_MOCK_DATA_ENABLED ? fallback : undefined;
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  return mapServiceDetail(list[0]) ?? base;
}

function formatDateIso(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val.length >= 10 ? val.slice(0, 10) : val;
  return "";
}

function extractRelationIdField(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === "number" || typeof val === "string") return String(val);
  const f = flattenStrapiEntity(val);
  if (!f) return null;
  if (typeof f.documentId === "string") return f.documentId;
  if (f.id != null) return String(f.id);
  return null;
}

function parseJsonStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return asStringArray(val);
  if (typeof val === "string") {
    try {
      const p = JSON.parse(val) as unknown;
      return Array.isArray(p) ? asStringArray(p) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Lines from repeatable `service.simple-line` (text) — preferred over legacy JSON arrays. */
function mapSimpleLineTexts(val: unknown): string[] {
  const lines = normalizeComponentList(val)
    .map((r) => String(r.text ?? "").trim())
    .filter(Boolean);
  if (lines.length > 0) return lines;
  return parseJsonStringArray(val);
}

/** Service `category`: relation to service-category (name) or legacy enumeration string. */
function mapServiceCategoryLabel(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val.trim();
  const f = flattenStrapiEntity(val);
  if (!f) return "";
  return String(f.name ?? "").trim();
}

/** SEO JSON-LD: `text` field (paste JSON) or legacy JSON attribute / object. */
function parseStructuredDataField(val: unknown): unknown {
  if (val == null) return null;
  if (typeof val === "object") return val;
  if (typeof val === "string") {
    const t = val.trim();
    if (!t) return null;
    try {
      return JSON.parse(t) as unknown;
    } catch {
      return null;
    }
  }
  return null;
}

function mapNavItems(raw: unknown, fallback: NavItem[]): NavItem[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  type Row = { id: string; parentId: string | null; label: string; href: string; order: number };
  const rows: Row[] = [];
  for (const row of list) {
    const label = String(row.label ?? "").trim();
    const href = String(row.href ?? "").trim();
    if (!label || !href) continue;
    const id = String(row.documentId ?? row.id ?? "");
    if (!id) continue;
    rows.push({
      id,
      parentId: extractRelationIdField(row.parent),
      label,
      href,
      order: Number(row.order ?? 0),
    });
  }
  if (rows.length === 0) return base;
  rows.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));

  function itemFor(row: Row): NavItem {
    const childRows = rows.filter((c) => c.parentId === row.id).sort((a, b) => a.order - b.order);
    if (childRows.length === 0) return { label: row.label, href: row.href };
    return {
      label: row.label,
      href: row.href,
      children: childRows.map((c) => ({ label: c.label, href: c.href })),
    };
  }

  const roots = rows.filter((r) => !r.parentId);
  if (roots.length === 0) return base;
  return roots.map(itemFor);
}

function mapFooterLinks(raw: unknown, fallback: FooterLink[]): FooterLink[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  const mapped = list
    .map((row) => ({
      label: String(row.label ?? "").trim(),
      href: String(row.href ?? "").trim(),
      order: Number(row.order ?? 0),
    }))
    .filter((r) => r.label && r.href)
    .sort((a, b) => a.order - b.order);
  return mapped.length ? mapped.map(({ label, href }) => ({ label, href })) : base;
}

export interface CertificationBadge {
  /** Stable key from Strapi `documentId` / `id` for list rendering. */
  id: string;
  name: string;
  /** Absolute URL from Strapi Media when set; empty shows text-only badge when `name` is set. */
  logoUrl: string;
  /** Optional; surfaced as hover title / accessible description. */
  shortDescription?: string;
  /** When set, logo or name is wrapped in a link (typically opens verifier in a new tab). */
  verificationUrl?: string;
}

function mapCertificationList(raw: unknown, fallback: CertificationBadge[]): CertificationBadge[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  const rows = list
    .map((row, idx) => {
      const name = String(row.name ?? "").trim();
      const logoUrl = resolveMediaToAbsolute(row.logo) ?? "";
      const shortDescription = String(row.shortDescription ?? "").trim();
      const verificationUrl = String(row.verificationUrl ?? "").trim();
      const id = String(row.documentId ?? row.id ?? `cert-${idx}`);
      return {
        id,
        name,
        logoUrl,
        ...(shortDescription ? { shortDescription } : {}),
        ...(verificationUrl ? { verificationUrl } : {}),
        order: Number(row.order ?? 0),
      };
    })
    .filter((r) => r.name || r.logoUrl || r.shortDescription || r.verificationUrl)
    .sort((a, b) => a.order - b.order);
  return rows.length
    ? rows.map(({ id, name, logoUrl, shortDescription, verificationUrl }) => ({
        id,
        name,
        logoUrl,
        ...(shortDescription ? { shortDescription } : {}),
        ...(verificationUrl ? { verificationUrl } : {}),
      }))
    : base;
}

function mapGalleryImages(raw: unknown, fallback: { src: string; alt: string }[]): { src: string; alt: string }[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  const out: { src: string; alt: string }[] = [];
  for (const row of list.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))) {
    const src = resolveMediaToAbsolute(row.image) ?? "";
    const alt = String(row.alt ?? "");
    if (src) out.push({ src, alt });
  }
  return out.length ? out : base;
}

function mapStatItems(raw: unknown, fallback: StatItem[]): StatItem[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  const rows = list
    .map((row) => ({
      label: String(row.label ?? ""),
      value: Number(row.value ?? 0),
      suffix: String(row.suffix ?? ""),
      order: Number(row.order ?? 0),
    }))
    .sort((a, b) => a.order - b.order);
  return rows.every((r) => r.label) ? rows.map(({ label, value, suffix }) => ({ label, value, suffix })) : base;
}

function mapTestimonialItems(raw: unknown, fallback: Testimonial[]): Testimonial[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  const rows = list
    .map((row) => ({
      name: String(row.name ?? ""),
      photo: resolveMediaToAbsolute(row.photo) ?? "",
      rating: Math.min(5, Math.max(1, Number(row.rating ?? 5))),
      quote: String(row.quote ?? ""),
      order: Number(row.order ?? 0),
    }))
    .filter((r) => r.name && r.quote)
    .sort((a, b) => a.order - b.order);
  return rows.length ? rows.map(({ name, photo, rating, quote }) => ({ name, photo, rating, quote })) : base;
}

function mapFitnessCriteriaList(raw: unknown, fallback: FitnessCriteria[]): FitnessCriteria[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  const out: FitnessCriteria[] = [];
  for (const row of list) {
    const category = String(row.category ?? "");
    const description = String(row.description ?? "");
    const items = mapSimpleLineTexts(row.itemLines ?? row.items);
    if (category && description && items.length) out.push({ category, description, items });
  }
  return out.length ? out : base;
}

function mapEquipmentItems(raw: unknown, fallback: EquipmentItem[]): EquipmentItem[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  const out: EquipmentItem[] = [];
  for (const row of list) {
    const slNo = String(row.slNo ?? "");
    const name = String(row.name ?? "");
    const model = String(row.model ?? "");
    const qty = String(row.qty ?? "");
    if (!name) continue;
    const image = resolveMediaToAbsolute(row.image);
    out.push({
      slNo,
      name,
      model,
      qty,
      origin: row.origin != null ? String(row.origin) : undefined,
      status: row.status != null ? String(row.status) : undefined,
      ...(image ? { image } : {}),
    });
  }
  return out.length ? out : base;
}

function mapServicePackagesList(raw: unknown, fallback: ServicePackage[]): ServicePackage[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  const rows = list
    .map((row) => ({
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      features: mapSimpleLineTexts(row.featureLines ?? row.features),
      pricing: String(row.pricing ?? ""),
      order: Number(row.order ?? 0),
    }))
    .filter((r) => r.title && r.description)
    .sort((a, b) => a.order - b.order);
  return rows.length
    ? rows.map(({ title, description, features, pricing }) => ({ title, description, features, pricing }))
    : base;
}

function mapFAQItems(raw: unknown, fallback: FAQItem[]): FAQItem[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  const rows = list
    .map((row) => ({
      question: String(row.question ?? ""),
      answer: String(row.answer ?? ""),
      order: Number(row.order ?? 0),
    }))
    .filter((r) => r.question && r.answer)
    .sort((a, b) => a.order - b.order);
  return rows.length ? rows.map(({ question, answer }) => ({ question, answer })) : base;
}

const FAQ_MOCK_ALL: FAQItem[] = [...homeFAQs, ...defaultFAQs];

function faqFallbackForPage(page: string): FAQItem[] {
  if (page === "home") return homeFAQs;
  if (page === "services") return defaultFAQs;
  return [];
}

function mapCountryFlagList(raw: unknown, fallback: CountryFlag[]): CountryFlag[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  const rows = list
    .map((row) => ({
      name: String(row.name ?? "").trim(),
      flag: (resolveMediaToAbsolute(row.flag) ?? String(row.flag ?? "").trim()) || "",
      order: Number(row.order ?? 0),
    }))
    .filter((r) => r.name && r.flag)
    .sort((a, b) => a.order - b.order);
  return rows.length ? rows.map(({ name, flag }) => ({ name, flag })) : base;
}

/** Home region-highlights strip; `null` = hide whole section (missing field or unpublished). */
export interface RegionHighlightsSectionBanner {
  bannerImageUrl: string;
  bannerTitle: string;
  bannerDescription: string;
}

const REGION_HIGHLIGHTS_SECTION_POPULATE = [
  "populate[bannerImage][fields][0]=url",
  "populate[bannerImage][fields][1]=name",
  "populate[bannerImage][fields][2]=alternativeText",
].join("&");

function mapRegionHighlightsSection(raw: unknown): RegionHighlightsSectionBanner | null {
  const list = unwrapStrapiCollection(raw);
  const row = list[0];
  if (!row) return null;
  const url = resolveMediaToAbsolute(row.bannerImage) ?? "";
  const title = String(row.bannerTitle ?? "").trim();
  const description = String(row.bannerDescription ?? "").trim();
  if (!url || !title || !description) return null;
  return { bannerImageUrl: url, bannerTitle: title, bannerDescription: description };
}

function mapCountryGuidelineList(raw: unknown, fallback: CountryGuideline[]): CountryGuideline[] {
  const base = IS_MOCK_DATA_ENABLED ? fallback : [];
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return base;
  const sorted = [...list].sort(
    (a, b) =>
      normalizePriority(a.priority) - normalizePriority(b.priority) ||
      String(a.name ?? "").localeCompare(String(b.name ?? ""))
  );
  const out: CountryGuideline[] = [];
  for (const row of sorted) {
    const countryId = String(row.countryId ?? "").trim();
    if (!countryId) continue;
    const flagUrl =
      resolveMediaToAbsolute(row.flag) ?? String(row.flag ?? "").trim();
    out.push({
      id: countryId,
      name: String(row.name ?? ""),
      flag: flagUrl,
      details:
        strapiRichOrTextToMarkdown(row.details) ||
        String(row.details ?? row.processingTime ?? "").trim(),
      marketingPoint1: String(row.marketingPoint1 ?? "").trim(),
      marketingPoint2: String(row.marketingPoint2 ?? row.approvalNote ?? "").trim(),
      expertTip: String(row.expertTip ?? ""),
      mandatoryTests: String(row.mandatoryTests ?? ""),
      rejectionCriteria: String(row.rejectionCriteria ?? ""),
      specialRules: String(row.specialRules ?? ""),
      visaCategories: String(row.visaCategories ?? ""),
    });
  }
  return out.length ? out : base;
}

function mapPostCategoryLabel(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val.trim();
  const f = flattenStrapiEntity(val);
  if (!f) return "";
  return String(f.name ?? "").trim();
}

export interface PostAuthor {
  name: string;
  slug: string;
  avatarUrl?: string;
}

function mapPostAuthor(val: unknown): PostAuthor | undefined {
  const f = flattenStrapiEntity(val);
  if (!f) return undefined;
  const name = String(f.name ?? "").trim();
  const slug = String(f.slug ?? "").trim();
  if (!name) return undefined;
  const avatarUrl = resolveMediaToAbsolute(f.avatar) ?? undefined;
  return { name, slug, ...(avatarUrl ? { avatarUrl } : {}) };
}

function estimateReadMinutesFromContent(content: unknown): number | undefined {
  const plain = richtextToPlainString(content) || String(content ?? "");
  const words = plain.split(/\s+/).filter(Boolean).length;
  if (!words) return undefined;
  return Math.max(1, Math.round(words / 200));
}

function mapBlogArticleRow(row: Record<string, unknown>): BlogArticle | undefined {
  const slug = String(row.slug ?? "").trim();
  if (!slug) return undefined;
  const img = resolveMediaToAbsolute(row.image) ?? "";
  const category = mapPostCategoryLabel(row.postCategory ?? row.category);
  const author = mapPostAuthor(row.author);
  const readMinutes = estimateReadMinutesFromContent(row.content);
  return {
    slug,
    title: String(row.title ?? ""),
    excerpt: String(row.excerpt ?? ""),
    image: img,
    date: formatDateIso(row.date),
    category,
    isFeatured: Boolean(row.isFeatured),
    commentsOpen: row.commentsOpen !== false,
    ...(author ? { author } : {}),
    ...(readMinutes != null ? { readMinutes } : {}),
    content: richtextToPlainString(row.content) || String(row.content ?? ""),
    seo: mapPageSeo(row.seo),
  };
}

function mapBlogArticles(raw: unknown): BlogArticle[] {
  return unwrapStrapiCollection(raw)
    .map((row) => mapBlogArticleRow(row))
    .filter(Boolean) as BlogArticle[];
}

function mapNewsPostRow(row: Record<string, unknown>): NewsPost | undefined {
  const slug = String(row.slug ?? "").trim();
  if (!slug) return undefined;
  const id = String(row.documentId ?? row.id ?? slug);
  const img = resolveMediaToAbsolute(row.image) ?? "";
  const category = mapPostCategoryLabel(row.postCategory ?? row.category);
  const author = mapPostAuthor(row.author);
  const readMinutes = estimateReadMinutesFromContent(row.content);
  return {
    id,
    slug,
    title: String(row.title ?? ""),
    excerpt: String(row.excerpt ?? ""),
    image: img,
    date: formatDateIso(row.date),
    category,
    isFeatured: Boolean(row.isFeatured),
    commentsOpen: row.commentsOpen !== false,
    ...(author ? { author } : {}),
    ...(readMinutes != null ? { readMinutes } : {}),
    content: richtextToPlainString(row.content) || String(row.content ?? ""),
    seo: mapPageSeo(row.seo),
  };
}

function mapNewsPosts(raw: unknown): NewsPost[] {
  return unwrapStrapiCollection(raw)
    .map((row) => mapNewsPostRow(row))
    .filter(Boolean) as NewsPost[];
}

/**
 * Fetch `/api/{endpoint}` and return `data`, optionally normalizing Strapi v4/v5
 * shapes and resolving media URLs (Sections 7–8).
 */
async function strapiGet<T>(endpoint: string, fallback: T): Promise<T>;
async function strapiGet<T>(endpoint: string, fallback: T, normalize: (raw: unknown) => T): Promise<T>;
async function strapiGet<T>(endpoint: string, fallback: T, normalize?: (raw: unknown) => T): Promise<T> {
  if (!STRAPI_BASE_URL) {
    if (IS_MOCK_DATA_ENABLED) return fallback;
    if (normalize) return normalize(null);
    return fallback;
  }

  try {
    const headers: HeadersInit = STRAPI_API_KEY ? { Authorization: `Bearer ${STRAPI_API_KEY}` } : {};
    const res = await fetch(`${STRAPI_BASE_URL}/api/${endpoint}`, {
      cache: "no-store",
      headers,
    });
    if (!res.ok) throw new Error(`Strapi ${res.status}`);
    const json: StrapiResponse<unknown> = await res.json();
    const raw = json.data;
    if (normalize) return normalize(raw);
    return raw as T;
  } catch (err) {
    if (IS_MOCK_DATA_ENABLED) {
      console.warn(`[api] Strapi unavailable, using mock data for ${endpoint}`, err);
      return fallback;
    }
    console.warn(`[api] Strapi request failed for ${endpoint} (VITE_MOCK_DATA is off; returning empty shape)`, err);
    if (normalize) return normalize(null);
    return fallback;
  }
}

// ── Site Config (Global settings: logo, site name, contact info, etc.) ──
export interface SiteConfig {
  siteName: string;
  tagline: string;
  logo: string;
  /** Optional logo for dark footer; empty → show `siteName` as text. */
  footerLogo: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  googleMapsEmbed: string;
  socialLinks: { facebook?: string; instagram?: string; linkedin?: string; twitter?: string; youtube?: string };
  /** When false, hide `/blog` in nav and gate the route. Default true if absent in Strapi. */
  showBlogSection: boolean;
  /** When false, hide `/news` in nav and gate the route. Default true if absent in Strapi. */
  showNewsSection: boolean;
  /** Public comment form + list require this true (and per-post `commentsOpen`). */
  commentsEnabled: boolean;
  /** Optional inbox for contact-form notifications; if empty, **Email** is used. */
  contactFormToEmail: string;
  /** When true (default), send the visitor a confirmation email if SMTP is configured on the server. */
  contactFormSendConfirmation: boolean;
  /** Optional inbox for booking notifications; falls back to **contactFormToEmail** then **email**. */
  bookingFormToEmail: string;
  /** When true (default), send the patient a booking-request confirmation when SMTP is configured. */
  bookingFormSendConfirmation: boolean;
  /** Global defaults for `<title>`, meta description, OG/Twitter, JSON-LD. */
  defaultSeo?: PageSeo;
  /** Paragraph under tagline in footer column 1 (optional). */
  footerBrandExtra?: string;
  /** When non-empty, replaces legacy quick/services/help link columns. */
  footerColumns?: FooterColumnConfig[];
  footerCertStripTitle?: string;
  footerPrivacyLinkLabel?: string;
  /** Appended after site name in copyright (e.g. `, Dhaka. All rights reserved.`). */
  footerCopyrightExtra?: string;
  footerMapPlaceholderLabel?: string;
  /** When `footerColumns` is empty, headings/copy for legacy link columns. */
  footerLegacyQuickTitle?: string;
  footerLegacyServicesTitle?: string;
  footerLegacyHelpTitle?: string;
  footerLegacyHelpBody?: string;
  quickContactSectionTitle?: string;
  quickContactSectionBody?: string;
  quickContactFormHeading?: string;
  quickContactSuccessHeading?: string;
  quickContactSuccessBody?: string;
  quickContactIframeTitle?: string;
  /** Home “trust” row — left column (Medilo-style intro). */
  homeTrustIntroEyebrow?: string;
  homeTrustIntroHeading?: string;
  homeTrustIntroBody?: string;
  homeTrustIntroCtaLabel?: string;
  homeTrustIntroCtaHref?: string;
  /** Home “trust” row — right column headings (stats come from `stats` collection). */
  homeTrustStatsEyebrow?: string;
  homeTrustStatsHeading?: string;
  /** Home services carousel — section header copy. */
  homeServicesEyebrow?: string;
  homeServicesHeading?: string;
  homeServicesSubheading?: string;
  /** Raw `<script>` tags from Site Config; when set, the chat widget is injected on every page. */
  chatbotScript?: string;
}

export const defaultSiteConfig: SiteConfig = {
  siteName: "Unicare Medical Services",
  tagline: "GCC Approved Medical Center",
  logo: "https://unicaremedicalbd.co/assets/img/logo_unicare.png",
  footerLogo: "",
  phone: "+88 02 48316027",
  email: "unicaremedicalbd@gmail.com",
  address: "13/1, New Eskaton Road (2nd Floor), Moghbazar, Dhaka",
  workingHours: "Sat–Thu: 8:00 AM – 8:00 PM",
  googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3652.0!2d90.4!3d23.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDQ1JzAwLjAiTiA5MMKwMjQnMDAuMCJF!5e0!3m2!1sen!2sbd!4v1",
  socialLinks: { facebook: "https://facebook.com", instagram: "https://instagram.com", linkedin: "https://linkedin.com" },
  showBlogSection: true,
  showNewsSection: true,
  commentsEnabled: false,
  contactFormToEmail: "",
  contactFormSendConfirmation: true,
  bookingFormToEmail: "",
  bookingFormSendConfirmation: true,
  footerBrandExtra:
    "GCC approved medical center providing comprehensive health screening and certification services in Dhaka, Bangladesh.",
  footerColumns: [],
  footerCertStripTitle: "Approved & Certified By",
  footerPrivacyLinkLabel: "Privacy Policy",
  footerCopyrightExtra: ", Dhaka. All rights reserved.",
  footerMapPlaceholderLabel: "Map Placeholder",
  footerLegacyQuickTitle: "Quick Navigation",
  footerLegacyServicesTitle: "Our Services",
  footerLegacyHelpTitle: "Help Desk",
  footerLegacyHelpBody: "Need assistance? Our help desk is available during working hours.",
  quickContactSectionTitle: "Get In Touch",
  quickContactSectionBody:
    "Have questions? Reach out to us directly or send a quick message. Submissions are saved for staff and can trigger email when the server is configured.",
  quickContactFormHeading: "Send a Message",
  quickContactSuccessHeading: "Message Sent!",
  quickContactSuccessBody: "We'll get back to you within 24 hours.",
  quickContactIframeTitle: "Clinic location",
  homeTrustIntroEyebrow: "About clinic",
  homeTrustIntroHeading: "Why patients choose our center",
  homeTrustIntroBody:
    "GCC-approved workflows, experienced clinicians, and dependable reporting for visa medicals — organized around your schedule and peace of mind.",
  homeTrustIntroCtaLabel: "Read more",
  homeTrustIntroCtaHref: "/about",
  homeTrustStatsEyebrow: "Clinic skills",
  homeTrustStatsHeading: "Our specialisations",
  homeServicesEyebrow: "Clinical services",
  homeServicesHeading: "Imaging, labs & visa medicals",
  homeServicesSubheading:
    "End-to-end pathways — specimen handling, imaging, review, and documentation for overseas clearance.",
  chatbotScript: "",
};

/** Neutral layout shell when `VITE_MOCK_DATA=No` and Strapi fields are empty or unreachable. */
export const emptySiteConfig: SiteConfig = {
  siteName: "",
  tagline: "",
  logo: "",
  footerLogo: "",
  phone: "",
  email: "",
  address: "",
  workingHours: "",
  googleMapsEmbed: "",
  socialLinks: {},
  showBlogSection: false,
  showNewsSection: false,
  commentsEnabled: false,
  contactFormToEmail: "",
  contactFormSendConfirmation: false,
  bookingFormToEmail: "",
  bookingFormSendConfirmation: false,
  footerBrandExtra: "",
  footerColumns: [],
  footerCertStripTitle: "",
  footerPrivacyLinkLabel: "",
  footerCopyrightExtra: "",
  footerMapPlaceholderLabel: "",
  footerLegacyQuickTitle: "",
  footerLegacyServicesTitle: "",
  footerLegacyHelpTitle: "",
  footerLegacyHelpBody: "",
  quickContactSectionTitle: "",
  quickContactSectionBody: "",
  quickContactFormHeading: "",
  quickContactSuccessHeading: "",
  quickContactSuccessBody: "",
  quickContactIframeTitle: "",
  homeTrustIntroEyebrow: "",
  homeTrustIntroHeading: "",
  homeTrustIntroBody: "",
  homeTrustIntroCtaLabel: "",
  homeTrustIntroCtaHref: "",
  homeTrustStatsEyebrow: "",
  homeTrustStatsHeading: "",
  homeServicesEyebrow: "",
  homeServicesHeading: "",
  homeServicesSubheading: "",
  chatbotScript: "",
};

/** Strapi v5: `populate=*` combined with nested `populate[footerColumns]…` / `populate[defaultSeo]…` drops top-level `logo`; use explicit populates only. */
const SITE_CONFIG_POPULATE = [
  "populate[logo][fields][0]=url",
  "populate[logo][fields][1]=alternativeText",
  "populate[footerLogo][fields][0]=url",
  "populate[footerLogo][fields][1]=alternativeText",
  "populate[footerColumns][populate][links]=*",
  "populate[defaultSeo][populate][openGraphImage][fields][0]=url",
  "populate[defaultSeo][populate][openGraphImage][fields][1]=alternativeText",
].join("&");

export const siteConfigApi = {
  get: () => strapiGet(`site-config?${SITE_CONFIG_POPULATE}`, defaultSiteConfig, (raw) => mapSiteConfig(raw, defaultSiteConfig)),
};

// ── Navigation ──
export const navigationApi = {
  getAll: () =>
    strapiGet<NavItem[]>("navigations?populate=*&sort=order:asc", defaultNavItems, (raw) => mapNavItems(raw, defaultNavItems)),
};

// ── Hero Sections ──
export interface HeroSlide {
  src: string;
  alt: string;
  /** Per-slide headline (Strapi `hero.slide`); falls back to hero title in UI when absent. */
  title?: string;
  /** Per-slide body (Strapi `hero.slide`); falls back to hero subtitle in UI when absent. */
  text?: string;
  /** Per-slide CTAs from Strapi `hero.slide.ctaButtons`; unlimited. If empty, UI uses hero-level `ctaButtons` fallback. */
  ctaButtons?: { label: string; href: string; variant: "primary" | "secondary" }[];
}

export interface PageHero {
  page: string;
  title: string;
  subtitle: string;
  slides: HeroSlide[];
  /** Fallback CTAs when a slide (or promo video) has none; prefer per-slide `HeroSlide.ctaButtons`. */
  ctaButtons?: { label: string; href: string; variant: "primary" | "secondary" }[];
  /** Optional background / loop video (Strapi `promoVideo`). */
  promoVideoUrl?: string;
  seo?: PageSeo;
}

/** Strapi v5: `populate=*` is only one level — media inside `slideItems` must be populated explicitly. */
const HERO_POPULATE = [
  "populate[slideItems][populate][image][fields][0]=url",
  "populate[slideItems][populate][image][fields][1]=name",
  "populate[slideItems][populate][image][fields][2]=alternativeText",
  "populate[slideItems][populate][ctaButtons]=true",
  "populate[ctaButtons]=true",
  "populate[promoVideo]=true",
  "populate[seo][populate][openGraphImage][fields][0]=url",
  "populate[seo][populate][openGraphImage][fields][1]=alternativeText",
].join("&");

export const heroApi = {
  getByPage: (page: string, fallback: PageHero) =>
    strapiGet(
      `heroes?filters[page][$eq]=${encodeURIComponent(page)}&${HERO_POPULATE}`,
      fallback,
      (raw) => mapPageHero(raw, fallback)
    ),
};

const SERVICE_POPULATE = "populate=*";

export interface ServiceCategoryEntry {
  name: string;
  slug: string;
  sortOrder: number;
}

function mapServiceCategoryEntries(raw: unknown): ServiceCategoryEntry[] {
  const list = unwrapStrapiCollection(raw);
  if (list.length === 0) return [];
  return list
    .map((row) => ({
      name: String(row.name ?? "").trim(),
      slug: String(row.slug ?? "").trim(),
      sortOrder: Number(row.sortOrder ?? 0),
    }))
    .filter((r) => r.name)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

/** Published service categories for filter tabs (order from `sortOrder`). */
export const serviceCategoriesApi = {
  getAll: () =>
    strapiGet<ServiceCategoryEntry[]>(
      "service-categories?sort=sortOrder:asc",
      [],
      (raw) => mapServiceCategoryEntries(raw)
    ),
};

// ── Services ──
export const servicesApi = {
  getAll: () =>
    strapiGet(`services?${SERVICE_POPULATE}&sort=priority:asc`, defaultServices, (raw) => mapServiceCards(raw, defaultServices)),
  getBySlug: (slug: string) =>
    strapiGet(
      `services?filters[slug][$eq]=${encodeURIComponent(slug)}&${SERVICE_POPULATE}`,
      defaultServiceDetails[slug],
      (raw) => mapServiceDetailResponse(raw, defaultServiceDetails[slug])
    ),
};

// ── Blog ──
export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  isFeatured?: boolean;
  commentsOpen?: boolean;
  author?: PostAuthor;
  /** Approximate reading time from body length (~200 wpm). */
  readMinutes?: number;
  content?: string;
  seo?: PageSeo;
}

const ARTICLE_POPULATE = "populate=*";

export const blogApi = {
  getAll: (mockData: BlogArticle[]) =>
    strapiGet<BlogArticle[]>(`articles?${ARTICLE_POPULATE}&sort=date:desc`, mockData, (raw) => {
      const m = mapBlogArticles(raw);
      if (m.length > 0) return m;
      return IS_MOCK_DATA_ENABLED ? mockData : [];
    }),
  getBySlug: (slug: string, mockData: BlogArticle[]) => {
    const fb = mockData.find((a) => a.slug === slug);
    return strapiGet<BlogArticle | undefined>(
      `articles?filters[slug][$eq]=${encodeURIComponent(slug)}&${ARTICLE_POPULATE}`,
      fb,
      (raw) => {
        const found = mapBlogArticles(raw)[0];
        if (found) return found;
        return IS_MOCK_DATA_ENABLED ? fb : undefined;
      }
    );
  },
};

// ── News ──
export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  category: string;
  isFeatured?: boolean;
  commentsOpen?: boolean;
  author?: PostAuthor;
  readMinutes?: number;
  content?: string;
  seo?: PageSeo;
}

const NEWS_POST_POPULATE = "populate=*";

export const newsApi = {
  getAll: (mockData: NewsPost[]) =>
    strapiGet<NewsPost[]>(`news-posts?${NEWS_POST_POPULATE}&sort=date:desc`, mockData, (raw) => {
      const m = mapNewsPosts(raw);
      if (m.length > 0) return m;
      return IS_MOCK_DATA_ENABLED ? mockData : [];
    }),
  getBySlug: (slug: string, mockData: NewsPost[]) => {
    const fb = mockData.find((n) => n.slug === slug);
    return strapiGet<NewsPost | undefined>(
      `news-posts?filters[slug][$eq]=${encodeURIComponent(slug)}&${NEWS_POST_POPULATE}`,
      fb,
      (raw) => {
        const found = mapNewsPosts(raw)[0];
        if (found) return found;
        return IS_MOCK_DATA_ENABLED ? fb : undefined;
      }
    );
  },
};

// ── Comments (public read approved + submit) ──
export interface PublicComment {
  documentId: string;
  authorName: string;
  body: string;
  createdAt?: string;
}

function mapPublicCommentList(raw: unknown): PublicComment[] {
  const list = Array.isArray(raw) ? raw : unwrapStrapiCollection(raw);
  const out: PublicComment[] = [];
  for (const row of list) {
    const f = flattenStrapiEntity(row) ?? (row as Record<string, unknown>);
    const authorName = String(f.authorName ?? "").trim();
    const body = String(f.body ?? "").trim();
    if (!authorName || !body) continue;
    out.push({
      documentId: String(f.documentId ?? f.id ?? ""),
      authorName,
      body,
      createdAt: f.createdAt != null ? String(f.createdAt) : undefined,
    });
  }
  return out;
}

export const commentsApi = {
  getApproved: async (postType: "article" | "news-post", targetSlug: string): Promise<PublicComment[]> => {
    if (!STRAPI_BASE_URL) return [];
    try {
      const qs = `postType=${encodeURIComponent(postType)}&targetSlug=${encodeURIComponent(targetSlug)}`;
      const res = await fetch(`${STRAPI_BASE_URL}/api/comments/approved?${qs}`, { cache: "no-store" });
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: unknown };
      return mapPublicCommentList(json.data ?? []);
    } catch {
      return [];
    }
  },
  submit: async (payload: {
    postType: "article" | "news-post";
    targetSlug: string;
    authorName: string;
    authorEmail?: string;
    body: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    if (!STRAPI_BASE_URL) return { ok: false, error: "Strapi not configured" };
    try {
      const res = await fetch(`${STRAPI_BASE_URL}/api/comments/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return { ok: false, error: json.error || res.statusText };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};

// ── Country Guidelines ──
export interface CountryGuideline {
  id: string;
  name: string;
  flag: string;
  details: string;
  marketingPoint1: string;
  marketingPoint2: string;
  expertTip: string;
  mandatoryTests: string;
  rejectionCriteria: string;
  specialRules: string;
  visaCategories: string;
}

export const countryGuidelinesApi = {
  getAll: (mockData: CountryGuideline[]) =>
    strapiGet<CountryGuideline[]>(
      "country-guidelines?populate=*&sort=priority:asc",
      mockData,
      (raw) => mapCountryGuidelineList(raw, mockData)
    ),
};

// ── Country flags (region strip / selector rows) ──
export interface CountryFlag {
  name: string;
  flag: string;
}

export const countryFlagsApi = {
  getAll: (mockData: CountryFlag[]) =>
    strapiGet<CountryFlag[]>("country-flags?populate=*&sort=order:asc", mockData, (raw) => mapCountryFlagList(raw, mockData)),
};

export const regionHighlightsSectionApi = {
  get: () =>
    strapiGet<RegionHighlightsSectionBanner | null>(
      `region-highlights-section?${REGION_HIGHLIGHTS_SECTION_POPULATE}`,
      null,
      (raw) => mapRegionHighlightsSection(raw)
    ),
};

// ── Equipment ──
export const equipmentApi = {
  getAll: () =>
    strapiGet<EquipmentItem[]>("equipment-items?populate=*", defaultEquipment, (raw) => mapEquipmentItems(raw, defaultEquipment)),
};

// ── Fitness Criteria ──
export const fitnessCriteriaApi = {
  getAll: () =>
    strapiGet<FitnessCriteria[]>("fitness-criteria?populate=*", defaultFitnessCriteria, (raw) =>
      mapFitnessCriteriaList(raw, defaultFitnessCriteria)
    ),
};

// ── Stats ──
export const statsApi = {
  getAll: () =>
    strapiGet<StatItem[]>("stats?populate=*&sort=order:asc", defaultStats, (raw) => mapStatItems(raw, defaultStats)),
};

// ── Testimonials ──
export const testimonialsApi = {
  getAll: () =>
    strapiGet<Testimonial[]>("testimonials?populate=*&sort=order:asc", defaultTestimonials, (raw) =>
      mapTestimonialItems(raw, defaultTestimonials)
    ),
};

// ── Service Packages ──
export const servicePackagesApi = {
  getAll: () =>
    strapiGet<ServicePackage[]>("service-packages?populate=*&sort=order:asc", defaultPackages, (raw) =>
      mapServicePackagesList(raw, defaultPackages)
    ),
};

/** Load linked Hero `page` only (FAQ list does not need full hero payload). */
const FAQ_SITE_PAGE_POPULATE = "populate[sitePage][fields][0]=page";

// ── FAQs: `sitePage` → published Hero (Admin relation picker; Hero `page` = route key) ──
export const faqsApi = {
  /** All FAQs from Strapi. Prefer `getByPage` for list pages. */
  getAll: () =>
    strapiGet<FAQItem[]>(
      `faqs?${FAQ_SITE_PAGE_POPULATE}&sort=order:asc`,
      FAQ_MOCK_ALL,
      (raw) => mapFAQItems(raw, FAQ_MOCK_ALL)
    ),
  /** FAQs for one route; matches Hero `page` via relation `sitePage`. */
  getByPage: (page: string) => {
    const fb = faqFallbackForPage(page);
    return strapiGet<FAQItem[]>(
      `faqs?filters[sitePage][page][$eq]=${encodeURIComponent(page)}&${FAQ_SITE_PAGE_POPULATE}&sort=order:asc`,
      fb,
      (raw) => mapFAQItems(raw, fb)
    );
  },
};

export type ContactFormKey = "contact_page" | "home_quick";

export const contactSubmissionsApi = {
  submit: async (payload: {
    formKey: ContactFormKey;
    name: string;
    email: string;
    phone?: string;
    serviceInterest?: string;
    message: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    if (!STRAPI_BASE_URL) return { ok: false, error: "Strapi is not configured." };
    try {
      const res = await fetch(`${STRAPI_BASE_URL}/api/contact-submissions/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) return { ok: false, error: json.error || res.statusText };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};

export const bookingRequestsApi = {
  /** Returns time-slot strings already taken for `date` (YYYY-MM-DD), excluding cancelled bookings. */
  getBookedSlotsForDate: async (date: string): Promise<string[]> => {
    if (!STRAPI_BASE_URL) return [];
    try {
      const q = encodeURIComponent(date);
      const res = await fetch(`${STRAPI_BASE_URL}/api/booking-requests/availability?date=${q}`, {
        cache: "no-store",
      });
      const json = (await res.json().catch(() => ({}))) as { bookedSlots?: string[]; error?: string };
      if (!res.ok) return [];
      return Array.isArray(json.bookedSlots) ? json.bookedSlots : [];
    } catch {
      return [];
    }
  },
  submit: async (payload: {
    patientName: string;
    email?: string;
    phone: string;
    serviceId: string;
    serviceTitle?: string;
    appointmentDate: string;
    timeSlot: string;
  }): Promise<{ ok: boolean; error?: string; conflict?: boolean }> => {
    if (!STRAPI_BASE_URL) return { ok: false, error: "Strapi is not configured." };
    try {
      const res = await fetch(`${STRAPI_BASE_URL}/api/booking-requests/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 409) return { ok: false, error: json.error || "This time slot is no longer available.", conflict: true };
      if (!res.ok) return { ok: false, error: json.error || res.statusText };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};

function parseContentDispositionFilename(header: string | null): string | undefined {
  if (!header) return undefined;
  const m = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(header);
  if (m?.[1]) return decodeURIComponent(m[1].replace(/"/g, "").trim());
  return undefined;
}

export interface StaffUser {
  id: number;
  username: string;
  email: string;
  roleType: string;
}

function unwrapStrapiUserMe(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== "object") return null;
  const j = json as Record<string, unknown>;
  if (j.data && typeof j.data === "object") {
    const d = j.data as Record<string, unknown>;
    const attrs =
      typeof d.attributes === "object" && d.attributes !== null
        ? (d.attributes as Record<string, unknown>)
        : {};
    const id = Number(d.id ?? attrs.id);
    const roleRaw = attrs.role ?? d.role;
    return { id, ...attrs, role: roleRaw };
  }
  return j;
}

function parseRoleType(roleRaw: unknown): string {
  if (roleRaw == null) return "";
  if (typeof roleRaw === "object") {
    const r = roleRaw as Record<string, unknown>;
    if (r.data && typeof r.data === "object") {
      const d = r.data as Record<string, unknown>;
      const attrs =
        typeof d.attributes === "object" && d.attributes !== null
          ? (d.attributes as Record<string, unknown>)
          : {};
      return String(attrs.type ?? d.type ?? "").trim();
    }
    return String(r.type ?? "").trim();
  }
  return "";
}

export const staffAuthApi = {
  loginLocal: async (
    identifier: string,
    password: string,
  ): Promise<{ ok: true; jwt: string } | { ok: false; error: string }> => {
    if (!STRAPI_BASE_URL) return { ok: false, error: "Strapi is not configured." };
    try {
      const res = await fetch(`${STRAPI_BASE_URL}/api/lab-report-files/staff-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const errObj = json.error as Record<string, unknown> | undefined;
        let msg = "Invalid email/username or password.";
        if (typeof errObj?.message === "string") msg = errObj.message;
        else if (Array.isArray(errObj?.message)) {
          const first = (errObj.message as unknown[])[0] as Record<string, unknown> | undefined;
          const inner = first?.messages as unknown[] | undefined;
          const m0 = inner?.[0] as Record<string, unknown> | undefined;
          if (typeof m0?.message === "string") msg = m0.message;
        } else if (typeof json.message === "string") msg = json.message;
        return { ok: false, error: msg };
      }
      const jwt = String(json.jwt ?? "");
      if (!jwt) return { ok: false, error: "Login failed (no token)." };
      return { ok: true, jwt };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  fetchMe: async (jwt: string): Promise<StaffUser | null> => {
    if (!STRAPI_BASE_URL || !jwt) return null;
    try {
      const res = await fetch(`${STRAPI_BASE_URL}/api/users/me?populate=role`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
      });
      if (!res.ok) return null;
      const raw = await res.json();
      const flat = unwrapStrapiUserMe(raw);
      if (!flat) return null;
      const id = Number(flat.id);
      if (!Number.isFinite(id)) return null;
      const roleType = parseRoleType(flat.role);
      return {
        id,
        username: String(flat.username ?? ""),
        email: String(flat.email ?? ""),
        roleType,
      };
    } catch {
      return null;
    }
  },
};

export const labReportFilesApi = {
  /** Staff bulk upload: JWT from Lab staff login; multipart field name must be `files`. */
  uploadOne: async (
    jwt: string,
    payload: { file: File; passportNumber: string; phoneNumber: string },
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!STRAPI_BASE_URL) return { ok: false, error: "Strapi is not configured." };
    const fd = new FormData();
    fd.append("files", payload.file);
    fd.append("passportNumber", payload.passportNumber.trim());
    fd.append("phoneNumber", payload.phoneNumber.trim());
    try {
      const res = await fetch(`${STRAPI_BASE_URL}/api/lab-report-files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt.trim()}` },
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: json.error || "Not authorized. Sign in with a Lab staff account." };
      }
      if (!res.ok) return { ok: false, error: json.error || res.statusText };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  /** Public: verify passport + phone and receive PDF bytes. */
  download: async (
    passportNumber: string,
    phoneNumber: string,
  ): Promise<
    | { ok: true; blob: Blob; filename?: string }
    | { ok: false; notFound: true }
    | { ok: false; error: string }
  > => {
    if (!STRAPI_BASE_URL) return { ok: false, error: "Strapi is not configured." };
    try {
      const res = await fetch(`${STRAPI_BASE_URL}/api/lab-report-files/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passportNumber: passportNumber.trim(), phoneNumber: phoneNumber.trim() }),
      });
      if (res.status === 404) return { ok: false, notFound: true };
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        return { ok: false, error: json.error || res.statusText };
      }
      const blob = await res.blob();
      const filename = parseContentDispositionFilename(res.headers.get("Content-Disposition"));
      return { ok: true, blob, filename };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};

// ── Certifications ──
export const certificationsApi = {
  getAll: () =>
    strapiGet<CertificationBadge[]>("certifications?populate=*&sort=order:asc", defaultCerts, (raw) =>
      mapCertificationList(raw, defaultCerts)
    ),
};

// ── Footer Links ──
export const footerApi = {
  getQuickLinks: () =>
    strapiGet<FooterLink[]>("footer-quick-links?populate=*&sort=order:asc", defaultQuickLinks, (raw) =>
      mapFooterLinks(raw, defaultQuickLinks)
    ),
  getServiceLinks: () =>
    strapiGet<FooterLink[]>("footer-service-links?populate=*&sort=order:asc", defaultFooterServices, (raw) =>
      mapFooterLinks(raw, defaultFooterServices)
    ),
};

// ── Gallery ──
export const galleryApi = {
  getAll: () =>
    strapiGet<{ src: string; alt: string }[]>("gallery-images?populate=*&sort=order:asc", defaultGallery, (raw) =>
      mapGalleryImages(raw, defaultGallery)
    ),
};

// ── About Page Content ──
export interface AboutPageContent {
  missionTitle: string;
  missionText: string;
  missionImage: string;
  centerTitle: string;
  centerText: string;
  centerImage: string;
  valuesSectionTitle: string;
  values: { img: string; alt: string; title: string; desc: string }[];
  facilityGalleryTitle: string;
  facilityGallerySubtitle: string;
  gallery: { src: string; alt: string }[];
  virtualTourYoutubeUrl?: string;
  seo?: PageSeo;
}

/** Default About page (matches previous static page); use for hero fallback or tests. */
export const defaultAboutPage: AboutPageContent = {
  missionTitle: "Our Mission",
  missionText:
    "At Unicare Medical, our mission is to provide accurate, efficient, and compassionate medical screening services that meet international standards. We are committed to helping individuals achieve their dreams of overseas employment through reliable health certification, while maintaining the highest levels of patient care and clinical excellence.",
  missionImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop",
  centerTitle: "Our Center",
  centerText:
    "Our diagnostic center is supervised by a team of highly qualified specialist doctors ensuring that every medical report is verified with professional clinical oversight. Our medical panel includes Medical Officers (Male & Female), Radiologists, and Consultant Pathologists — all dedicated to maintaining the highest standards of medical practice.",
  centerImage: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&h=400&fit=crop",
  valuesSectionTitle: "Why Choose Us",
  values: [
    {
      img: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=250&fit=crop",
      alt: "Precision diagnostics",
      title: "Precision",
      desc: "Automated systems minimize human error in chemical and biological analysis.",
    },
    {
      img: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&h=250&fit=crop",
      alt: "Fast processing",
      title: "Speed",
      desc: "High-throughput analyzers allow us to process thousands of samples daily.",
    },
    {
      img: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=400&h=250&fit=crop",
      alt: "Reliable results",
      title: "Reliability",
      desc: "Daily QC/Calibration and regular maintenance for consistency.",
    },
  ],
  facilityGalleryTitle: "Facilities & Gallery",
  facilityGallerySubtitle:
    "Our center is designed to provide a clean, organized, and patient-friendly environment.",
  gallery: defaultGallery,
  virtualTourYoutubeUrl: "",
};

const ABOUT_POPULATE = [
  "populate[missionImage]=true",
  "populate[centerImage]=true",
  "populate[values][populate]=img",
  "populate[gallery][populate]=image",
  "populate[seo][populate]=openGraphImage",
].join("&");

export const aboutApi = {
  get: () => strapiGet(`about-page?${ABOUT_POPULATE}`, defaultAboutPage, (raw) => mapAboutPage(raw, defaultAboutPage)),
};

export interface ServiceComparisonRow {
  feature: string;
  physical: boolean | string;
  radiology: boolean | string;
  laboratory: boolean | string;
  vaccination: boolean | string;
}

export interface ServicesPageConfig {
  comparison: ServiceComparisonRow[];
}

export const defaultServicesPageConfig: ServicesPageConfig = {
  comparison: defaultComparisonData,
};

export function getEmptyServicesPageConfig(): ServicesPageConfig {
  return { comparison: [] };
}

function mapServicesPageConfig(raw: unknown, defaults: ServicesPageConfig): ServicesPageConfig {
  const base = IS_MOCK_DATA_ENABLED ? defaults : { comparison: [] as ServiceComparisonRow[] };
  const flat = flattenStrapiEntity(raw);
  if (!flat) return base;

  const rows = normalizeComponentList(flat.comparisonRows)
    .map((r) => ({
      feature: String(r.feature ?? "").trim(),
      physical: typeof r.physical === "boolean" ? r.physical : String(r.physical ?? "").trim(),
      radiology: typeof r.radiology === "boolean" ? r.radiology : String(r.radiology ?? "").trim(),
      laboratory: typeof r.laboratory === "boolean" ? r.laboratory : String(r.laboratory ?? "").trim(),
      vaccination: typeof r.vaccination === "boolean" ? r.vaccination : String(r.vaccination ?? "").trim(),
    }))
    .filter((r) => r.feature);

  return {
    comparison: rows.length > 0 ? rows : base.comparison,
  };
}

export const servicesPageApi = {
  get: () => strapiGet("services-page?populate=comparisonRows", defaultServicesPageConfig, (raw) => mapServicesPageConfig(raw, defaultServicesPageConfig)),
};

export interface BookingPageConfig {
  timeSlots: string[];
  seo?: PageSeo;
}

export function getEmptyBookingPageConfig(): BookingPageConfig {
  return { timeSlots: [] };
}

export const defaultBookingPageConfig: BookingPageConfig = {
  timeSlots: [
    "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM", "05:00 PM",
  ],
};

function mapBookingPageConfig(raw: unknown, defaults: BookingPageConfig): BookingPageConfig {
  const base = IS_MOCK_DATA_ENABLED ? defaults : { timeSlots: [] as string[] };
  const flat = flattenStrapiEntity(raw);
  if (!flat) return base;
  const fromLines = mapSimpleLineTexts(flat.timeSlotLines);
  const legacySlots = Array.isArray(flat.timeSlots)
    ? flat.timeSlots.map((x) => String(x).trim()).filter(Boolean)
    : [];
  const timeSlots =
    fromLines.length > 0 ? fromLines : legacySlots.length > 0 ? legacySlots : base.timeSlots;
  return {
    timeSlots: timeSlots.length > 0 ? timeSlots : base.timeSlots,
    seo: mapPageSeo(flat.seo) ?? base.seo,
  };
}

export const bookingPageApi = {
  get: () =>
    strapiGet(
      "booking-page?populate[timeSlotLines]=true&populate[seo][populate]=openGraphImage",
      defaultBookingPageConfig,
      (raw) => mapBookingPageConfig(raw, defaultBookingPageConfig)
    ),
};

export interface ReportPageConfig {
  samplePatientName: string;
  sampleReportDate: string;
  sampleStatus: string;
  supportPhone: string;
  seo?: PageSeo;
}

export function getEmptyReportPageConfig(): ReportPageConfig {
  return {
    samplePatientName: "",
    sampleReportDate: "",
    sampleStatus: "",
    supportPhone: "",
  };
}

export const defaultReportPageConfig: ReportPageConfig = {
  samplePatientName: "Mohammad Rahman",
  sampleReportDate: "April 10, 2026",
  sampleStatus: "Completed",
  supportPhone: "+88 02 48316027",
};

function mapReportPageConfig(raw: unknown, defaults: ReportPageConfig): ReportPageConfig {
  const base = IS_MOCK_DATA_ENABLED
    ? defaults
    : {
        samplePatientName: "",
        sampleReportDate: "",
        sampleStatus: "",
        supportPhone: "",
      };
  const flat = flattenStrapiEntity(raw);
  if (!flat) return base;
  return {
    samplePatientName: String(flat.samplePatientName ?? base.samplePatientName),
    sampleReportDate: String(flat.sampleReportDate ?? base.sampleReportDate),
    sampleStatus: String(flat.sampleStatus ?? base.sampleStatus),
    supportPhone: String(flat.supportPhone ?? base.supportPhone),
    seo: mapPageSeo(flat.seo) ?? base.seo,
  };
}

export const reportPageApi = {
  get: () => strapiGet("report-page?populate[seo][populate]=openGraphImage", defaultReportPageConfig, (raw) => mapReportPageConfig(raw, defaultReportPageConfig)),
};

export interface ScreeningProcessStep {
  title: string;
  description: string;
  estimatedTime: string;
  details: string[];
}

export interface ScreeningProcessPageConfig {
  checklistTitle: string;
  checklistDescription: string;
  totalTimeLabel: string;
  steps: ScreeningProcessStep[];
  seo?: PageSeo;
}

export function getEmptyScreeningProcessPageConfig(): ScreeningProcessPageConfig {
  return {
    checklistTitle: "",
    checklistDescription: "",
    totalTimeLabel: "",
    steps: [],
  };
}

export const defaultScreeningProcessPageConfig: ScreeningProcessPageConfig = {
  checklistTitle: "Preparation Checklist",
  checklistDescription: "Download our complete preparation guide before your visit.",
  totalTimeLabel: "Total Estimated Time: 2–3 hours (report in 24–48 hours)",
  steps: [
    {
      title: "Registration & Document Check",
      description: "Present your documents at the reception desk for verification and registration.",
      estimatedTime: "15–20 min",
      details: [
        "Bring original passport and 2 passport-size photos",
        "Submit GAMCA slip or token number",
        "Complete patient registration form",
        "Receive your medical file and queue number",
      ],
    },
    {
      title: "Sample Collection",
      description: "Blood and urine samples are collected by certified laboratory technicians.",
      estimatedTime: "10–15 min",
      details: [
        "Ensure 8–12 hours fasting for accurate blood work",
        "Blood drawn via venipuncture by trained phlebotomist",
        "Urine sample collected in sterile container",
        "Samples labeled and sent to automated analyzers",
      ],
    },
  ],
};

function mapScreeningProcessPageConfig(raw: unknown, defaults: ScreeningProcessPageConfig): ScreeningProcessPageConfig {
  const base = IS_MOCK_DATA_ENABLED
    ? defaults
    : {
        checklistTitle: "",
        checklistDescription: "",
        totalTimeLabel: "",
        steps: [] as ScreeningProcessStep[],
      };
  const flat = flattenStrapiEntity(raw);
  if (!flat) return base;
  const stepRows = normalizeComponentList(flat.steps)
    .map((r) => {
      const fromLines = mapSimpleLineTexts(r.detailLines);
      const legacyDetails = Array.isArray(r.details)
        ? r.details.map((x) => String(x).trim()).filter(Boolean)
        : [];
      const details = fromLines.length > 0 ? fromLines : legacyDetails;
      return {
        title: String(r.title ?? "").trim(),
        description: String(r.description ?? "").trim(),
        estimatedTime: String(r.estimatedTime ?? "").trim(),
        details,
      };
    })
    .filter((s) => s.title);

  return {
    checklistTitle: String(flat.checklistTitle ?? base.checklistTitle),
    checklistDescription: String(flat.checklistDescription ?? base.checklistDescription),
    totalTimeLabel: String(flat.totalTimeLabel ?? base.totalTimeLabel),
    steps: stepRows.length > 0 ? stepRows : base.steps,
    seo: mapPageSeo(flat.seo) ?? base.seo,
  };
}

export const screeningProcessPageApi = {
  get: () =>
    strapiGet(
      "screening-process-page?populate[steps][populate]=detailLines&populate[seo][populate]=openGraphImage",
      defaultScreeningProcessPageConfig,
      (raw) => mapScreeningProcessPageConfig(raw, defaultScreeningProcessPageConfig)
    ),
};

export interface PrivacyPageConfig {
  title: string;
  /** Intro copy (markdown / rich); shown above sections. */
  intro: string;
  /** Contact block (markdown); shown after sections. */
  contactBlock: string;
  sections: { heading: string; body: string }[];
  seo?: PageSeo;
}

export function getEmptyPrivacyPageConfig(): PrivacyPageConfig {
  return { title: "", intro: "", contactBlock: "", sections: [] };
}

export const defaultPrivacyPageConfig: PrivacyPageConfig = {
  title: "Privacy Policy",
  intro:
    "At Unicare Medical Services, we are committed to protecting the privacy and confidentiality of your personal and medical information.",
  contactBlock:
    "For privacy-related inquiries, contact us at [unicaremedicalbd@gmail.com](mailto:unicaremedicalbd@gmail.com).",
  sections: [
    {
      heading: "Information We Collect",
      body: "We collect personal information necessary for medical screening including name, contact details, passport information, and medical history as required by GCC medical examination standards.",
    },
    {
      heading: "How We Use Your Information",
      body: "Your information is used exclusively for medical examination, report generation, and compliance with GAMCA and GCC health ministry requirements. We do not sell or share your data with third parties.",
    },
    {
      heading: "Data Security",
      body: "We employ industry-standard security measures including encrypted data storage, secure server infrastructure, and strict access controls to protect your medical records.",
    },
  ],
};

function mapPrivacyPageConfig(raw: unknown, defaults: PrivacyPageConfig): PrivacyPageConfig {
  const base = IS_MOCK_DATA_ENABLED
    ? defaults
    : { title: "", intro: "", contactBlock: "", sections: [] as { heading: string; body: string }[] };
  const flat = flattenStrapiEntity(raw);
  if (!flat) return base;
  const sections = normalizeComponentList(flat.sections)
    .map((s) => ({ heading: String(s.heading ?? "").trim(), body: String(s.body ?? "").trim() }))
    .filter((s) => s.heading && s.body);
  const intro = strapiRichOrTextToMarkdown(flat.intro) || base.intro;
  const contactBlock = strapiRichOrTextToMarkdown(flat.contactBlock) || base.contactBlock;
  return {
    title: String(flat.title ?? base.title),
    intro,
    contactBlock,
    sections: sections.length > 0 ? sections : base.sections,
    seo: mapPageSeo(flat.seo) ?? base.seo,
  };
}

export const privacyPageApi = {
  get: () =>
    strapiGet(
      "privacy-page?populate=sections&populate[seo][populate][openGraphImage][fields][0]=url&populate[seo][populate][openGraphImage][fields][1]=alternativeText",
      defaultPrivacyPageConfig,
      (raw) => mapPrivacyPageConfig(raw, defaultPrivacyPageConfig)
    ),
};

// ── Fitness page single (disclaimer + SEO) ──
export interface FitnessPageConfig {
  disclaimer: string;
  seo?: PageSeo;
}

export function getEmptyFitnessPageConfig(): FitnessPageConfig {
  return { disclaimer: "" };
}

export const defaultFitnessPageConfig: FitnessPageConfig = {
  disclaimer:
    "**Note:** These are standard GCC fitness criteria. Specific requirements may vary by destination country. Please consult our medical team for country-specific guidance.",
};

function mapFitnessPageConfig(raw: unknown, defaults: FitnessPageConfig): FitnessPageConfig {
  const base = IS_MOCK_DATA_ENABLED ? defaults : getEmptyFitnessPageConfig();
  const flat = flattenStrapiEntity(raw);
  if (!flat) return base;
  const disclaimer = strapiRichOrTextToMarkdown(flat.disclaimer) || base.disclaimer;
  return {
    disclaimer,
    seo: mapPageSeo(flat.seo) ?? base.seo,
  };
}

export const fitnessPageApi = {
  get: () =>
    strapiGet(
      "fitness-page?populate[seo][populate][openGraphImage][fields][0]=url&populate[seo][populate][openGraphImage][fields][1]=alternativeText",
      defaultFitnessPageConfig,
      (raw) => mapFitnessPageConfig(raw, defaultFitnessPageConfig)
    ),
};

// ── Unified API ───────────────────────────────────
export const api = {
  siteConfig: siteConfigApi,
  navigation: navigationApi,
  hero: heroApi,
  services: servicesApi,
  serviceCategories: serviceCategoriesApi,
  blog: blogApi,
  news: newsApi,
  countryGuidelines: countryGuidelinesApi,
  countryFlags: countryFlagsApi,
  regionHighlightsSection: regionHighlightsSectionApi,
  equipment: equipmentApi,
  fitnessCriteria: fitnessCriteriaApi,
  stats: statsApi,
  testimonials: testimonialsApi,
  servicePackages: servicePackagesApi,
  faqs: faqsApi,
  certifications: certificationsApi,
  footer: footerApi,
  gallery: galleryApi,
  about: aboutApi,
  servicesPage: servicesPageApi,
  bookingPage: bookingPageApi,
  reportPage: reportPageApi,
  screeningProcessPage: screeningProcessPageApi,
  privacyPage: privacyPageApi,
  fitnessPage: fitnessPageApi,
  comments: commentsApi,
  contactSubmissions: contactSubmissionsApi,
  bookingRequests: bookingRequestsApi,
  labReportFiles: labReportFilesApi,
};
