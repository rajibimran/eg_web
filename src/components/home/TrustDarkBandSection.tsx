import { Button } from "@/components/ui/button";
import { RichText } from "@/components/content/RichText";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { IS_STRAPI_CONFIGURED } from "@/lib/api";
import { useTrustSectionData } from "@/hooks/useTrustSectionData";
import { Phone, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact performance strip + service packages (Medilo-style panel, not full-height rings). */
const TrustDarkBandSection = () => {
  const { stats, packages, ready } = useTrustSectionData();
  const { siteConfig } = useStrapiLayout();
  const telHref = siteConfig.phone?.trim()
    ? `tel:${siteConfig.phone.replace(/[^\d+]/g, "")}`
    : "tel:+880248316027";

  if (!IS_STRAPI_CONFIGURED && (!stats?.length || !packages?.length)) {
    return null;
  }

  if (IS_STRAPI_CONFIGURED && (!ready || !stats || !packages)) {
    return (
      <>
        <section className="border-t border-border/80 bg-gradient-to-b from-muted/50 to-background py-6 sm:py-8" aria-busy="true" aria-label="Loading trust metrics">
          <div className="container px-4 sm:px-6">
            <div className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md sm:flex-row">
              <div className="h-24 animate-pulse bg-primary/90 sm:h-auto sm:w-64 sm:shrink-0" />
              <div className="grid flex-1 grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2 rounded-xl bg-muted/40 p-3 sm:p-4">
                    <div className="h-7 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full max-w-[120px] animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="border-t border-border/80 bg-gradient-to-b from-background via-muted/25 to-background py-10 sm:py-12">
          <div className="container px-4 sm:px-6">
            <div className="mx-auto mb-8 flex max-w-md justify-center gap-3">
              <div className="h-px max-w-[72px] flex-1 self-center bg-gradient-to-r from-transparent to-border" />
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-px max-w-[72px] flex-1 self-center bg-gradient-to-l from-transparent to-border" />
            </div>
            <div className="mx-auto mb-8 h-7 max-w-xs animate-pulse rounded-md bg-muted" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[280px] animate-pulse rounded-xl border border-border/70 bg-card shadow-sm"
                />
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }

  if (stats.length === 0 && packages.length === 0) {
    return null;
  }

  return (
    <>
      {stats.length > 0 ? (
        <section className="relative border-t border-border/80 bg-gradient-to-b from-muted/55 to-background py-6 sm:py-9">
          <div className="container px-4 sm:px-6">
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg shadow-primary/[0.06]">
              <div className="flex flex-col sm:flex-row sm:items-stretch">
                <div className="shrink-0 border-b-4 border-secondary bg-primary px-5 py-5 text-primary-foreground sm:flex sm:max-w-[min(100%,17rem)] sm:flex-col sm:justify-center sm:border-b-0 sm:border-l-4 sm:px-7 sm:py-6 lg:max-w-xs lg:px-8">
                  <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/75 sm:text-[11px]">
                    Laboratory &amp; operations
                  </p>
                  <h2 className="mt-1.5 font-heading text-lg font-semibold leading-snug sm:mt-2 sm:text-xl">
                    Performance snapshot
                  </h2>
                </div>
                <div
                  className={cn(
                    "grid flex-1 gap-px bg-border/70",
                    stats.length === 1 && "grid-cols-1",
                    stats.length === 2 && "grid-cols-2",
                    stats.length >= 3 && "grid-cols-2 sm:grid-cols-3",
                  )}
                >
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="flex flex-col justify-center bg-card px-4 py-4 text-center sm:px-5 sm:py-5 sm:text-left lg:px-7"
                    >
                      <p className="break-words font-heading text-xl font-semibold tabular-nums tracking-tight text-primary sm:text-2xl md:text-3xl">
                        {stat.value}
                        {stat.suffix}
                      </p>
                      <div className="mx-auto mt-2 h-0.5 w-9 rounded-full bg-secondary sm:mx-0" aria-hidden />
                      <p className="mt-2 font-body text-xs font-medium leading-snug text-muted-foreground sm:text-sm">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {packages.length > 0 ? (
        <section
          className="border-t border-border/80 bg-gradient-to-b from-background via-muted/30 to-background py-10 sm:py-14"
          aria-labelledby="diagnostic-packages-heading"
        >
          <div className="container px-4 sm:px-6">
            <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-9">
              <div className="mb-3 flex items-center justify-center gap-3 sm:mb-3.5">
                <span className="h-px max-w-[72px] flex-1 bg-gradient-to-r from-transparent to-border sm:max-w-[100px]" aria-hidden />
                <p className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary sm:text-[11px]">
                  Screening bundles
                </p>
                <span className="h-px max-w-[72px] flex-1 bg-gradient-to-l from-transparent to-border sm:max-w-[100px]" aria-hidden />
              </div>
              <h2
                id="diagnostic-packages-heading"
                className="font-heading text-xl font-semibold tracking-tight text-primary sm:text-2xl"
              >
                Diagnostic packages
              </h2>
              <p className="mx-auto mt-2 max-w-md font-body text-sm leading-snug text-muted-foreground sm:text-[15px]">
                Clear inclusions and predictable turnaround — built for visa medical workflows.
              </p>
            </header>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:max-w-none lg:grid-cols-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.title}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card",
                    "shadow-[0_4px_20px_-4px_rgba(10,37,64,0.1)] transition-[box-shadow,transform] duration-300",
                    "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(10,37,64,0.14)]",
                  )}
                >
                  <div className="h-1 w-full bg-gradient-to-r from-secondary to-secondary/70" aria-hidden />
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <h3 className="font-heading text-base font-semibold leading-snug text-primary sm:text-lg">{pkg.title}</h3>
                    <RichText
                      value={pkg.description}
                      className="mt-2 flex-1 [&_p]:text-[13px] [&_p]:leading-snug [&_p]:text-muted-foreground sm:[&_p]:text-sm"
                    />
                    <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
                      {pkg.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.25} />
                          <span className="font-body text-[13px] leading-snug text-foreground sm:text-sm">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 flex flex-col gap-2.5 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-heading text-sm font-semibold text-secondary">{pkg.pricing}</span>
                      <a href={telHref} className="sm:shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-full rounded-full border-secondary/35 bg-secondary/[0.04] font-heading text-xs font-semibold text-secondary hover:bg-secondary/10 sm:h-9 sm:w-auto sm:px-4"
                        >
                          <Phone className="mr-1.5 h-3.5 w-3.5" />
                          Call now
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
};

export default TrustDarkBandSection;
