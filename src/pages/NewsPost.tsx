import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CalendarDays, Clock, Newspaper, Share2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { RichText } from "@/components/content/RichText";
import { PostCommentsSection } from "@/components/comments/PostCommentsSection";
import { newsPosts as defaultNewsPosts } from "@/data/newsData";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { api, formatPageTitle, IS_STRAPI_CONFIGURED, USE_LOCAL_MOCK_HYDRATION, type NewsPost } from "@/lib/api";
import { cn } from "@/lib/utils";

const newsArticleProse =
  "font-body [&_h1]:font-heading [&_h1]:text-2xl [&_h1]:text-primary [&_h2]:font-heading [&_h2]:text-primary [&_h3]:font-heading [&_h3]:text-primary [&_blockquote]:border-secondary [&_blockquote]:bg-muted/30 [&_blockquote]:py-1 [&_a]:text-secondary [&_a]:hover:text-secondary/80";

const NewsPostPage = () => {
  const { pathname } = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<NewsPost | null | undefined>(() => {
    if (!slug) return null;
    if (USE_LOCAL_MOCK_HYDRATION) return defaultNewsPosts.find((p) => p.slug === slug) ?? null;
    if (!IS_STRAPI_CONFIGURED) return null;
    return undefined;
  });

  useEffect(() => {
    if (!slug) return;
    if (!IS_STRAPI_CONFIGURED) {
      setPost(USE_LOCAL_MOCK_HYDRATION ? (defaultNewsPosts.find((p) => p.slug === slug) ?? null) : null);
      return;
    }
    let cancelled = false;
    (async () => {
      const row = await api.news.getBySlug(slug, defaultNewsPosts);
      if (!cancelled) setPost(row ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  if (IS_STRAPI_CONFIGURED && post === undefined) {
    return (
      <Layout>
        <div className="h-2 bg-primary/20" aria-busy="true" aria-label="Loading news post" />
        <section className="min-h-[360px] animate-pulse bg-gradient-to-b from-muted to-background" />
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <SeoHelmet layers={[]} fallbackTitle={formatPageTitle("News post not found", siteName)} pathForCanonical={pathname} />
        <div className="container max-w-lg py-20 text-center">
          <h1 className="font-heading text-2xl font-semibold text-primary">Story not found</h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">This item may have moved or is no longer published.</p>
          <Link to="/news" className="mt-6 inline-flex rounded-full border-2 border-primary px-5 py-2 font-heading text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground">
            News index
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SeoHelmet
        layers={[post.seo]}
        fallbackTitle={formatPageTitle(post.title, siteName)}
        fallbackDescription={post.excerpt}
        pathForCanonical={pathname}
      />

      <div className="border-b border-border/60 bg-primary text-primary-foreground">
        <div className="container max-w-3xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-primary-foreground/85 sm:text-xs">
            <Newspaper className="h-3.5 w-3.5 text-secondary" aria-hidden />
            <span>News</span>
            {post.category ? (
              <>
                <span className="text-primary-foreground/40" aria-hidden>
                  /
                </span>
                <span className="text-secondary">{post.category}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <PageBreadcrumb items={[{ label: "News", href: "/news" }, { label: post.title }]} />

      <article className="border-t border-border/40 bg-gradient-to-b from-muted/30 to-background pb-10 pt-6 sm:pb-14 sm:pt-8">
        <div className="container max-w-3xl px-4 sm:px-6">
          <header className="border-b border-border/60 pb-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-xs text-muted-foreground sm:text-sm">
              <span className="inline-flex items-center gap-1.5 tabular-nums">
                <CalendarDays className="h-4 w-4 text-secondary" aria-hidden />
                {post.date}
              </span>
              {post.readMinutes != null ? (
                <>
                  <span className="hidden text-border sm:inline" aria-hidden>
                    |
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" aria-hidden />
                    {post.readMinutes} min read
                  </span>
                </>
              ) : null}
            </div>
            <h1 className="mt-4 font-heading text-2xl font-semibold leading-tight tracking-tight text-primary sm:text-3xl md:text-[2rem] md:leading-[1.2]">
              {post.title}
            </h1>
            {post.author ? (
              <p className="mt-3 font-body text-sm text-muted-foreground">
                <span className="text-foreground/80">By</span>{" "}
                <span className="font-semibold text-foreground">{post.author.name}</span>
              </p>
            ) : null}
            {post.excerpt ? (
              <p className="mt-5 border-l-[3px] border-secondary bg-card/80 py-3 pl-4 pr-3 font-body text-base font-medium leading-relaxed text-foreground/90 shadow-sm sm:text-[17px]">
                {post.excerpt}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 font-heading text-xs font-semibold text-primary transition hover:border-secondary/50"
                onClick={() => {
                  try {
                    void navigator.clipboard.writeText(shareUrl);
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <Share2 className="h-3.5 w-3.5" aria-hidden />
                Copy link
              </button>
            </div>
          </header>

          {post.image ? (
            <figure className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-muted shadow-sm sm:rounded-2xl">
              <img src={post.image} alt="" className="aspect-[21/9] w-full object-cover sm:aspect-[2/1]" loading="eager" />
            </figure>
          ) : null}

          <div className={cn("prose-news mx-auto mt-8 max-w-2xl")}>
            <RichText value={post.content?.trim() ? post.content : post.excerpt} className={newsArticleProse} />
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm sm:p-6">
            <PostCommentsSection postType="news-post" slug={post.slug} commentsOpen={post.commentsOpen !== false} />
          </div>

          <div className="mx-auto mt-8 max-w-2xl text-center">
            <Link
              to="/news"
              className="inline-flex items-center gap-1 font-heading text-sm font-semibold text-secondary hover:underline"
            >
              ← Back to all news
            </Link>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default NewsPostPage;
