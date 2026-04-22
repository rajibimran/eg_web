import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, CalendarDays, ChevronRight, Clock, Newspaper, Search } from "lucide-react";
import Layout from "@/components/layout/Layout";
import PageHeroSlider from "@/components/PageHeroSlider";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { Input } from "@/components/ui/input";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { newsPosts as defaultNewsPosts } from "@/data/newsData";
import { api, createEmptyPageHero, formatPageTitle, IS_STRAPI_CONFIGURED, USE_LOCAL_MOCK_HYDRATION, type NewsPost, type PageHero } from "@/lib/api";

const defaultNewsHero: PageHero = {
  page: "news",
  title: "News & Updates",
  subtitle: "Stay informed with the latest announcements, regulatory changes, and clinic updates.",
  slides: [
    { src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&h=900&fit=crop", alt: "News & Updates" },
    { src: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1600&h=900&fit=crop", alt: "Latest announcements" },
  ],
  ctaButtons: [{ label: "Book Appointment", href: "/book", variant: "primary" }],
};

function NewsFeedRow({ post }: { post: NewsPost }) {
  return (
    <li className="border-b border-border/70 last:border-0">
      <Link
        to={`/news/${post.slug}`}
        className="group flex gap-4 py-4 transition-colors hover:bg-muted/25 sm:gap-5 sm:py-5"
      >
        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:h-28 sm:w-36">
          {post.image ? (
            <img src={post.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40" aria-hidden>
              <Newspaper className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[11px] text-muted-foreground sm:text-xs">
            {post.category ? (
              <span className="font-heading font-semibold uppercase tracking-wide text-secondary">{post.category}</span>
            ) : null}
            {post.category ? <span className="text-border" aria-hidden>|</span> : null}
            <span className="inline-flex items-center gap-1 tabular-nums">
              <CalendarDays className="h-3 w-3 shrink-0 text-secondary/80" aria-hidden />
              {post.date}
            </span>
            {post.readMinutes != null ? (
              <>
                <span className="text-border" aria-hidden>|</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0" aria-hidden />
                  {post.readMinutes} min
                </span>
              </>
            ) : null}
          </div>
          <h3 className="mt-1.5 font-heading text-base font-semibold leading-snug text-primary transition-colors group-hover:text-secondary sm:text-lg">
            {post.title}
          </h3>
          <p className="mt-1 line-clamp-2 font-body text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
          <span className="mt-2 inline-flex items-center gap-0.5 font-heading text-xs font-semibold text-secondary">
            Read story
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </Link>
    </li>
  );
}

const News = () => {
  const { pathname } = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const [posts, setPosts] = useState<NewsPost[] | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultNewsPosts : IS_STRAPI_CONFIGURED ? null : [],
  );
  const [hero, setHero] = useState<PageHero | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultNewsHero : IS_STRAPI_CONFIGURED ? null : createEmptyPageHero("news"),
  );
  const [ready, setReady] = useState(!IS_STRAPI_CONFIGURED);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const [p, h] = await Promise.all([api.news.getAll(defaultNewsPosts), api.hero.getByPage("news", defaultNewsHero)]);
      if (!cancelled) {
        setPosts(p);
        setHero(h);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { featured, rest } = useMemo(() => {
    if (!posts?.length) return { featured: null as NewsPost | null, rest: [] as NewsPost[] };
    const q = searchQ.trim().toLowerCase();
    const pool = q
      ? posts.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.excerpt.toLowerCase().includes(q) ||
            (p.category || "").toLowerCase().includes(q),
        )
      : posts;
    if (!pool.length) return { featured: null, rest: [] };
    const feat = pool.find((p) => p.isFeatured) ?? pool[0];
    return { featured: feat, rest: pool.filter((p) => p.slug !== feat.slug) };
  }, [posts, searchQ]);

  if (!ready || !hero) {
    return (
      <Layout>
        <SeoHelmet
          layers={hero?.seo ? [hero.seo] : []}
          fallbackTitle={formatPageTitle("News & Updates", siteName)}
          fallbackDescription={hero?.subtitle ?? defaultNewsHero.subtitle}
          pathForCanonical={pathname}
        />
        <section className="relative min-h-[320px] animate-pulse bg-gradient-to-b from-muted to-background" aria-busy="true" aria-label="Loading news" />
        <PageBreadcrumb items={[{ label: "News & Updates" }]} />
        <div className="container max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-8 h-48 animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/80" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!posts?.length) {
    return (
      <Layout>
        <SeoHelmet
          layers={[hero.seo]}
          fallbackTitle={formatPageTitle(hero.title || "News & Updates", siteName)}
          fallbackDescription={hero.subtitle}
          pathForCanonical={pathname}
        />
        <PageHeroSlider images={hero.slides} fallbackCtaButtons={hero.ctaButtons} title={hero.title} subtitle={hero.subtitle} />
        <PageBreadcrumb items={[{ label: "News & Updates" }]} />
        <div className="container py-16 text-center">
          <p className="font-body text-muted-foreground">No news posts yet. Check back soon.</p>
          <Link to="/" className="mt-4 inline-block font-heading text-sm font-semibold text-secondary hover:underline">
            Back to home
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SeoHelmet
        layers={[hero.seo]}
        fallbackTitle={formatPageTitle(hero.title || "News & Updates", siteName)}
        fallbackDescription={hero.subtitle}
        pathForCanonical={pathname}
      />
      <PageHeroSlider images={hero.slides} fallbackCtaButtons={hero.ctaButtons} title={hero.title} subtitle={hero.subtitle} />

      <PageBreadcrumb items={[{ label: "News & Updates" }]} />

      <section className="border-t border-border/60 bg-gradient-to-b from-muted/40 via-background to-background py-8 sm:py-10">
        <div className="container max-w-4xl px-4 sm:px-6">
          <header className="mb-6 text-center sm:mb-8">
            <div className="mb-2 flex items-center justify-center gap-3">
              <span className="h-px max-w-[56px] flex-1 bg-gradient-to-r from-transparent to-border sm:max-w-[80px]" aria-hidden />
              <span className="inline-flex items-center gap-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
                <Newspaper className="h-3.5 w-3.5" aria-hidden />
                News desk
              </span>
              <span className="h-px max-w-[56px] flex-1 bg-gradient-to-l from-transparent to-border sm:max-w-[80px]" aria-hidden />
            </div>
            <h1 className="font-heading text-xl font-semibold text-primary sm:text-2xl">Latest headlines</h1>
            <p className="mx-auto mt-1 max-w-lg font-body text-sm text-muted-foreground">
              Official updates and announcements from {siteName}.
            </p>
          </header>

          <div className="mb-6">
            <label className="relative block max-w-md mx-auto sm:mx-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="search"
                placeholder="Search headlines…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="h-10 rounded-full border-2 border-border/80 pl-10 font-body text-sm shadow-sm focus-visible:ring-secondary"
                aria-label="Search news posts"
              />
            </label>
          </div>

          {!featured ? (
            <p className="py-12 text-center font-body text-sm text-muted-foreground">No posts match your search.</p>
          ) : (
            <>
              <article className="mb-8 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_12px_40px_-20px_rgba(10,37,64,0.25)] sm:mb-10">
                <div className="grid md:grid-cols-5 md:gap-0">
                  <div className="relative aspect-[16/10] md:col-span-2 md:aspect-auto md:min-h-[240px]">
                    {featured.image ? (
                      <img src={featured.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                        <Newspaper className="h-16 w-16 text-primary/25" aria-hidden />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/55 via-primary/10 to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-card" aria-hidden />
                  </div>
                  <div className="flex flex-col justify-center border-t border-border/60 p-5 md:col-span-3 md:border-t-0 md:border-l md:px-8 md:py-8">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
                      {featured.category ? (
                        <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 font-heading font-semibold uppercase tracking-wide text-secondary">
                          {featured.category}
                        </span>
                      ) : null}
                      {featured.isFeatured ? (
                        <span className="rounded-full bg-primary px-2.5 py-0.5 font-heading font-semibold uppercase tracking-wide text-primary-foreground">
                          Lead story
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <CalendarDays className="h-3.5 w-3.5 text-secondary" aria-hidden />
                        {featured.date}
                      </span>
                    </div>
                    <h2 className="mt-3 font-heading text-xl font-semibold leading-tight tracking-tight text-primary sm:text-2xl md:text-[1.65rem]">
                      {featured.title}
                    </h2>
                    <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{featured.excerpt}</p>
                    <Link
                      to={`/news/${featured.slug}`}
                      className="mt-4 inline-flex w-fit items-center gap-1 rounded-full border-2 border-primary bg-primary px-4 py-2 font-heading text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 sm:text-sm"
                    >
                      Continue reading
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              </article>

              <div className="rounded-2xl border border-border/60 bg-card/50 px-1 sm:px-2">
                <div className="flex items-center justify-between border-b border-border/60 px-3 py-3 sm:px-4">
                  <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-primary">More coverage</h2>
                  <span className="font-body text-xs text-muted-foreground tabular-nums">{rest.length} stories</span>
                </div>
                <ul className="px-2 sm:px-3" role="list">
                  {rest.map((post) => (
                    <NewsFeedRow key={post.slug} post={post} />
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default News;
