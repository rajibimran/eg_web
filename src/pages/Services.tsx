import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronRight, X as XIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Layout from "@/components/layout/Layout";
import PageHeroSlider from "@/components/PageHeroSlider";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { RichText } from "@/components/content/RichText";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import {
  services as defaultServices,
  serviceDetails,
  serviceFAQs,
  serviceCategories as defaultServiceFilterTabs,
  type ServiceCard,
  type FAQItem,
} from "@/data/mockData";
import { cn } from "@/lib/utils";
import {
  api,
  createEmptyPageHero,
  defaultServicesPageConfig,
  formatPageTitle,
  getEmptyServicesPageConfig,
  IS_MOCK_DATA_ENABLED,
  IS_STRAPI_CONFIGURED,
  USE_LOCAL_MOCK_HYDRATION,
  type PageHero,
  type ServiceComparisonRow,
} from "@/lib/api";

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  Examination: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&h=500&fit=crop",
  Imaging: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&h=500&fit=crop",
  Laboratory: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&h=500&fit=crop",
  Preventive: "https://images.unsplash.com/photo-1584308666744-24d5c474e870?w=800&h=500&fit=crop",
};

function resolveServiceCardImage(service: ServiceCard): string {
  const trimmed = service.cardImage?.trim();
  if (trimmed) return trimmed;
  const slug = service.href.replace(/^\/services\//, "").split(/[?#]/)[0];
  const fromDetail = slug && serviceDetails[slug]?.heroImage;
  if (fromDetail) return fromDetail;
  return CATEGORY_FALLBACK_IMAGES[service.category] ?? CATEGORY_FALLBACK_IMAGES.Imaging;
}

const defaultServicesHero: PageHero = {
  page: "services",
  title: "Our Services",
  subtitle: "Comprehensive GCC-approved medical services for overseas employment and travel certification.",
  slides: [
    { src: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=1600&h=900&fit=crop", alt: "Medical examination" },
    { src: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1600&h=900&fit=crop", alt: "Digital radiology" },
    { src: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1600&h=900&fit=crop", alt: "Laboratory testing" },
  ],
  ctaButtons: [{ label: "Book Appointment", href: "/book", variant: "primary" }],
};

const Services = () => {
  const { pathname } = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const [items, setItems] = useState<ServiceCard[] | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultServices : IS_STRAPI_CONFIGURED ? null : []
  );
  const [hero, setHero] = useState<PageHero | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultServicesHero : IS_STRAPI_CONFIGURED ? null : createEmptyPageHero("services")
  );
  const [faqs, setFaqs] = useState<FAQItem[] | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? serviceFAQs : IS_STRAPI_CONFIGURED ? null : []
  );
  const [pageConfig, setPageConfig] = useState(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultServicesPageConfig : IS_STRAPI_CONFIGURED ? null : getEmptyServicesPageConfig()
  );
  const [filterTabs, setFilterTabs] = useState<string[]>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultServiceFilterTabs : []
  );
  const [ready, setReady] = useState(!IS_STRAPI_CONFIGURED);
  const [activeCategory, setActiveCategory] = useState("All");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollActive, setScrollActive] = useState(0);
  const [showScrollDots, setShowScrollDots] = useState(false);

  const categories = filterTabs;
  const comparison: ServiceComparisonRow[] =
    pageConfig?.comparison ?? (IS_MOCK_DATA_ENABLED ? defaultServicesPageConfig.comparison : []);

  const filtered = useMemo(() => {
    if (!items) return null;
    return activeCategory === "All" ? items : items.filter((s) => s.category === activeCategory);
  }, [items, activeCategory]);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const [svc, h, f, cfg, strapiCats] = await Promise.all([
        api.services.getAll(),
        api.hero.getByPage("services", defaultServicesHero),
        api.faqs.getByPage("services"),
        api.servicesPage.get(),
        api.serviceCategories.getAll(),
      ]);
      if (!cancelled) {
        setItems(svc);
        setHero(h);
        setFaqs(f);
        setPageConfig(cfg);
        const namesFromStrapi = strapiCats.map((c) => c.name);
        const fromServices = [...new Set(svc.map((s) => s.category).filter(Boolean))].sort();
        const nonAllDefaults = defaultServiceFilterTabs.filter((c) => c !== "All");
        const ordered =
          namesFromStrapi.length > 0
            ? namesFromStrapi
            : fromServices.length > 0
              ? fromServices
              : nonAllDefaults;
        setFilterTabs(["All", ...ordered]);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: "auto" });
    setScrollActive(0);
  }, [activeCategory, filtered?.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !filtered?.length) return;

    const updateDotsVisibility = () => {
      setShowScrollDots(el.scrollWidth > el.clientWidth + 6);
    };

    const onScroll = () => {
      const { scrollLeft, clientWidth } = el;
      const children = [...el.children] as HTMLElement[];
      if (children.length === 0) return;
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

    updateDotsVisibility();
    onScroll();
    const ro = new ResizeObserver(() => {
      updateDotsVisibility();
      onScroll();
    });
    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [filtered]);

  const scrollToServiceCard = (i: number) => {
    const el = scrollerRef.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  };

  if (!ready || !items || !hero || !faqs || !filtered || !pageConfig) {
    return (
      <Layout>
        <SeoHelmet
          layers={hero?.seo ? [hero.seo] : []}
          fallbackTitle={formatPageTitle("Our Services", siteName)}
          fallbackDescription={hero?.subtitle ?? defaultServicesHero.subtitle}
          pathForCanonical={pathname}
        />
        <section
          className="relative flex min-h-[400px] items-center justify-center bg-muted"
          aria-busy="true"
          aria-label="Loading services"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </section>
        <PageBreadcrumb items={[{ label: "Services" }]} />
        <div className="container space-y-6 py-[48px]">
          <div className="mx-auto flex max-w-xl justify-center gap-2 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-20 shrink-0 animate-pulse rounded-full bg-muted" />
            ))}
          </div>
          <div className="flex gap-4 overflow-hidden pb-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[380px] w-[min(20rem,calc(100vw-2rem))] shrink-0 overflow-hidden rounded-2xl border border-border/70 bg-card sm:w-[22rem]"
              >
                <div className="aspect-[16/10] animate-pulse bg-muted" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
                  <div className="h-16 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
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
        fallbackTitle={formatPageTitle(hero.title || "Our Services", siteName)}
        fallbackDescription={hero.subtitle}
        pathForCanonical={pathname}
      />
      <PageHeroSlider
        images={hero.slides}
        fallbackCtaButtons={hero.ctaButtons}
        title={hero.title}
        subtitle={hero.subtitle}
      />

      <PageBreadcrumb items={[{ label: "Services" }]} />

      <section
        className="border-t border-border/60 bg-gradient-to-b from-muted/50 via-background to-background py-12 sm:py-16"
        aria-labelledby="services-catalog-heading"
      >
        <div className="container px-4 sm:px-6">
          <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="h-px max-w-[72px] flex-1 bg-gradient-to-r from-transparent to-border sm:max-w-[100px]" aria-hidden />
              <p className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary sm:text-[11px]">
                Service catalog
              </p>
              <span className="h-px max-w-[72px] flex-1 bg-gradient-to-l from-transparent to-border sm:max-w-[100px]" aria-hidden />
            </div>
            <h2 id="services-catalog-heading" className="font-heading text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              Explore our clinical services
            </h2>
            <p className="mx-auto mt-2 max-w-lg font-body text-sm text-muted-foreground sm:text-[15px]">
              Filter by category, then scroll horizontally to compare pathways — each card opens full details.
            </p>
          </header>

          <div
            className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Filter by service category"
          >
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "shrink-0 rounded-full border-2 px-5 py-2.5 font-heading text-sm font-semibold transition-all duration-200",
                    active
                      ? "border-secondary bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_rgba(10,37,64,0.35)]"
                      : "border-border/80 bg-card text-primary hover:border-secondary/45 hover:bg-muted/40",
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div
            ref={scrollerRef}
            className={cn(
              "flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none]",
              "scroll-pl-4 scroll-pr-4 [-webkit-overflow-scrolling:touch] sm:scroll-pl-0 sm:scroll-pr-6",
              "[&::-webkit-scrollbar]:hidden",
            )}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Services in selected category"
          >
            {filtered.map((service) => (
              <Link
                key={service.href}
                to={service.href}
                className={cn(
                  "group flex shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_4px_20px_-4px_rgba(10,37,64,0.12)] transition-[box-shadow,transform,border-color] duration-300 ease-out",
                  "hover:-translate-y-1 hover:border-secondary/40 hover:shadow-[0_18px_40px_-14px_rgba(10,37,64,0.28)]",
                  "w-[min(20rem,calc(100vw-2rem))] sm:w-[min(22rem,calc(100vw-3rem))] md:w-96",
                )}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={resolveServiceCardImage(service)}
                    alt={service.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-105"
                    loading="lazy"
                    width={640}
                    height={400}
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-wide text-secondary shadow-sm backdrop-blur-sm">
                    {service.category}
                  </span>
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/30 via-primary/5 to-transparent opacity-90 transition-opacity duration-300 group-hover:from-primary/40"
                    aria-hidden
                  />
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="font-heading text-lg font-semibold leading-snug text-primary transition-colors duration-200 group-hover:text-secondary sm:text-xl">
                    {service.title}
                  </h3>
                  <RichText
                    value={service.description}
                    className="mt-2 flex-1 [&_p]:line-clamp-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground"
                  />
                  <span className="mt-4 inline-flex items-center gap-1 font-heading text-sm font-semibold text-secondary">
                    Learn more
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {showScrollDots && filtered.length > 1 ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:mt-4" role="tablist" aria-label="Card position">
              {filtered.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={scrollActive === i}
                  aria-label={`Go to service ${i + 1}`}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary sm:min-h-0 sm:min-w-0"
                  onClick={() => scrollToServiceCard(i)}
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

      <section className="bg-muted py-[48px]">
        <div className="container">
          <div className="text-center mb-[32px]">
            <h2 className="font-heading text-2xl font-bold text-foreground">Compare Our Services</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse bg-card rounded-lg overflow-hidden">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-[16px] text-left font-heading text-sm font-semibold text-foreground">Feature</th>
                  <th className="p-[16px] text-center font-heading text-sm font-semibold text-foreground">Physical Exam</th>
                  <th className="p-[16px] text-center font-heading text-sm font-semibold text-foreground">Radiology</th>
                  <th className="p-[16px] text-center font-heading text-sm font-semibold text-foreground">Lab Tests</th>
                  <th className="p-[16px] text-center font-heading text-sm font-semibold text-foreground">Vaccination</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "bg-card" : "bg-muted/50"}>
                    <td className="p-[16px] font-body text-sm text-foreground">{row.feature}</td>
                    {(["physical", "radiology", "laboratory", "vaccination"] as const).map((key) => {
                      const val = row[key];
                      return (
                        <td key={key} className="p-[16px] text-center">
                          {typeof val === "boolean" ? (
                            val ? (
                              <Check className="mx-auto h-5 w-5 text-accent" />
                            ) : (
                              <XIcon className="mx-auto h-5 w-5 text-muted-foreground/40" />
                            )
                          ) : (
                            <span className="font-body text-sm text-foreground">{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-[48px]">
        <div className="container max-w-3xl">
          <div className="text-center mb-[32px]">
            <h2 className="font-heading text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="font-heading text-sm font-semibold text-foreground text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground leading-relaxed">
                  <RichText value={faq.answer} className="[&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted-foreground" />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
