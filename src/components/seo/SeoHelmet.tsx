import { Helmet } from "react-helmet-async";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import type { PageSeo } from "@/lib/api";

/** Merge SEO layers: earlier = lower priority; later non-empty fields override. */
function mergePageSeoLayers(...layers: (PageSeo | undefined)[]): PageSeo | undefined {
  const merged: Partial<PageSeo> = {};
  let hasTitle = false;
  let noIndex = false;
  let twitterCard: PageSeo["twitterCard"] | undefined;
  let structuredData: unknown = undefined;

  for (const layer of layers) {
    if (!layer) continue;
    if (layer.noIndex) noIndex = true;
    const t = layer.metaTitle?.trim();
    if (t) {
      merged.metaTitle = t;
      hasTitle = true;
    }
    const d = layer.metaDescription?.trim();
    if (d) merged.metaDescription = d;
    const k = layer.metaKeywords?.trim();
    if (k) merged.metaKeywords = k;
    const c = layer.canonicalPath?.trim();
    if (c) merged.canonicalPath = c;
    const og = layer.openGraphImage?.trim();
    if (og) merged.openGraphImage = og;
    const oga = layer.openGraphImageAlt?.trim();
    if (oga) merged.openGraphImageAlt = oga;
    if (layer.twitterCard === "summary" || layer.twitterCard === "summary_large_image") {
      twitterCard = layer.twitterCard;
    }
    if (layer.structuredData !== undefined && layer.structuredData !== null) {
      structuredData = layer.structuredData;
    }
    const aio = layer.snippetForAiOverview?.trim();
    if (aio) merged.snippetForAiOverview = aio;
  }

  if (!hasTitle) return undefined;

  return {
    metaTitle: String(merged.metaTitle),
    metaDescription: String(merged.metaDescription ?? ""),
    metaKeywords: String(merged.metaKeywords ?? ""),
    canonicalPath: String(merged.canonicalPath ?? ""),
    openGraphImage: String(merged.openGraphImage ?? ""),
    openGraphImageAlt: String(merged.openGraphImageAlt ?? ""),
    twitterCard: twitterCard ?? "summary_large_image",
    structuredData: structuredData ?? null,
    noIndex,
    snippetForAiOverview: String(merged.snippetForAiOverview ?? ""),
  };
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

export type SeoHelmetProps = {
  /** Low → high priority (e.g. `[heroSeo, pageSeo]`). Site **defaultSeo** prepended when `useSiteDefault`. */
  layers?: (PageSeo | undefined)[];
  useSiteDefault?: boolean;
  fallbackTitle: string;
  fallbackDescription?: string;
  pathForCanonical: string;
  /** When true, emits `noindex` (e.g. 404) regardless of Strapi `seo.entry`. */
  forceNoIndex?: boolean;
};

export function SeoHelmet({
  layers = [],
  useSiteDefault = true,
  fallbackTitle,
  fallbackDescription = "",
  pathForCanonical,
  forceNoIndex = false,
}: SeoHelmetProps) {
  const { siteConfig } = useStrapiLayout();
  const stack = useSiteDefault ? [siteConfig.defaultSeo, ...layers] : [...layers];
  const seo = mergePageSeoLayers(...stack);

  const title = (seo?.metaTitle?.trim() || fallbackTitle).trim();
  const description = (seo?.metaDescription?.trim() || fallbackDescription).trim();
  const keywords = seo?.metaKeywords?.trim();
  const canonical = absoluteCanonical(seo?.canonicalPath ?? "", pathForCanonical);
  const ogImage = seo?.openGraphImage?.trim();
  const ogAlt = (seo?.openGraphImageAlt?.trim() || title).trim();
  const twCard = seo?.twitterCard ?? "summary_large_image";
  const noIndex = forceNoIndex || Boolean(seo?.noIndex);
  const ld = seo ? jsonLdString(seo.structuredData) : null;

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      {description ? <meta name="description" content={description} /> : null}
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <link rel="canonical" href={canonical} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      {description ? <meta property="og:description" content={description} /> : null}
      <meta property="og:url" content={canonical} />
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      {ogImage && ogAlt ? <meta property="og:image:alt" content={ogAlt} /> : null}

      <meta name="twitter:card" content={twCard} />
      <meta name="twitter:title" content={title} />
      {description ? <meta name="twitter:description" content={description} /> : null}
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}

      {ld ? <script type="application/ld+json">{ld}</script> : null}
    </Helmet>
  );
}
