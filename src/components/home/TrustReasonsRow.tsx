import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { IS_STRAPI_CONFIGURED, defaultSiteConfig } from "@/lib/api";
import { useTrustSectionData } from "@/hooks/useTrustSectionData";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import type { StatItem } from "@/data/mockData";

/** Radial gauge when `suffix` is `%` and value is 0–100; otherwise a compact stat card. */
function TrustStatGauge({ stat }: { stat: StatItem }) {
  const isPercent = stat.suffix.trim() === "%";
  const pct = isPercent ? Math.min(100, Math.max(0, Number(stat.value))) : null;
  const r = 40;
  const c = 2 * Math.PI * r;
  const dashOffset = pct != null ? c * (1 - pct / 100) : c;
  const stroke = 6;

  if (pct != null) {
    return (
      <div className="flex w-[7.5rem] flex-col items-center sm:w-[8.25rem]">
        <div className="relative aspect-square w-full max-w-[132px]">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r={r} fill="none" className="stroke-muted" strokeWidth={stroke} />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              className="stroke-secondary"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-heading text-base font-semibold tabular-nums text-secondary sm:text-lg">
              {stat.value}
              {stat.suffix}
            </span>
          </div>
        </div>
        <p className="mt-3 text-center font-heading text-sm font-semibold leading-snug text-primary">{stat.label}</p>
      </div>
    );
  }

  return (
    <div className="flex min-w-[7rem] flex-col items-center justify-center rounded-2xl border border-border/70 bg-card px-4 py-6 shadow-sm sm:min-w-[8.25rem] sm:px-5">
      <p className="font-heading text-2xl font-semibold tabular-nums text-secondary sm:text-3xl">
        {stat.value}
        {stat.suffix}
      </p>
      <p className="mt-2 text-center font-body text-xs font-medium leading-snug text-foreground sm:text-sm">{stat.label}</p>
    </div>
  );
}

/** Medilo-style split: CMS intro (Site Config) + Strapi `stats` as rings or stat cards. */
const TrustReasonsRow = () => {
  const { stats, ready } = useTrustSectionData();
  const { siteConfig } = useStrapiLayout();

  if (!IS_STRAPI_CONFIGURED && (!stats || stats.length === 0)) {
    return null;
  }

  if (IS_STRAPI_CONFIGURED && (!ready || !stats)) {
    return (
      <section className="border-y border-border/80 bg-background py-10 sm:py-14" aria-busy="true" aria-label="Loading highlights">
        <div className="container px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-3">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 max-w-md animate-pulse rounded-lg bg-muted" />
              <div className="h-20 max-w-lg animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="flex justify-center gap-6 pt-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 w-24 animate-pulse rounded-full bg-muted/80" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const reasons = stats.slice(0, 8);
  if (reasons.length === 0) {
    return null;
  }

  const introEyebrow =
    siteConfig.homeTrustIntroEyebrow?.trim() || defaultSiteConfig.homeTrustIntroEyebrow || "";
  const introHeading =
    siteConfig.homeTrustIntroHeading?.trim() || defaultSiteConfig.homeTrustIntroHeading || "";
  const introBody = siteConfig.homeTrustIntroBody?.trim() || defaultSiteConfig.homeTrustIntroBody || "";
  const ctaLabel = siteConfig.homeTrustIntroCtaLabel?.trim() || defaultSiteConfig.homeTrustIntroCtaLabel || "";
  const ctaHrefRaw = siteConfig.homeTrustIntroCtaHref?.trim() || defaultSiteConfig.homeTrustIntroCtaHref || "/about";
  const statsEyebrow =
    siteConfig.homeTrustStatsEyebrow?.trim() || defaultSiteConfig.homeTrustStatsEyebrow || "";
  const statsHeading =
    siteConfig.homeTrustStatsHeading?.trim() || defaultSiteConfig.homeTrustStatsHeading || "";

  const ctaExternal = /^https?:\/\//i.test(ctaHrefRaw);

  return (
    <section className="border-y border-border/80 bg-background py-10 sm:py-16 lg:py-20">
      <div className="container min-w-0 px-4 sm:px-6">
        <div className="grid min-w-0 items-start gap-10 sm:gap-12 lg:grid-cols-2 lg:gap-14 xl:gap-20">
          <div className="min-w-0">
            {introEyebrow ? (
              <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">{introEyebrow}</p>
            ) : null}
            {introHeading ? (
              <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-primary sm:text-3xl lg:text-4xl">
                {introHeading}
              </h2>
            ) : null}
            {introBody ? (
              <p className="mt-4 max-w-xl font-body text-sm leading-relaxed text-muted-foreground sm:text-base">{introBody}</p>
            ) : null}
            {ctaLabel ? (
              <div className="mt-6 flex max-w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
                {ctaExternal ? (
                  <a
                    href={ctaHrefRaw}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full max-w-md flex-col items-stretch gap-3 no-underline min-[480px]:max-w-none min-[480px]:flex-row min-[480px]:items-center"
                  >
                    <span className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center rounded-full bg-secondary px-6 font-heading text-sm font-semibold text-secondary-foreground shadow-md transition-[filter] hover:brightness-110 sm:flex-initial sm:px-7">
                      {ctaLabel}
                    </span>
                    <span className="mx-auto flex h-12 min-h-[48px] w-12 shrink-0 items-center justify-center rounded-full border-2 border-secondary bg-card text-primary shadow-sm transition-colors hover:bg-secondary/10 min-[480px]:mx-0">
                      <ArrowRight className="h-5 w-5" aria-hidden />
                    </span>
                  </a>
                ) : (
                  <Link
                    to={ctaHrefRaw}
                    className="inline-flex w-full max-w-md flex-col items-stretch gap-3 no-underline min-[480px]:max-w-none min-[480px]:flex-row min-[480px]:items-center"
                  >
                    <span className="inline-flex h-12 min-h-[48px] flex-1 items-center justify-center rounded-full bg-secondary px-6 font-heading text-sm font-semibold text-secondary-foreground shadow-md transition-[filter] hover:brightness-110 sm:flex-initial sm:px-7">
                      {ctaLabel}
                    </span>
                    <span className="mx-auto flex h-12 min-h-[48px] w-12 shrink-0 items-center justify-center rounded-full border-2 border-secondary bg-card text-primary shadow-sm transition-colors hover:bg-secondary/10 min-[480px]:mx-0">
                      <ArrowRight className="h-5 w-5" aria-hidden />
                    </span>
                  </Link>
                )}
              </div>
            ) : null}
          </div>

          <div className="min-w-0 lg:pt-1">
            {statsEyebrow ? (
              <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">{statsEyebrow}</p>
            ) : null}
            {statsHeading ? (
              <h3 className="mt-2 font-heading text-xl font-semibold tracking-tight text-primary sm:text-2xl">{statsHeading}</h3>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-center gap-6 sm:mt-8 sm:gap-8 lg:mt-10 lg:justify-between lg:gap-6">
              {reasons.map((stat) => (
                <TrustStatGauge key={`${stat.label}-${stat.value}-${stat.suffix}`} stat={stat} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustReasonsRow;
