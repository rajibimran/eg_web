import { Helmet } from "react-helmet-async";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import type { PageSeo } from "@/lib/api";

const SEO_TITLE_SOFT_MAX = 70;
const SEO_DESC_SOFT_MAX = 160;

/** Merge SEO layers: earlier = lower priority; later non-empty fields override. Partial Strapi rows still contribute (e.g. OG image only). */
function mergePageSeoLayers(...layers: (PageSeo | undefined)[]): {
  partial: Partial<PageSeo>;
  noIndex: boolean;
} {
  const partial: Partial<PageSeo> = {};
  let noIndex = false;
  let twitterCard: PageSeo["twitterCard"] | undefined;
  let structuredData: unknown = undefined;

  for (const layer of layers) {
    if (!layer) continue;
    if (layer.noIndex) noIndex = true;
    const t = layer.metaTitle?.trim();
    if (t) partial.metaTitle = t;
    const d = layer.metaDescription?.trim();
    if (d) partial.metaDescription = d;
    const k = layer.metaKeywords?.trim();
    if (k) partial.metaKeywords = k;
    const c = layer.canonicalPath?.trim();
    if (c) partial.canonicalPath = c;
    const og = layer.openGraphImage?.trim();
    if (og) partial.openGraphImage = og;
    const oga = layer.openGraphImageAlt?.trim();
    if (oga) partial.openGraphImageAlt = oga;
    if (layer.twitterCard === "summary" || layer.twitterCard === "summary_large_image") {
      twitterCard = layer.twitterCard;
    }
    if (layer.structuredData !== undefined && layer.structuredData !== null) {
      structuredData = layer.structuredData;
    }
    const aio = layer.snippetForAiOverview?.trim();
    if (aio) partial.snippetForAiOverview = aio;
  }

  if (twitterCard) partial.twitterCard = twitterCard;
  if (structuredData !== undefined) partial.structuredData = structuredData as PageSeo["structuredData"];

  return { partial, noIndex };
}

function absoluteCanonical(canonicalPath: string, fallbackPath: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const raw = canonicalPath.trim() || fallbackPath;
  if (/^https?:\/\//i.test(raw)) return raw;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${origin}${path}`;
}

function jsonLdString(data: unknown): string | null {
  if (data == null) return null;
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}

function clampSeoText(s: string, max: number): string {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > 40 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}…`;
}

function stripHtmlishToPlain(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildRichFallbackDescription(opts: {
  mergedDescription?: string;
  fallbackDescription?: string;
  fallbackTitle: string;
  siteName: string;
  siteTagline?: string;
  fallbackTextForDescription?: string;
}): string {
  const fromMerged = opts.mergedDescription?.trim();
  if (fromMerged) return clampSeoText(fromMerged, SEO_DESC_SOFT_MAX);
  const fromFallback = opts.fallbackDescription?.trim();
  if (fromFallback) return clampSeoText(fromFallback, SEO_DESC_SOFT_MAX);
  const fromBody = opts.fallbackTextForDescription?.trim();
  if (fromBody) {
    const plain = stripHtmlishToPlain(fromBody);
    if (plain) return clampSeoText(plain, SEO_DESC_SOFT_MAX);
  }
  const tag = opts.siteTagline?.trim();
  const shortTitle = opts.fallbackTitle.split("—")[0]?.trim() || opts.fallbackTitle;
  if (tag) return clampSeoText(`${shortTitle}. ${tag}`, SEO_DESC_SOFT_MAX);
  return clampSeoText(`Learn more about ${shortTitle} at ${opts.siteName}.`, SEO_DESC_SOFT_MAX);
}

function buildHomeJsonLd(siteName: string, pageUrl: string, description: string, logoUrl?: string): Record<string, unknown> {
  const baseUrl = pageUrl.replace(/\/$/, "") || pageUrl;
  const org: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${baseUrl}#organization`,
    name: siteName,
    url: baseUrl,
  };
  if (logoUrl?.trim()) org.logo = { "@type": "ImageObject", url: logoUrl.trim() };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}#website`,
        name: siteName,
        url: baseUrl,
        description: clampSeoText(description, 320),
        publisher: { "@id": `${baseUrl}#organization` },
        inLanguage: "en",
      },
      org,
    ],
  };
}

function buildWebPageJsonLd(siteName: string, pageUrl: string, pageName: string, description: string): Record<string, unknown> {
  let origin = pageUrl;
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    /* keep full string */
  }
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: pageName,
    description: clampSeoText(description, 320),
    url: pageUrl,
    isPartOf: { "@type": "WebSite", name: siteName, url: origin },
    inLanguage: "en",
  };
}

function toIsoDatePublished(dateStr: string | undefined): string | undefined {
  if (!dateStr || dateStr.length < 10) return undefined;
  const d = dateStr.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return undefined;
  return `${d}T12:00:00.000Z`;
}

function buildArticleJsonLd(opts: {
  type: "BlogPosting" | "NewsArticle";
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  authorName?: string;
  section?: string;
  publisherName: string;
}): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": opts.type,
    headline: opts.headline,
    description: clampSeoText(opts.description, 320),
    url: opts.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    inLanguage: "en",
    publisher: { "@type": "Organization", name: opts.publisherName },
  };
  if (opts.image?.trim()) obj.image = [opts.image.trim()];
  const pub = toIsoDatePublished(opts.datePublished);
  if (pub) obj.datePublished = pub;
  const mod = toIsoDatePublished(opts.dateModified) || pub;
  if (mod) obj.dateModified = mod;
  if (opts.authorName?.trim()) obj.author = { "@type": "Person", name: opts.authorName.trim() };
  if (opts.section?.trim()) obj.articleSection = opts.section.trim();
  return obj;
}

export type SeoAutoJsonLd =
  | { kind: "home" }
  | { kind: "webpage"; pageName: string }
  | {
      kind: "article";
      articleType: "BlogPosting" | "NewsArticle";
      datePublished?: string;
      dateModified?: string;
      section?: string;
      authorName?: string;
    };

export type SeoHelmetProps = {
  /** Low → high priority (e.g. `[heroSeo, pageSeo]`). Site **defaultSeo** prepended when `useSiteDefault`. */
  layers?: (PageSeo | undefined)[];
  useSiteDefault?: boolean;
  fallbackTitle: string;
  fallbackDescription?: string;
  /** Plain or HTML snippet — used only when meta description would otherwise be empty */
  fallbackTextForDescription?: string;
  pathForCanonical: string;
  /** When true, emits `noindex` (e.g. 404) regardless of Strapi `seo.entry`. */
  forceNoIndex?: boolean;
  /** Used when Strapi `openGraphImage` is empty */
  fallbackOgImage?: string;
  fallbackOgImageAlt?: string;
  /** Emits `article` Open Graph type and article:* tags when set */
  ogType?: "website" | "article";
  /** ISO or YYYY-MM-DD from API */
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleSection?: string;
  /** When Strapi JSON-LD is empty, emit sensible defaults (never overrides Strapi `structuredData`) */
  autoJsonLd?: SeoAutoJsonLd;
};

export function SeoHelmet({
  layers = [],
  useSiteDefault = true,
  fallbackTitle,
  fallbackDescription = "",
  fallbackTextForDescription = "",
  pathForCanonical,
  forceNoIndex = false,
  fallbackOgImage = "",
  fallbackOgImageAlt = "",
  ogType = "website",
  articlePublishedTime,
  articleModifiedTime,
  articleSection,
  autoJsonLd,
}: SeoHelmetProps) {
  const { siteConfig } = useStrapiLayout();
  const stack = useSiteDefault ? [siteConfig.defaultSeo, ...layers] : [...layers];
  const { partial: seo, noIndex: mergedNoIndex } = mergePageSeoLayers(...stack);

  const siteName = siteConfig.siteName?.trim() || "Site";
  const siteTagline = siteConfig.tagline?.trim();

  const rawTitle = (seo.metaTitle?.trim() || fallbackTitle).trim();
  const title = clampSeoText(rawTitle, SEO_TITLE_SOFT_MAX);

  const description = buildRichFallbackDescription({
    mergedDescription: seo.metaDescription,
    fallbackDescription,
    fallbackTitle: rawTitle,
    siteName,
    siteTagline,
    fallbackTextForDescription,
  });

  const aioSummary = seo.snippetForAiOverview?.trim();
  const keywords = seo.metaKeywords?.trim();
  const canonical = absoluteCanonical(seo.canonicalPath ?? "", pathForCanonical);
  const ogImage = seo.openGraphImage?.trim() || fallbackOgImage.trim();
  const ogAlt = (seo.openGraphImageAlt?.trim() || fallbackOgImageAlt.trim() || title).trim();
  const twCard = seo.twitterCard ?? "summary_large_image";
  const noIndex = forceNoIndex || mergedNoIndex;

  const strapiLd = seo.structuredData != null ? jsonLdString(seo.structuredData) : null;

  let autoLd: string | null = null;
  if (!strapiLd && autoJsonLd && !noIndex) {
    if (autoJsonLd.kind === "home") {
      autoLd = jsonLdString(
        buildHomeJsonLd(siteName, canonical, description, siteConfig.logo?.trim() || undefined),
      );
    } else if (autoJsonLd.kind === "webpage") {
      autoLd = jsonLdString(buildWebPageJsonLd(siteName, canonical, autoJsonLd.pageName, description));
    } else if (autoJsonLd.kind === "article") {
      autoLd = jsonLdString(
        buildArticleJsonLd({
          type: autoJsonLd.articleType,
          headline: rawTitle.replace(/\s*—\s*[^—]+$/, "").trim() || rawTitle,
          description,
          url: canonical,
          image: ogImage,
          datePublished: autoJsonLd.datePublished,
          dateModified: autoJsonLd.dateModified,
          authorName: autoJsonLd.authorName,
          section: autoJsonLd.section,
          publisherName: siteName,
        }),
      );
    }
  }

  const robotsContent = noIndex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const effectiveOgType = ogType === "article" ? "article" : "website";
  const articleTimes = ogType === "article";

  return (
    <Helmet prioritizeSeoTags htmlAttributes={{ lang: "en" }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      {aioSummary ? <meta name="summary" content={clampSeoText(aioSummary, 320)} /> : null}

      <link rel="canonical" href={canonical} />
      <meta name="robots" content={robotsContent} />

      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content={effectiveOgType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      {ogImage ? <meta property="og:image:alt" content={ogAlt} /> : null}

      {articleTimes && articlePublishedTime ? (
        <meta property="article:published_time" content={toIsoDatePublished(articlePublishedTime) || articlePublishedTime} />
      ) : null}
      {articleTimes && articleModifiedTime ? (
        <meta property="article:modified_time" content={toIsoDatePublished(articleModifiedTime) || articleModifiedTime} />
      ) : null}
      {articleTimes && articleSection ? <meta property="article:section" content={articleSection} /> : null}

      <meta name="twitter:card" content={twCard} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}

      {strapiLd ? <script type="application/ld+json">{strapiLd}</script> : null}
      {autoLd ? <script type="application/ld+json">{autoLd}</script> : null}
    </Helmet>
  );
}
