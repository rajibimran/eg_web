import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, FileText, Stethoscope } from "lucide-react";
import { RichText } from "@/components/content/RichText";
import { ServiceMark } from "@/components/service/ServiceMark";
import { api, defaultSiteConfig, IS_STRAPI_CONFIGURED, USE_LOCAL_MOCK_HYDRATION } from "@/lib/api";
import { services as defaultServices, type ServiceCard } from "@/data/mockData";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { cn } from "@/lib/utils";

function ServiceSlideCard({ service, index }: { service: ServiceCard; index: number }) {
  const catShort = service.category.toUpperCase().slice(0, 4);
  const idxLabel = String(index + 1).padStart(2, "0");

  return (
    <Link
      to={service.href}
      className={cn(
        "group flex h-full shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-border/70 bg-card shadow-[0_4px_20px_-4px_rgba(10,37,64,0.12)] transition-[box-shadow,transform] duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(10,37,64,0.18)]",
        /* Full-viewport-width card on phones; ~half on tablet; third on desktop */
        "w-[min(22rem,calc(100vw-1.5rem))] sm:w-[min(20rem,calc(50vw-1.25rem))] md:w-[min(22rem,calc(33.333vw-1rem))]",
        "lg:w-[calc((100%-2rem)/3)] lg:max-w-none",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {service.cardImage ? (
          <img
            src={service.cardImage}
            alt={service.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
            width={640}
            height={400}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50" aria-hidden>
            <ServiceMark icon={service.icon} iconImage={service.iconImage} className="h-12 w-12 text-muted-foreground/35" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-wide text-secondary shadow-sm backdrop-blur-[2px]">
          {service.category}
        </span>
        <div
          className="absolute bottom-[20px] right-3 translate-y-1/2 rounded border border-white/20 bg-primary px-2.5 py-1.5 text-center text-primary-foreground shadow-md"
          aria-hidden
        >
          <span className="block font-body text-[9px] font-semibold uppercase leading-none opacity-90">{catShort}</span>
          <span className="mt-0.5 block font-heading text-lg font-bold leading-none tabular-nums">{idxLabel}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-6 sm:px-5 sm:pb-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs">
          <span className="inline-flex items-center gap-1">
            <Stethoscope className="h-3.5 w-3.5 shrink-0 text-secondary/90" aria-hidden />
            <span className="font-body">{service.category}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3.5 w-3.5 shrink-0 text-secondary/90" aria-hidden />
            <span className="font-body">GCC pathway</span>
          </span>
        </div>
        <h3 className="mt-2.5 font-heading text-base font-semibold leading-snug text-primary transition-colors group-hover:text-secondary sm:text-lg">
          {service.title}
        </h3>
        <RichText
          value={service.description}
          className="mt-2 flex-1 [&_p]:line-clamp-2 [&_p]:text-[13px] [&_p]:leading-relaxed [&_p]:text-muted-foreground sm:[&_p]:text-sm"
        />
        <span className="mt-3 inline-flex items-center gap-0.5 font-heading text-sm font-semibold text-secondary">
          Read more
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

const ServicesSection = () => {
  const { siteConfig } = useStrapiLayout();
  const sectionEyebrow =
    siteConfig.homeServicesEyebrow?.trim() || defaultSiteConfig.homeServicesEyebrow || "";
  const sectionHeading =
    siteConfig.homeServicesHeading?.trim() || defaultSiteConfig.homeServicesHeading || "";
  const sectionSubheading =
    siteConfig.homeServicesSubheading?.trim() || defaultSiteConfig.homeServicesSubheading || "";
  const showSectionHeader = Boolean(sectionEyebrow || sectionHeading || sectionSubheading);

  const [items, setItems] = useState<ServiceCard[] | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultServices : IS_STRAPI_CONFIGURED ? null : [],
  );
  const [ready, setReady] = useState(!IS_STRAPI_CONFIGURED);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [showDots, setShowDots] = useState(false);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const list = await api.services.getAll();
      if (!cancelled) {
        setItems(list);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !items?.length) return;

    const updateDotsVisibility = () => {
      setShowDots(el.scrollWidth > el.clientWidth + 6);
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
      setActive(best);
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
  }, [items]);

  const scrollToCard = (i: number) => {
    const el = scrollerRef.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
  };

  if (!ready || !items) {
    return (
      <section className="border-t border-border/80 bg-background py-10 sm:py-14" aria-busy="true" aria-label="Loading services">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto mb-8 flex max-w-md justify-center gap-3">
            <div className="h-px flex-1 max-w-[72px] self-center bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="h-px flex-1 max-w-[72px] self-center bg-muted" />
          </div>
          <div className="mx-auto mb-3 h-8 max-w-sm animate-pulse rounded-md bg-muted" />
          <div className="flex gap-4 overflow-hidden pb-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[340px] w-[min(22rem,calc(100vw-1.5rem))] shrink-0 overflow-hidden rounded-lg border border-border/70 bg-card sm:w-[min(20rem,calc(50vw-1.25rem))] md:w-[min(22rem,calc(33.333vw-1rem))] lg:w-[calc((100%-2rem)/3)]"
              >
                <div className="aspect-[16/10] animate-pulse bg-muted" />
                <div className="space-y-2 p-4 pt-6">
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-4/5 animate-pulse rounded bg-muted" />
                  <div className="h-10 w-full animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="relative border-t border-border/80 bg-background py-10 sm:py-14" aria-labelledby="clinical-services-heading">
      <div className="container px-4 sm:px-6">
        {showSectionHeader ? (
          <header className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
            {sectionEyebrow ? (
              <div className="mb-3 flex items-center justify-center gap-3 sm:mb-4">
                <span className="h-px max-w-[72px] flex-1 bg-gradient-to-r from-transparent to-border sm:max-w-[100px]" aria-hidden />
                <p className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary sm:text-[11px]">
                  {sectionEyebrow}
                </p>
                <span className="h-px max-w-[72px] flex-1 bg-gradient-to-l from-transparent to-border sm:max-w-[100px]" aria-hidden />
              </div>
            ) : null}
            {sectionHeading ? (
              <h2 id="clinical-services-heading" className="font-heading text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                {sectionHeading}
              </h2>
            ) : (
              <h2 id="clinical-services-heading" className="sr-only">
                Clinical services
              </h2>
            )}
            {sectionSubheading ? (
              <p className="mx-auto mt-2 max-w-lg font-body text-sm leading-snug text-muted-foreground sm:text-[15px]">
                {sectionSubheading}
              </p>
            ) : null}
          </header>
        ) : (
          <h2 id="clinical-services-heading" className="sr-only">
            Clinical services
          </h2>
        )}

        <div
          ref={scrollerRef}
          className={cn(
            "flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4",
            "scroll-pl-0 scroll-pr-4 [-webkit-overflow-scrolling:touch] sm:scroll-pr-6",
            "[&::-webkit-scrollbar]:hidden",
          )}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Clinical service highlights"
        >
          {items.map((service, i) => (
            <ServiceSlideCard key={`${service.href}-${service.title}`} service={service} index={i} />
          ))}
        </div>

        {showDots ? (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label="Slide indicators">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={active === i}
                aria-label={`Go to slide ${i + 1}`}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary sm:min-h-0 sm:min-w-0"
                onClick={() => scrollToCard(i)}
              >
                <span
                  className={cn(
                    "block rounded-full transition-all duration-300",
                    active === i ? "h-2 w-8 bg-primary" : "h-2 w-2 bg-muted-foreground/35",
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        ) : null}

        <p className="mt-6 text-center">
          <Link
            to="/services"
            className="inline-flex items-center gap-1 font-heading text-sm font-semibold text-secondary underline-offset-4 hover:underline"
          >
            View full service catalog
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </div>
    </section>
  );
};

export default ServicesSection;
