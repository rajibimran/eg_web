import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/lib/api";
import { cn } from "@/lib/utils";

type SlideMediaItem =
  | (HeroSlide & { kind?: "image" })
  | { src: string; alt: string; kind: "video"; title?: string; text?: string };

export type HeroCtaItem = NonNullable<HeroSlide["ctaButtons"]>[number];

const CTA_PRIMARY =
  "inline-flex h-12 min-h-[48px] w-full max-w-md items-center justify-center rounded-full bg-secondary px-5 font-heading text-sm font-bold uppercase tracking-wide text-secondary-foreground shadow-lg shadow-primary/20 transition-[filter] hover:brightness-110 sm:w-auto sm:max-w-none sm:min-w-[180px] sm:px-8 sm:text-base";

const CTA_SECONDARY =
  "inline-flex h-12 min-h-[48px] w-full max-w-md items-center justify-center rounded-full border-2 border-white/90 bg-white/12 px-5 font-heading text-sm font-semibold text-white shadow-md backdrop-blur-md transition-colors hover:bg-white/22 sm:w-auto sm:max-w-none sm:min-w-[160px] sm:px-6 sm:text-base";

interface PageHeroSliderProps {
  images: HeroSlide[];
  fallbackCtaButtons?: HeroCtaItem[];
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  height?: string;
  promoVideoUrl?: string;
}

const PageHeroSlider = ({
  images,
  fallbackCtaButtons,
  title,
  subtitle,
  children,
  height = "min-h-[min(58vh,520px)] sm:min-h-[min(62vh,580px)]",
  promoVideoUrl,
}: PageHeroSliderProps) => {
  const [current, setCurrent] = useState(0);
  const mediaItems: SlideMediaItem[] = useMemo(() => {
    const imgs = images.map((img) => ({ ...img, kind: "image" as const }));
    if (promoVideoUrl) {
      return [...imgs, { src: promoVideoUrl, alt: "Promotional video", kind: "video" as const }];
    }
    return imgs;
  }, [images, promoVideoUrl]);

  const overlay = (() => {
    const item = mediaItems[current];
    if (!item) return { headline: title, sub: subtitle };
    if ("kind" in item && item.kind === "video") return { headline: title, sub: subtitle };
    const img = item as HeroSlide;
    return {
      headline: img.title?.trim() || title,
      sub: img.text?.trim() || subtitle,
    };
  })();

  const ctasForCurrent = useMemo((): HeroCtaItem[] => {
    const item = mediaItems[current];
    if (!item) return fallbackCtaButtons ?? [];
    if ("kind" in item && item.kind === "video") return fallbackCtaButtons ?? [];
    const slide = item as HeroSlide;
    if (slide.ctaButtons && slide.ctaButtons.length > 0) return slide.ctaButtons;
    return fallbackCtaButtons ?? [];
  }, [current, mediaItems, fallbackCtaButtons]);

  const len = Math.max(1, mediaItems.length);
  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % len);
  }, [len]);
  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + len) % len);
  }, [len]);

  useEffect(() => {
    if (mediaItems.length <= 1) return;
    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [next, mediaItems.length]);

  const multi = mediaItems.length > 1;

  return (
    <section
      className={cn("relative flex items-center justify-center overflow-hidden", height)}
      aria-roledescription="carousel"
    >
      {mediaItems.length === 0 ? <div className="absolute inset-0 bg-muted" aria-hidden /> : null}
      {mediaItems.map((item, i) =>
        item.kind === "video" ? (
          <video
            key={item.src}
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
              i === current ? "opacity-100" : "opacity-0",
            )}
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
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
              i === current ? "opacity-100" : "opacity-0",
            )}
            loading={i === 0 ? "eager" : "lazy"}
            width={1600}
            height={900}
          />
        ),
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/92 via-primary/65 to-secondary/45" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-primary/25" aria-hidden />

      <div
        className={cn(
          "container relative z-10 px-4 text-center sm:px-6",
          multi ? "pb-24 pt-12 sm:pb-28 sm:pt-16" : "py-12 sm:py-16",
        )}
      >
        <h1 className="font-heading text-[clamp(1.5rem,4vw+0.5rem,3.25rem)] font-extrabold leading-[1.15] tracking-tight text-white drop-shadow-sm sm:text-4xl md:text-5xl break-words">
          {overlay.headline}
        </h1>
        {overlay.sub ? (
          <p className="mx-auto mt-3 max-w-2xl font-body text-base font-medium leading-snug text-white/92 sm:mt-4 sm:text-lg md:text-xl">
            {overlay.sub}
          </p>
        ) : null}
        {ctasForCurrent.length > 0 ? (
          <div className="mt-6 flex w-full max-w-2xl flex-col items-stretch justify-center gap-3 px-1 sm:mx-auto sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            {ctasForCurrent.map((cta, i) => {
              const external = /^https?:\/\//i.test(cta.href);
              const isSecondary = cta.variant === "secondary";
              const className = isSecondary ? CTA_SECONDARY : CTA_PRIMARY;
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
        {children}
      </div>

      {multi ? (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-1 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/30 sm:left-4 md:left-6"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-1 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/30 sm:right-4 md:right-6"
            aria-label="Next slide"
          >
            <ChevronRight className="h-7 w-7" strokeWidth={2.5} />
          </button>
          <div
            className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2 gap-2 pb-1 sm:bottom-6"
            role="tablist"
            aria-label="Hero slides"
          >
            {mediaItems.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all sm:h-3 sm:w-3",
                  i === current
                    ? "scale-125 bg-secondary shadow-[0_0_0_2px_rgba(255,255,255,0.45)]"
                    : "bg-white/45 hover:bg-white/75",
                )}
                aria-label={`Slide ${i + 1}`}
                aria-selected={i === current}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
};

export default PageHeroSlider;
