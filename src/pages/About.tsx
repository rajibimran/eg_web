import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import PageHeroSlider from "@/components/PageHeroSlider";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { RichText } from "@/components/content/RichText";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import {
  api,
  createEmptyPageHero,
  defaultAboutPage,
  formatPageTitle,
  getEmptyAboutPageContent,
  IS_MOCK_DATA_ENABLED,
  type AboutPageContent,
  type PageHero,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const defaultAboutHero: PageHero = {
  page: "about",
  title: "About Us",
  subtitle: "Trusted, GCC-approved diagnostics and visa medicals — clear processes, modern facilities, patient-first care.",
  slides: [
    { src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&h=900&fit=crop", alt: "Medical facility reception" },
    { src: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=1600&h=900&fit=crop", alt: "Laboratory diagnostics" },
    { src: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1600&h=900&fit=crop", alt: "Patient examination room" },
  ],
  ctaButtons: [
    { label: "Book Appointment", href: "/book", variant: "primary" },
    { label: "Our Services", href: "/services", variant: "secondary" },
  ],
};

const proseMuted = cn(
  "font-body text-sm leading-relaxed text-muted-foreground sm:text-base",
  "[&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-foreground",
);

function toYouTubeEmbedUrl(input?: string): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const id = url.searchParams.get("v") ?? "";
        return id ? `https://www.youtube.com/embed/${id}` : "";
      }
      if (url.pathname.startsWith("/embed/")) return raw;
      if (url.pathname.startsWith("/shorts/")) {
        const id = url.pathname.split("/").filter(Boolean)[1] ?? "";
        return id ? `https://www.youtube.com/embed/${id}` : "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <header className={cn("mx-auto mb-8 max-w-2xl text-center sm:mb-10", className)}>
      <div className="mb-3 flex items-center justify-center gap-3">
        <span className="h-px max-w-[72px] flex-1 bg-gradient-to-r from-transparent to-border sm:max-w-[100px]" aria-hidden />
        <p className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary sm:text-[11px]">{eyebrow}</p>
        <span className="h-px max-w-[72px] flex-1 bg-gradient-to-l from-transparent to-border sm:max-w-[100px]" aria-hidden />
      </div>
      <h2 className="font-heading text-xl font-semibold tracking-tight text-primary sm:text-2xl md:text-3xl">{title}</h2>
      {subtitle ? (
        <p className="mx-auto mt-2 max-w-lg font-body text-sm leading-snug text-muted-foreground sm:text-[15px]">{subtitle}</p>
      ) : null}
    </header>
  );
}

const About = () => {
  const { pathname } = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const [content, setContent] = useState<AboutPageContent | null>(null);
  const [hero, setHero] = useState<PageHero | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [aboutData, heroData] = await Promise.all([
          api.about.get(),
          api.hero.getByPage("about", defaultAboutHero),
        ]);
        if (!cancelled) {
          setContent(aboutData);
          setHero(heroData);
        }
      } catch {
        if (!cancelled) {
          setContent(IS_MOCK_DATA_ENABLED ? defaultAboutPage : getEmptyAboutPageContent());
          setHero(IS_MOCK_DATA_ENABLED ? defaultAboutHero : createEmptyPageHero("about"));
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const aboutDesc =
    content?.missionText?.slice(0, 180) ?? defaultAboutPage.missionText.slice(0, 180);
  const virtualTourEmbedUrl = toYouTubeEmbedUrl(content?.virtualTourYoutubeUrl);

  return (
    <Layout>
      <SeoHelmet
        layers={ready && hero ? [hero.seo, content?.seo] : []}
        fallbackTitle={formatPageTitle("About Us", siteName)}
        fallbackDescription={aboutDesc}
        fallbackTextForDescription={content?.missionText}
        fallbackOgImage={hero?.slides?.[0]?.src}
        fallbackOgImageAlt={hero?.slides?.[0]?.alt}
        pathForCanonical={pathname}
        autoJsonLd={{ kind: "webpage", pageName: "About Us" }}
      />
      {!ready || !hero ? (
        <section
          className="relative flex min-h-[min(58vh,480px)] items-center justify-center bg-muted"
          aria-busy="true"
          aria-label="Loading"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-secondary border-t-transparent" />
        </section>
      ) : (
        <PageHeroSlider
          images={hero.slides}
          fallbackCtaButtons={hero.ctaButtons}
          title={hero.title}
          subtitle={hero.subtitle}
          promoVideoUrl={hero.promoVideoUrl}
        />
      )}

      <PageBreadcrumb items={[{ label: "About Us" }]} />

      {!ready || !content ? (
        <div className="container min-w-0 space-y-10 px-4 py-10 sm:px-6 sm:py-14" aria-busy="true" aria-label="Loading content">
          <div className="mx-auto h-8 max-w-xs animate-pulse rounded-lg bg-muted" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-muted/80" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl border border-border/60 bg-card" />
            ))}
          </div>
        </div>
      ) : null}

      {ready && content ? (
        <>
          {/* Mission */}
          <section className="border-t border-border/80 bg-gradient-to-b from-background to-muted/30 py-10 sm:py-14">
            <div className="container min-w-0 px-4 sm:px-6">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
                <div className="order-2 min-w-0 lg:order-1">
                  <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">Clinical mission</p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                    {content.missionTitle}
                  </h2>
                  <div className="mt-3 h-1 w-12 rounded-full bg-secondary" aria-hidden />
                  <RichText value={content.missionText} className={cn("mt-5", proseMuted)} />
                </div>
                <div className="order-1 lg:order-2">
                  <div
                    className={cn(
                      "overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_32px_-12px_rgba(10,37,64,0.15)]",
                      "ring-1 ring-primary/[0.04]",
                    )}
                  >
                    <img
                      src={content.missionImage}
                      alt=""
                      className="aspect-[4/3] h-full w-full object-cover sm:aspect-auto sm:min-h-[280px]"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Center */}
          <section className="border-t border-border/80 bg-gradient-to-b from-muted/40 via-background to-muted/25 py-10 sm:py-14">
            <div className="container min-w-0 px-4 sm:px-6">
              <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
                <div className="order-2 rounded-2xl border border-border/70 bg-card shadow-md ring-1 ring-primary/[0.04] lg:order-1">
                  <div className="h-1 w-full bg-gradient-to-r from-secondary to-secondary/60" aria-hidden />
                  <div className="overflow-hidden rounded-b-2xl">
                    <img
                      src={content.centerImage}
                      alt=""
                      className="aspect-[4/3] w-full object-cover sm:aspect-auto sm:min-h-[280px]"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="order-1 min-w-0 lg:order-2">
                  <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">Our center</p>
                  <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
                    {content.centerTitle}
                  </h2>
                  <div className="mt-3 h-1 w-12 rounded-full bg-secondary" aria-hidden />
                  <RichText value={content.centerText} className={cn("mt-5", proseMuted)} />
                </div>
              </div>
            </div>
          </section>

          {/* Key Values */}
          <section className="border-t border-border/80 bg-background py-10 sm:py-14">
            <div className="container min-w-0 px-4 sm:px-6">
              <SectionHeader eyebrow="Why choose us" title={content.valuesSectionTitle} />
              <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {content.values.map((v) => (
                  <article
                    key={v.title}
                    className={cn(
                      "flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card text-center shadow-[0_4px_24px_-8px_rgba(10,37,64,0.12)]",
                      "transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-10px_rgba(10,37,64,0.16)]",
                    )}
                  >
                    <div className="h-1 w-full bg-gradient-to-r from-secondary to-secondary/50" aria-hidden />
                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <div className="overflow-hidden rounded-xl">
                        <img
                          src={v.img}
                          alt={v.alt}
                          className="h-36 w-full object-cover sm:h-40"
                          loading="lazy"
                        />
                      </div>
                      <h3 className="mt-4 font-heading text-base font-semibold text-primary sm:text-lg">{v.title}</h3>
                      <p className="mt-2 font-body text-sm leading-snug text-muted-foreground">{v.desc}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Facility Gallery + Virtual Tour */}
          <section className="border-t border-border/80 bg-gradient-to-b from-muted/35 to-background py-10 sm:py-14">
            <div className="container min-w-0 px-4 sm:px-6">
              <SectionHeader
                eyebrow="Facilities"
                title={content.facilityGalleryTitle}
                subtitle={content.facilityGallerySubtitle}
              />
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 lg:gap-5">
                {content.gallery.map((img, i) => (
                  <div
                    key={`${img.src}-${i}`}
                    className="mb-4 break-inside-avoid overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm ring-1 ring-primary/[0.03] sm:mb-5"
                  >
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              <div className="mx-auto mt-10 max-w-4xl sm:mt-12">
                <div className="mb-4 flex items-center justify-center gap-3 sm:mb-6">
                  <span className="h-px max-w-[48px] flex-1 bg-gradient-to-r from-transparent to-border" aria-hidden />
                  <h3 className="shrink-0 font-heading text-lg font-semibold text-primary sm:text-xl">Virtual tour</h3>
                  <span className="h-px max-w-[48px] flex-1 bg-gradient-to-l from-transparent to-border" aria-hidden />
                </div>
                <div
                  className={cn(
                    "relative aspect-video w-full overflow-hidden rounded-2xl border border-border/70 bg-muted/30",
                    "shadow-[0_8px_32px_-12px_rgba(10,37,64,0.14)] ring-1 ring-primary/[0.05]",
                  )}
                >
                  {virtualTourEmbedUrl ? (
                    <iframe
                      src={virtualTourEmbedUrl}
                      title="Virtual Tour"
                      className="h-full w-full"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full min-h-[200px] flex-col items-center justify-center bg-gradient-to-br from-card to-muted/50 px-4 py-10 text-center sm:min-h-[240px]">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-secondary/25 bg-secondary/10 sm:h-16 sm:w-16">
                        <Play className="h-7 w-7 text-secondary sm:h-8 sm:w-8" strokeWidth={2} aria-hidden />
                      </div>
                      <p className="font-heading text-base font-semibold text-primary sm:text-lg">Virtual tour coming soon</p>
                      <p className="mt-1 max-w-sm font-body text-sm text-muted-foreground">
                        Add a YouTube URL in Strapi (About page) to embed your walkthrough.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </Layout>
  );
};

export default About;
