import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import {
  api,
  createEmptyPageHero,
  formatPageTitle,
  IS_STRAPI_CONFIGURED,
  USE_LOCAL_MOCK_HYDRATION,
  type HeroSlide,
  type PageHero,
} from "@/lib/api";

type SlideMediaItem =
  | (HeroSlide & { kind?: "image" })
  | { src: string; alt: string; kind: "video"; title?: string; text?: string };

type HeroCtaItem = NonNullable<HeroSlide["ctaButtons"]>[number];

/** Medilo-style primary CTA (teal on hero). */
const HERO_CTA_PRIMARY =
  "rounded-full bg-secondary px-8 font-heading text-sm font-bold uppercase tracking-wide text-secondary-foreground shadow-lg shadow-primary/20 transition-[filter] hover:brightness-110 sm:text-base";

const defaultHomeHero: PageHero = {
  page: "home",
  title: "GAMCA Now Wafid",
  subtitle: "Medical Certificate Service",
  slides: [
    {
      src: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=1920&h=1080&fit=crop",
      alt: "Medical laboratory professional with test tube",
      title: "GAMCA Now Wafid",
      text: "Medical Certificate Service",
      ctaButtons: [
        { label: "Book Appointment", href: "/book", variant: "primary" },
        { label: "Check Report", href: "/reports", variant: "secondary" },
      ],
    },
    {
      src: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1920&h=1080&fit=crop",
      alt: "Modern diagnostic laboratory",
      title: "GAMCA Now Wafid",
      text: "Medical Certificate Service",
      ctaButtons: [{ label: "Book Appointment", href: "/book", variant: "primary" }],
    },
    {
      src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&h=1080&fit=crop",
      alt: "Medical facility",
      title: "GCC approved medical centre",
      text: "Trusted screening for UAE, Bahrain, Saudi Arabia, Qatar, Kuwait, and Oman.",
      ctaButtons: [{ label: "Book Appointment", href: "/book", variant: "primary" }],
    },
  ],
};

const HeroSection = () => {
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "";
  const [hero, setHero] = useState<PageHero | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultHomeHero : IS_STRAPI_CONFIGURED ? null : createEmptyPageHero("home"),
  );
  const [ready, setReady] = useState(!IS_STRAPI_CONFIGURED);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const h = await api.hero.getByPage("home", defaultHomeHero);
      if (!cancelled) {
        setHero(h);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mediaItems: SlideMediaItem[] = useMemo(() => {
    if (!hero) return [];
    const imgs = hero.slides.map((img) => ({ ...img, kind: "image" as const }));
    if (hero.promoVideoUrl) {
      return [
        ...imgs,
        { src: hero.promoVideoUrl, alt: "Promotional video", kind: "video" as const },
      ];
    }
    return imgs;
  }, [hero]);

  const len = Math.max(1, mediaItems.length);
  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % len);
  }, [len]);
  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + len) % len);
  }, [len]);

  useEffect(() => {
    if (mediaItems.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next, mediaItems.length]);

  useEffect(() => {
    setCurrent(0);
  }, [hero?.slides, hero?.promoVideoUrl]);

  const overlay = useMemo(() => {
    if (!hero) return { headline: "", sub: "" };
    const item = mediaItems[current];
    if (!item) return { headline: hero.title, sub: hero.subtitle };
    if ("kind" in item && item.kind === "video") return { headline: hero.title, sub: hero.subtitle };
    const img = item as HeroSlide;
    return {
      headline: img.title?.trim() || hero.title,
      sub: img.text?.trim() || hero.subtitle,
    };
  }, [current, mediaItems, hero]);

  const ctasForCurrent = useMemo((): HeroCtaItem[] => {
    if (!hero) return [];
    const item = mediaItems[current];
    if (!item) return hero.ctaButtons ?? [];
    if ("kind" in item && item.kind === "video") return hero.ctaButtons ?? [];
    const slide = item as HeroSlide;
    if (slide.ctaButtons && slide.ctaButtons.length > 0) return slide.ctaButtons;
    return hero.ctaButtons ?? [];
  }, [current, mediaItems, hero]);

  if (!ready || !hero) {
    const homePart = defaultHomeHero.title;
    return (
      <>
        <SeoHelmet
          layers={[]}
          fallbackTitle={siteName ? `${siteName} — ${homePart}` : formatPageTitle(homePart, siteName)}
          fallbackDescription={defaultHomeHero.subtitle}
          pathForCanonical="/"
        />
        <section
          className="relative min-h-[min(85vh,640px)] animate-pulse bg-muted sm:min-h-[min(88vh,720px)]"
          aria-busy="true"
          aria-label="Loading hero"
        />
      </>
    );
  }

  return (
    <>
      <SeoHelmet
        layers={[hero.seo]}
        fallbackTitle={siteName ? `${siteName} — ${hero.title}` : formatPageTitle(hero.title, siteName)}
        fallbackDescription={hero.subtitle}
        pathForCanonical="/"
      />

      <section
        className="relative flex min-h-[min(85vh,640px)] items-center justify-center overflow-hidden sm:min-h-[min(88vh,720px)]"
        aria-roledescription="carousel"
        aria-label="Homepage hero"
      >
        {mediaItems.length === 0 ? <div className="absolute inset-0 bg-muted" aria-hidden /> : null}
        {mediaItems.map((item, i) =>
          item.kind === "video" ? (
            <video
              key={item.src}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={item.alt}
            >
              <source src={item.src} />
            </video>
          ) : (
            <img
              key={item.src}
              src={item.src}
              alt={item.alt}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
              loading={i === 0 ? "eager" : "lazy"}
              width={1920}
              height={1080}
            />
          ),
        )}

        <div
          className="absolute inset-0 bg-gradient-to-r from-primary/92 via-primary/65 to-secondary/45"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-primary/25" aria-hidden />

        <div
          className={`container relative z-10 px-4 text-center sm:px-6 ${mediaItems.length > 1 ? "pb-24 pt-14 sm:pb-28 sm:pt-20" : "py-14 sm:py-20"}`}
        >
          <h1 className="font-heading text-[clamp(1.5rem,4.5vw+0.6rem,3.75rem)] font-extrabold leading-[1.15] tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-5xl lg:text-6xl break-words">
            {overlay.headline}
          </h1>
          {overlay.sub ? (
            <p className="mx-auto mt-3 max-w-2xl font-body text-base font-medium leading-snug text-white/92 sm:mt-5 sm:text-xl md:text-2xl">
              {overlay.sub}
            </p>
          ) : null}
          {ctasForCurrent.length > 0 ? (
            <div className="mt-6 flex w-full max-w-2xl flex-col items-stretch justify-center gap-3 px-1 sm:mx-auto sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              {ctasForCurrent.map((cta, i) => {
                const external = /^https?:\/\//i.test(cta.href);
                const isSecondary = cta.variant === "secondary";
                const className = isSecondary
                  ? "inline-flex h-12 min-h-[48px] w-full max-w-md items-center justify-center rounded-full border-2 border-white/90 bg-white/12 px-5 font-heading text-sm font-semibold text-white shadow-md backdrop-blur-md transition-colors hover:bg-white/22 sm:h-14 sm:min-h-[56px] sm:w-auto sm:max-w-none sm:min-w-[180px] sm:px-6 sm:text-base"
                  : `inline-flex h-12 min-h-[48px] w-full max-w-md items-center justify-center px-5 sm:h-14 sm:min-h-[56px] sm:w-auto sm:max-w-none sm:min-w-[200px] sm:px-8 ${HERO_CTA_PRIMARY}`;
                return external ? (
                  <a
                    key={`${cta.href}-${cta.label}-${i}`}
                    href={cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {cta.label}
                  </a>
                ) : (
                  <Link key={`${cta.href}-${cta.label}-${i}`} to={cta.href} className={className}>
                    {cta.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        {mediaItems.length > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-1 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/30 sm:left-4 sm:h-12 sm:w-12 md:left-6"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-1 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/30 sm:right-4 sm:h-12 sm:w-12 md:right-6"
              aria-label="Next slide"
            >
              <ChevronRight className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.5} />
            </button>
            <div
              className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 gap-2 pb-1 sm:bottom-8"
              role="tablist"
              aria-label="Hero slides"
            >
              {mediaItems.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`h-2.5 w-2.5 rounded-full transition-all sm:h-3 sm:w-3 ${
                    i === current
                      ? "scale-125 bg-secondary shadow-[0_0_0_2px_rgba(255,255,255,0.45)]"
                      : "bg-white/45 hover:bg-white/75"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                  aria-selected={i === current}
                />
              ))}
            </div>
          </>
        ) : null}
      </section>

      <Link
        to="/book"
        className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 rounded-l-2xl bg-primary px-2.5 py-6 text-primary-foreground shadow-xl shadow-primary/35 transition-[filter] hover:brightness-110 lg:flex"
        aria-label="Book appointment"
      >
        <CalendarCheck className="h-5 w-5 shrink-0" aria-hidden />
        <span
          className="text-center text-[10px] font-bold uppercase leading-snug tracking-wider"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          Book appointment
        </span>
      </Link>
    </>
  );
};

export default HeroSection;
