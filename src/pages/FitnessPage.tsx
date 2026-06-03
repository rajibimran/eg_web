import { useEffect, useMemo, useState, type ElementType } from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Dumbbell, CheckCircle2, ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import PageHeroSlider from "@/components/PageHeroSlider";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { RichText } from "@/components/content/RichText";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { fitnessCriteria as defaultFitnessCriteria, type FitnessCriteria } from "@/data/mockData";
import {
  api,
  createEmptyPageHero,
  defaultFitnessPageConfig,
  formatPageTitle,
  getEmptyFitnessPageConfig,
  IS_STRAPI_CONFIGURED,
  USE_LOCAL_MOCK_HYDRATION,
  type FitnessPageConfig,
  type PageHero,
  type PageSeo,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, ElementType> = {
  "Infectious Diseases — Must Be Negative / Non-Reactive": ShieldAlert,
  "Non-Infectious Conditions — Must Be Clear": ShieldCheck,
  "Additional Requirements": AlertTriangle,
  "Physical Fitness Requirements": Dumbbell,
};

function resolveCategoryIcon(category: string): ElementType {
  if (categoryIcons[category]) return categoryIcons[category];
  if (category.includes("Infectious")) return ShieldAlert;
  if (category.includes("Non-Infectious")) return ShieldCheck;
  if (category.includes("Additional")) return AlertTriangle;
  if (category.includes("Physical")) return Dumbbell;
  return ShieldCheck;
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
      <div className="mb-3 flex items-center justify-center gap-3">
        <span className="h-px max-w-[72px] flex-1 bg-gradient-to-r from-transparent to-border sm:max-w-[100px]" aria-hidden />
        <p className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary sm:text-[11px]">{eyebrow}</p>
        <span className="h-px max-w-[72px] flex-1 bg-gradient-to-l from-transparent to-border sm:max-w-[100px]" aria-hidden />
      </div>
      <h2 className="font-heading text-2xl font-semibold tracking-tight text-primary sm:text-3xl">{title}</h2>
      {subtitle ? (
        <p className="mx-auto mt-2 max-w-lg font-body text-sm leading-snug text-muted-foreground sm:text-[15px]">{subtitle}</p>
      ) : null}
    </header>
  );
}

const defaultFitnessHero: PageHero = {
  page: "fitness",
  title: "Fitness Criteria",
  subtitle: "Health requirements for overseas employment certification. Candidates must meet the following criteria to be certified fit.",
  slides: [
    { src: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&h=900&fit=crop", alt: "Fitness assessment" },
    { src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&h=900&fit=crop", alt: "Medical screening" },
    { src: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1600&h=900&fit=crop", alt: "Health certification" },
  ],
  ctaButtons: [{ label: "Book Appointment", href: "/book", variant: "primary" }],
};

const FitnessPage = () => {
  const { pathname } = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const [criteria, setCriteria] = useState<FitnessCriteria[] | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultFitnessCriteria : IS_STRAPI_CONFIGURED ? null : [],
  );
  const [hero, setHero] = useState<PageHero | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultFitnessHero : IS_STRAPI_CONFIGURED ? null : createEmptyPageHero("fitness"),
  );
  const [fitnessPageConfig, setFitnessPageConfig] = useState<FitnessPageConfig | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultFitnessPageConfig : IS_STRAPI_CONFIGURED ? null : getEmptyFitnessPageConfig(),
  );
  const [ready, setReady] = useState(!IS_STRAPI_CONFIGURED);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const [crit, h, fp] = await Promise.all([
        api.fitnessCriteria.getAll(),
        api.hero.getByPage("fitness", defaultFitnessHero),
        api.fitnessPage.get(),
      ]);
      if (!cancelled) {
        setCriteria(crit);
        setHero(h);
        setFitnessPageConfig(fp);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const disclaimer =
    fitnessPageConfig?.disclaimer?.trim() ||
    (!IS_STRAPI_CONFIGURED && USE_LOCAL_MOCK_HYDRATION ? defaultFitnessPageConfig.disclaimer : "");

  const totals = useMemo(() => {
    if (!criteria?.length) return { groups: 0, checkpoints: 0 };
    return {
      groups: criteria.length,
      checkpoints: criteria.reduce((n, g) => n + g.items.length, 0),
    };
  }, [criteria]);

  if (!ready || !criteria || !hero || fitnessPageConfig === null) {
    return (
      <Layout>
        <SeoHelmet
          layers={[hero?.seo, fitnessPageConfig?.seo].filter((x): x is PageSeo => Boolean(x))}
          fallbackTitle={formatPageTitle("Fitness Criteria", siteName)}
          fallbackDescription={hero?.subtitle ?? defaultFitnessHero.subtitle}
          fallbackOgImage={hero?.slides?.[0]?.src}
          fallbackOgImageAlt={hero?.slides?.[0]?.alt}
          pathForCanonical={pathname}
          autoJsonLd={{ kind: "webpage", pageName: "Fitness Criteria" }}
        />
        <section className="relative min-h-[400px] animate-pulse bg-gradient-to-br from-muted/80 to-background" aria-busy="true" aria-label="Loading fitness page" />
        <PageBreadcrumb items={[{ label: "Fitness Criteria" }]} />
        <div className="container max-w-5xl space-y-6 px-4 py-12 sm:px-6">
          <div className="mx-auto h-8 max-w-md animate-pulse rounded-full bg-muted" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/80" />
            ))}
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl border border-border/50 bg-card" />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SeoHelmet
        layers={[hero.seo, fitnessPageConfig.seo].filter((x): x is PageSeo => Boolean(x))}
        fallbackTitle={formatPageTitle(hero.title || "Fitness Criteria", siteName)}
        fallbackDescription={hero.subtitle}
        fallbackOgImage={hero.slides?.[0]?.src}
        fallbackOgImageAlt={hero.slides?.[0]?.alt}
        pathForCanonical={pathname}
        autoJsonLd={{ kind: "webpage", pageName: hero.title || "Fitness Criteria" }}
      />
      <PageHeroSlider
        images={hero.slides}
        fallbackCtaButtons={hero.ctaButtons}
        title={hero.title}
        subtitle={hero.subtitle}
      />

      <PageBreadcrumb items={[{ label: "Fitness Criteria" }]} />

      <section className="relative overflow-hidden border-t border-border/60 bg-gradient-to-b from-muted/45 via-background to-background py-12 sm:py-16">
        <div
          className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl"
          aria-hidden
        />
        <div className="container relative max-w-6xl px-4 sm:px-6">
          <div className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Pre-certification</p>
              <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
                Clear, grouped fitness standards
              </h1>
              <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
                Everything below mirrors what assessors expect for overseas medical clearance. Use it as a checklist before
                you book — our team can guide you through any questions.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-heading text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
                >
                  Schedule screening
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-5 py-2.5 font-heading text-sm font-semibold text-primary transition hover:border-secondary/50"
                >
                  View services
                </Link>
              </div>
            </div>
            <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-lg">
              <div className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-[0_8px_30px_-12px_rgba(10,37,64,0.2)] backdrop-blur-sm">
                <p className="font-heading text-3xl font-bold text-secondary tabular-nums">{totals.groups}</p>
                <p className="mt-1 font-body text-xs font-medium text-muted-foreground">Requirement areas</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/90 p-4 shadow-[0_8px_30px_-12px_rgba(10,37,64,0.2)] backdrop-blur-sm">
                <p className="font-heading text-3xl font-bold text-primary tabular-nums">{totals.checkpoints}</p>
                <p className="mt-1 font-body text-xs font-medium text-muted-foreground">Individual checkpoints</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-secondary/25 bg-gradient-to-br from-secondary/10 to-transparent p-4 sm:col-span-1">
                <p className="font-heading text-sm font-semibold text-primary">Need clarification?</p>
                <Link to="/contact" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline">
                  Contact the clinic
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>

          <SectionHeader
            eyebrow="Checklist"
            title="What we verify for certification"
            subtitle="Each block is reviewed during your visit. Bring any prior reports that relate to these items."
          />

          <div className="space-y-6 sm:space-y-8">
            {criteria.map((group, i) => {
              const Icon = resolveCategoryIcon(group.category);
              const altBg = i % 2 === 1;
              return (
                <article
                  key={`${group.category}-${i}`}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border border-border/60 shadow-[0_4px_24px_-8px_rgba(10,37,64,0.12)] transition-shadow duration-300 hover:shadow-[0_12px_40px_-12px_rgba(10,37,64,0.18)]",
                    altBg
                      ? "bg-gradient-to-br from-muted/50 via-card to-background"
                      : "bg-card",
                  )}
                >
                  <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-gradient-to-b from-secondary to-secondary/60" aria-hidden />
                  <div className="grid gap-8 p-6 pl-7 sm:p-8 sm:pl-10 lg:grid-cols-[minmax(0,280px)_1fr] lg:items-start">
                    <div>
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-border/60">
                        <Icon className="h-7 w-7 text-secondary" aria-hidden />
                      </div>
                      <h2 className="mt-5 font-heading text-lg font-semibold leading-snug text-primary sm:text-xl">{group.category}</h2>
                      <RichText
                        value={group.description}
                        className="mt-2 font-body text-sm leading-relaxed text-muted-foreground [&_p]:text-sm [&_p]:leading-relaxed"
                      />
                    </div>
                    <ul className="grid gap-2.5 sm:grid-cols-2" role="list">
                      {group.items.map((item, j) => (
                        <li
                          key={j}
                          className="flex gap-3 rounded-xl border border-border/50 bg-background/80 px-3.5 py-3 transition-colors hover:border-secondary/25 hover:bg-muted/30"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
                          <span className="font-body text-sm leading-snug text-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>

          {disclaimer ? (
            <div className="mt-14 sm:mt-16">
              <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-8 text-primary-foreground shadow-[0_20px_50px_-20px_rgba(10,37,64,0.45)] sm:px-10 sm:py-10">
                <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-secondary/20 blur-2xl" aria-hidden />
                <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Important</p>
                <RichText
                  value={disclaimer}
                  className="relative mt-3 font-body text-sm leading-relaxed text-primary-foreground/90 [&_a]:font-semibold [&_a]:text-secondary [&_a]:underline [&_strong]:font-semibold [&_strong]:text-white"
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </Layout>
  );
};

export default FitnessPage;
