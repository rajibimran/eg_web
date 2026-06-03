import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarDays, Clock, Search, Sparkles } from "lucide-react";
import Layout from "@/components/layout/Layout";
import PageHeroSlider from "@/components/PageHeroSlider";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { Input } from "@/components/ui/input";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { blogArticles as defaultBlogArticles } from "@/data/blogData";
import { api, createEmptyPageHero, formatPageTitle, IS_STRAPI_CONFIGURED, USE_LOCAL_MOCK_HYDRATION, type BlogArticle, type PageHero } from "@/lib/api";
import { cn } from "@/lib/utils";

const defaultBlogHero: PageHero = {
  page: "blog",
  title: "Health Resources",
  subtitle: "Articles, guides, and tips to help you prepare for your medical screening.",
  slides: [
    { src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&h=900&fit=crop", alt: "Health articles" },
    { src: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1600&h=900&fit=crop", alt: "Medical resources" },
    { src: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1600&h=900&fit=crop", alt: "Research and insights" },
  ],
  ctaButtons: [{ label: "Book Appointment", href: "/book", variant: "primary" }],
};

function BlogCard({ article, featured }: { article: BlogArticle; featured?: boolean }) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_8px_30px_-16px_rgba(10,37,64,0.2)] transition duration-300",
        "hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-[0_16px_44px_-18px_rgba(10,37,64,0.28)]",
        featured && "md:ring-2 md:ring-secondary/20",
      )}
    >
      <Link to={`/blog/${article.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-muted">
        {article.image ? (
          <img
            src={article.image}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-secondary/10">
            <BookOpen className="h-14 w-14 text-muted-foreground/30" aria-hidden />
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/45 via-transparent to-transparent opacity-90"
          aria-hidden
        />
        {article.category ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-wide text-secondary shadow-sm backdrop-blur-sm">
            {article.category}
          </span>
        ) : null}
        {featured ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-wide text-secondary-foreground shadow-md">
            <Sparkles className="h-3 w-3" aria-hidden />
            Featured
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <CalendarDays className="h-3.5 w-3.5 text-secondary/90" aria-hidden />
            {article.date}
          </span>
          {article.readMinutes != null ? (
            <>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {article.readMinutes} min read
              </span>
            </>
          ) : null}
        </div>
        <h3 className="mt-2 font-heading text-lg font-semibold leading-snug text-primary transition-colors group-hover:text-secondary">
          <Link to={`/blog/${article.slug}`}>{article.title}</Link>
        </h3>
        {article.author ? (
          <p className="mt-2 font-body text-xs text-muted-foreground">
            By <span className="font-medium text-foreground">{article.author.name}</span>
          </p>
        ) : null}
        <p className="mt-2 line-clamp-3 flex-1 font-body text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
        <Link
          to={`/blog/${article.slug}`}
          className="mt-4 inline-flex items-center gap-1 font-heading text-sm font-semibold text-secondary"
        >
          Read article
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

const Blog = () => {
  const { pathname } = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const [articles, setArticles] = useState<BlogArticle[] | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultBlogArticles : IS_STRAPI_CONFIGURED ? null : [],
  );
  const [hero, setHero] = useState<PageHero | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultBlogHero : IS_STRAPI_CONFIGURED ? null : createEmptyPageHero("blog"),
  );
  const [ready, setReady] = useState(!IS_STRAPI_CONFIGURED);
  const [searchQ, setSearchQ] = useState("");

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const [a, h] = await Promise.all([api.blog.getAll(defaultBlogArticles), api.hero.getByPage("blog", defaultBlogHero)]);
      if (!cancelled) {
        setArticles(a);
        setHero(h);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { featured, rest } = useMemo(() => {
    if (!articles?.length) return { featured: null as BlogArticle | null, rest: [] as BlogArticle[] };
    const q = searchQ.trim().toLowerCase();
    const pool = q
      ? articles.filter(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.excerpt.toLowerCase().includes(q) ||
            (a.category || "").toLowerCase().includes(q),
        )
      : articles;
    if (!pool.length) return { featured: null, rest: [] };
    const feat = pool.find((a) => a.isFeatured) ?? pool[0];
    return { featured: feat, rest: pool.filter((a) => a.slug !== feat.slug) };
  }, [articles, searchQ]);

  if (!ready || !hero) {
    return (
      <Layout>
        <SeoHelmet
          layers={hero?.seo ? [hero.seo] : []}
          fallbackTitle={formatPageTitle("Health Resources & Blog", siteName)}
          fallbackDescription={hero?.subtitle ?? defaultBlogHero.subtitle}
          fallbackOgImage={hero?.slides?.[0]?.src}
          fallbackOgImageAlt={hero?.slides?.[0]?.alt}
          pathForCanonical={pathname}
          autoJsonLd={{ kind: "webpage", pageName: "Health Resources & Blog" }}
        />
        <section className="relative min-h-[320px] animate-pulse bg-gradient-to-br from-secondary/5 to-muted/80" aria-busy="true" aria-label="Loading blog" />
        <PageBreadcrumb items={[{ label: "Blog" }]} />
        <div className="container grid grid-cols-1 gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted/90" />
          ))}
        </div>
      </Layout>
    );
  }

  if (!articles?.length) {
    return (
      <Layout>
        <SeoHelmet
          layers={[hero.seo]}
          fallbackTitle={formatPageTitle(hero.title || "Blog", siteName)}
          fallbackDescription={hero.subtitle}
          fallbackOgImage={hero.slides?.[0]?.src}
          fallbackOgImageAlt={hero.slides?.[0]?.alt}
          pathForCanonical={pathname}
          autoJsonLd={{ kind: "webpage", pageName: hero.title || "Blog" }}
        />
        <PageHeroSlider images={hero.slides} fallbackCtaButtons={hero.ctaButtons} title={hero.title} subtitle={hero.subtitle} />
        <PageBreadcrumb items={[{ label: "Blog" }]} />
        <div className="container py-16 text-center">
          <p className="font-body text-muted-foreground">No articles yet. Check back soon.</p>
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
        fallbackTitle={formatPageTitle(hero.title || "Health Resources & Blog", siteName)}
        fallbackDescription={hero.subtitle}
        fallbackOgImage={hero.slides?.[0]?.src}
        fallbackOgImageAlt={hero.slides?.[0]?.alt}
        pathForCanonical={pathname}
        autoJsonLd={{ kind: "webpage", pageName: hero.title || "Health Resources & Blog" }}
      />
      <PageHeroSlider images={hero.slides} fallbackCtaButtons={hero.ctaButtons} title={hero.title} subtitle={hero.subtitle} />

      <PageBreadcrumb items={[{ label: "Blog" }]} />

      <section className="border-t border-border/60 bg-gradient-to-b from-background via-muted/25 to-background py-8 sm:py-10">
        <div className="container max-w-6xl px-4 sm:px-6">
          <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
            <div className="mb-3 flex items-center justify-center gap-3">
              <span className="h-px max-w-[72px] flex-1 bg-gradient-to-r from-transparent to-border" aria-hidden />
              <span className="inline-flex items-center gap-1.5 font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary">
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                Resource library
              </span>
              <span className="h-px max-w-[72px] flex-1 bg-gradient-to-l from-transparent to-border" aria-hidden />
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary sm:text-3xl">Guides & insights</h1>
            <p className="mx-auto mt-2 max-w-lg font-body text-sm text-muted-foreground sm:text-[15px]">
              Practical reading for patients and agencies — same trusted voice as our clinic floor.
            </p>
          </header>

          <div className="mb-8 flex justify-center sm:justify-start">
            <label className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="search"
                placeholder="Search articles…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="h-10 rounded-full border-2 border-border/80 pl-10 font-body text-sm shadow-sm focus-visible:ring-secondary"
                aria-label="Search blog articles"
              />
            </label>
          </div>

          {!featured ? (
            <p className="py-12 text-center font-body text-sm text-muted-foreground">No articles match your search.</p>
          ) : (
            <>
              <div className="mb-8 sm:mb-10">
                <BlogCard article={featured} featured />
              </div>

              {rest.length > 0 ? (
                <>
                  <h2 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wide text-primary sm:mb-5">More articles</h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {rest.map((article) => (
                      <BlogCard key={article.slug} article={article} />
                    ))}
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
