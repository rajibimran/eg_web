import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronRight, Microscope } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import PageHeroSlider from "@/components/PageHeroSlider";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { equipmentList as defaultEquipmentList, type EquipmentItem } from "@/data/mockData";
import { api, createEmptyPageHero, formatPageTitle, IS_STRAPI_CONFIGURED, USE_LOCAL_MOCK_HYDRATION, type PageHero } from "@/lib/api";
import { cn } from "@/lib/utils";

const LAB_VISUALS = [
  "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=800&h=520&fit=crop",
  "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=520&fit=crop",
  "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&h=520&fit=crop",
  "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&h=520&fit=crop",
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=520&fit=crop",
  "https://images.unsplash.com/photo-1631549916768-4119b412e956?w=800&h=520&fit=crop",
];

function equipmentImage(eq: EquipmentItem, index: number): string {
  if (eq.image?.trim()) return eq.image;
  return LAB_VISUALS[index % LAB_VISUALS.length];
}

function shortEquipmentTitle(name: string): string {
  const first = name.split(",")[0]?.trim() ?? name;
  if (first.length <= 72) return first;
  return `${first.slice(0, 69)}…`;
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  variant = "default",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  variant?: "default" | "inverted";
}) {
  const inverted = variant === "inverted";
  return (
    <header className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
      <div className="mb-3 flex items-center justify-center gap-3">
        <span
          className={cn(
            "h-px max-w-[72px] flex-1 sm:max-w-[100px]",
            inverted ? "bg-gradient-to-r from-transparent to-white/25" : "bg-gradient-to-r from-transparent to-border",
          )}
          aria-hidden
        />
        <p className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary sm:text-[11px]">{eyebrow}</p>
        <span
          className={cn(
            "h-px max-w-[72px] flex-1 sm:max-w-[100px]",
            inverted ? "bg-gradient-to-l from-transparent to-white/25" : "bg-gradient-to-l from-transparent to-border",
          )}
          aria-hidden
        />
      </div>
      <h2
        className={cn(
          "font-heading text-2xl font-semibold tracking-tight sm:text-3xl",
          inverted ? "text-white" : "text-primary",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "mx-auto mt-2 max-w-lg font-body text-sm leading-snug sm:text-[15px]",
            inverted ? "text-primary-foreground/75" : "text-muted-foreground",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

const defaultEquipmentHero: PageHero = {
  page: "equipment",
  title: "Medical Equipment",
  subtitle: "State-of-the-art medical equipment ensuring precision, speed, and reliability in diagnostics.",
  slides: [
    { src: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=1600&h=900&fit=crop", alt: "Advanced laboratory equipment" },
    { src: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1600&h=900&fit=crop", alt: "Medical diagnostic devices" },
    { src: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&h=900&fit=crop", alt: "Digital imaging equipment" },
  ],
  ctaButtons: [{ label: "Book Appointment", href: "/book", variant: "primary" }],
};

const EquipmentPage = () => {
  const { pathname } = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const [equipment, setEquipment] = useState<EquipmentItem[] | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultEquipmentList : IS_STRAPI_CONFIGURED ? null : [],
  );
  const [hero, setHero] = useState<PageHero | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultEquipmentHero : IS_STRAPI_CONFIGURED ? null : createEmptyPageHero("equipment"),
  );
  const [ready, setReady] = useState(!IS_STRAPI_CONFIGURED);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollActive, setScrollActive] = useState(0);
  const [showDots, setShowDots] = useState(false);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const [eq, h] = await Promise.all([api.equipment.getAll(), api.hero.getByPage("equipment", defaultEquipmentHero)]);
      if (!cancelled) {
        setEquipment(eq);
        setHero(h);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const operationalCount = useMemo(
    () => equipment?.filter((e) => (e.status || "").toUpperCase().includes("OPERAT")).length ?? 0,
    [equipment],
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !equipment?.length) return;

    const updateDots = () => setShowDots(el.scrollWidth > el.clientWidth + 6);
    const onScroll = () => {
      const { scrollLeft, clientWidth } = el;
      const children = [...el.children] as HTMLElement[];
      if (!children.length) return;
      let best = 0;
      let bestDist = Infinity;
      const center = scrollLeft + clientWidth / 2;
      children.forEach((ch, i) => {
        const mid = ch.offsetLeft + ch.offsetWidth / 2;
        const d = Math.abs(mid - center);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setScrollActive(best);
    };

    updateDots();
    onScroll();
    const ro = new ResizeObserver(() => {
      updateDots();
      onScroll();
    });
    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [equipment]);

  const scrollToCard = (i: number) => {
    const el = scrollerRef.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  };

  if (!ready || !equipment || !hero) {
    return (
      <Layout>
        <SeoHelmet
          layers={hero?.seo ? [hero.seo] : []}
          fallbackTitle={formatPageTitle("Medical Equipment", siteName)}
          fallbackDescription={hero?.subtitle ?? defaultEquipmentHero.subtitle}
          fallbackOgImage={hero?.slides?.[0]?.src}
          fallbackOgImageAlt={hero?.slides?.[0]?.alt}
          pathForCanonical={pathname}
          autoJsonLd={{ kind: "webpage", pageName: "Medical Equipment" }}
        />
        <section className="relative min-h-[400px] animate-pulse bg-gradient-to-br from-primary/5 to-muted/60" aria-busy="true" aria-label="Loading equipment page" />
        <PageBreadcrumb items={[{ label: "Medical Equipment" }]} />
        <div className="container space-y-6 px-4 py-12 sm:px-6">
          <div className="flex gap-4 overflow-hidden pb-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[340px] w-72 shrink-0 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/80" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SeoHelmet
        layers={[hero.seo]}
        fallbackTitle={formatPageTitle(hero.title || "Medical Equipment", siteName)}
        fallbackDescription={hero.subtitle}
        fallbackOgImage={hero.slides?.[0]?.src}
        fallbackOgImageAlt={hero.slides?.[0]?.alt}
        pathForCanonical={pathname}
        autoJsonLd={{ kind: "webpage", pageName: hero.title || "Medical Equipment" }}
      />
      <PageHeroSlider
        images={hero.slides}
        fallbackCtaButtons={hero.ctaButtons}
        title={hero.title}
        subtitle={hero.subtitle}
      />

      <PageBreadcrumb items={[{ label: "Medical Equipment" }]} />

      <section className="border-t border-border/60 bg-gradient-to-b from-muted/40 via-background to-background py-12 sm:py-16">
        <div className="container max-w-6xl px-4 sm:px-6">
          <div className="mb-12 flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-wider text-secondary">
                <Microscope className="h-3.5 w-3.5" aria-hidden />
                Laboratory & imaging
              </div>
              <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
                Built for accurate, repeatable results
              </h1>
              <p className="mt-3 font-body text-sm leading-relaxed text-muted-foreground sm:text-base">
                {hero.subtitle}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-heading text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:bg-primary/90"
                >
                  Book a visit
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-5 py-2.5 font-heading text-sm font-semibold text-primary transition hover:border-secondary/45"
                >
                  Ask about capabilities
                </Link>
              </div>
            </div>
            <div className="grid w-full max-w-md grid-cols-2 gap-3 sm:max-w-lg">
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_10px_40px_-16px_rgba(10,37,64,0.25)]">
                <p className="font-heading text-3xl font-bold text-primary tabular-nums">{equipment.length}</p>
                <p className="mt-1 font-body text-xs font-medium text-muted-foreground">Assets on file</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-[0_10px_40px_-16px_rgba(10,37,64,0.25)]">
                <p className="font-heading text-3xl font-bold text-secondary tabular-nums">{operationalCount || "—"}</p>
                <p className="mt-1 font-body text-xs font-medium text-muted-foreground">Flagged operational</p>
              </div>
            </div>
          </div>

          <SectionHeader
            eyebrow="Highlights"
            title="Picture tour of our stack"
            subtitle="Scroll sideways to explore major systems. Every item in the register below is maintained for daily diagnostic throughput."
          />

          <div
            ref={scrollerRef}
            className={cn(
              "flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 [-ms-overflow-style:none] [scrollbar-width:none]",
              "scroll-pl-0 scroll-pr-4 [-webkit-overflow-scrolling:touch] sm:scroll-pr-6",
              "[&::-webkit-scrollbar]:hidden",
            )}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Equipment highlights"
          >
            {equipment.map((eq, i) => (
              <div
                key={eq.slNo}
                className={cn(
                  "group relative flex w-[min(19rem,calc(100vw-2rem))] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_32px_-12px_rgba(10,37,64,0.2)] transition-[transform,box-shadow] duration-300 sm:w-80",
                  "hover:-translate-y-1 hover:shadow-[0_20px_50px_-18px_rgba(10,37,64,0.3)]",
                )}
              >
                <div className="relative aspect-[16/11] overflow-hidden bg-muted">
                  <img
                    src={equipmentImage(eq, i)}
                    alt={shortEquipmentTitle(eq.name)}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                    width={640}
                    height={440}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent opacity-90" aria-hidden />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-wide text-secondary shadow-sm backdrop-blur-sm">
                    #{eq.slNo}
                  </span>
                  {eq.status ? (
                    <span className="absolute bottom-3 left-3 rounded-full bg-accent px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-wide text-accent-foreground shadow-md">
                      {eq.status}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="font-heading text-base font-semibold leading-snug text-primary">{shortEquipmentTitle(eq.name)}</h3>
                  <p className="mt-1 line-clamp-2 font-body text-xs text-muted-foreground sm:text-sm">{eq.model}</p>
                  {eq.origin ? (
                    <p className="mt-3 font-body text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Origin · {eq.origin}</p>
                  ) : null}
                  <span className="mt-auto inline-flex items-center gap-0.5 pt-4 font-heading text-xs font-semibold text-secondary sm:text-sm">
                    In full register
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </div>
              </div>
            ))}
          </div>

          {showDots && equipment.length > 1 ? (
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:mt-4" role="tablist" aria-label="Highlight position">
              {equipment.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={scrollActive === i}
                  aria-label={`Go to equipment ${i + 1}`}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center sm:min-h-0 sm:min-w-0"
                  onClick={() => scrollToCard(i)}
                >
                  <span
                    className={cn(
                      "block rounded-full transition-all duration-300",
                      scrollActive === i ? "h-2 w-8 bg-secondary" : "h-2 w-2 bg-muted-foreground/35",
                    )}
                    aria-hidden
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="relative border-t border-border/50 bg-primary py-12 text-primary-foreground sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,192,232,0.12),transparent_50%)]"
          aria-hidden
        />
        <div className="container relative max-w-6xl px-4 sm:px-6">
          <SectionHeader
            variant="inverted"
            eyebrow="Register"
            title="Complete equipment list"
            subtitle="Search-friendly rows replace the old table — same data, clearer scanning on phones and desktops."
          />

          <div className="mx-auto mt-2 max-w-3xl text-center">
            <p className="font-body text-sm text-primary-foreground/75">
              Quantities and models match our live inventory. For calibration or technical sheets, reach out to the lab desk.
            </p>
          </div>

          <ul className="mx-auto mt-10 max-w-4xl space-y-3" role="list">
            {equipment.map((eq) => (
              <li
                key={eq.slNo}
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm transition-colors sm:flex-row sm:items-center sm:px-5",
                  "hover:border-secondary/35 hover:bg-white/10",
                )}
              >
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary/30 to-white/10 font-heading text-base font-bold text-white tabular-nums shadow-inner"
                  aria-hidden
                >
                  {eq.slNo}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-sm font-semibold leading-snug text-white sm:text-base">{eq.name}</h3>
                  <p className="mt-1 font-body text-sm text-primary-foreground/70">{eq.model}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {eq.origin ? (
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 font-body text-[11px] font-medium text-primary-foreground/85">
                        {eq.origin}
                      </span>
                    ) : null}
                    {eq.status ? (
                      <span className="rounded-full bg-accent px-2.5 py-0.5 font-heading text-[11px] font-semibold text-accent-foreground">
                        {eq.status}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-center font-heading text-sm font-semibold text-white sm:min-w-[6rem]">
                  {eq.qty}
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-center">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border-2 border-secondary/80 bg-secondary px-5 py-2.5 font-heading text-sm font-semibold text-secondary-foreground shadow-lg transition hover:bg-secondary/90"
            >
              Request equipment details
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default EquipmentPage;
