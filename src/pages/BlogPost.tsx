import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { BookOpen, CalendarDays, Clock } from "lucide-react";
import Layout from "@/components/layout/Layout";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { RichText } from "@/components/content/RichText";
import { PostCommentsSection } from "@/components/comments/PostCommentsSection";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { api, formatPageTitle, IS_STRAPI_CONFIGURED, USE_LOCAL_MOCK_HYDRATION, type BlogArticle } from "@/lib/api";
import { blogArticles as defaultBlogArticles } from "@/data/blogData";
import { cn } from "@/lib/utils";

const blogArticleProse =
  "font-body sm:text-[17px] sm:leading-[1.75] [&_h1]:font-heading [&_h1]:text-2xl [&_h1]:text-primary [&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:text-primary [&_h3]:font-heading [&_h3]:text-lg [&_h3]:text-primary [&_p]:text-muted-foreground [&_blockquote]:rounded-r-xl [&_blockquote]:border-l-4 [&_blockquote]:border-secondary/70 [&_blockquote]:bg-muted/40 [&_blockquote]:py-2 [&_blockquote]:pl-4 [&_blockquote]:not-italic [&_a]:font-semibold [&_a]:text-secondary";

const BlogPost = () => {
  const { pathname } = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogArticle | null | undefined>(() => {
    if (!slug) return null;
    if (USE_LOCAL_MOCK_HYDRATION) return defaultBlogArticles.find((p) => p.slug === slug) ?? null;
    if (!IS_STRAPI_CONFIGURED) return null;
    return undefined;
  });

  useEffect(() => {
    if (!slug) return;
    if (!IS_STRAPI_CONFIGURED) {
      setPost(USE_LOCAL_MOCK_HYDRATION ? (defaultBlogArticles.find((p) => p.slug === slug) ?? null) : null);
      return;
    }
    let cancelled = false;
    (async () => {
      const row = await api.blog.getBySlug(slug, defaultBlogArticles);
      if (!cancelled) setPost(row ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (IS_STRAPI_CONFIGURED && post === undefined) {
    return (
      <Layout>
        <div className="h-1.5 bg-gradient-to-r from-secondary/40 via-primary/30 to-secondary/40" aria-busy="true" aria-label="Loading blog post" />
        <section className="min-h-[360px] animate-pulse bg-gradient-to-b from-background to-muted/50" />
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <SeoHelmet layers={[]} fallbackTitle={formatPageTitle("Blog post not found", siteName)} pathForCanonical={pathname} />
        <div className="container max-w-lg py-20 text-center">
          <h1 className="font-heading text-2xl font-semibold text-primary">Article not found</h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">The guide you’re looking for isn’t here.</p>
          <Link
            to="/blog"
            className="mt-6 inline-flex rounded-full bg-secondary px-5 py-2.5 font-heading text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
          >
            Browse resources
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

      <div className="relative overflow-hidden bg-gradient-to-br from-muted/80 via-background to-secondary/5">
        <div
          className="pointer-events-none absolute -right-24 top-0 h-56 w-56 rounded-full bg-secondary/10 blur-3xl"
          aria-hidden
        />
        <div className="container relative max-w-3xl px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-wider text-secondary shadow-sm backdrop-blur-sm">
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            Blog
            {post.category ? (
              <>
                <span className="text-border">·</span>
                <span className="text-primary">{post.category}</span>
              </>
            ) : null}
          </div>
          <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-primary sm:text-3xl md:text-[2.25rem] md:leading-[1.15]">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 font-body text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <CalendarDays className="h-4 w-4 text-secondary" aria-hidden />
              {post.date}
            </span>
            {post.readMinutes != null ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden />
                {post.readMinutes} min read
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <PageBreadcrumb items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />

      <article className="pb-12 pt-2 sm:pb-16">
        <div className="container max-w-3xl px-4 sm:px-6">
          {post.image ? (
            <div className="-mt-4 overflow-hidden rounded-3xl border border-border/50 bg-muted shadow-[0_20px_50px_-24px_rgba(10,37,64,0.35)] sm:-mt-6">
              <img src={post.image} alt="" className="aspect-[16/9] w-full object-cover sm:aspect-[2/1]" loading="eager" />
            </div>
          ) : null}

          {post.author ? (
            <div
              className={cn(
                "mt-6 flex items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:mt-8 sm:p-5",
                !post.image && "mt-6 sm:mt-8",
              )}
            >
              {post.author.avatarUrl ? (
                <img
                  src={post.author.avatarUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-secondary/20"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 font-heading text-lg font-bold text-secondary" aria-hidden>
                  {post.author.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-heading text-sm font-semibold text-primary">{post.author.name}</p>
                <p className="mt-0.5 font-body text-xs text-muted-foreground">Clinical content team · {siteName}</p>
              </div>
            </div>
          ) : null}

          {post.excerpt ? (
            <p className="mt-6 rounded-2xl border border-dashed border-secondary/35 bg-secondary/5 px-4 py-3 font-body text-base leading-relaxed text-foreground/90 sm:px-5 sm:py-4 sm:text-lg">
              {post.excerpt}
            </p>
          ) : null}

          <div className="mt-8 sm:mt-10">
            <RichText value={post.content?.trim() ? post.content : post.excerpt} className={blogArticleProse} />
          </div>

          <div className="mt-12 rounded-2xl border border-border/50 bg-muted/30 p-5 sm:p-8">
            <PostCommentsSection postType="article" slug={post.slug} commentsOpen={post.commentsOpen !== false} />
          </div>

          <div className="mt-10 text-center">
            <Link to="/blog" className="inline-flex items-center gap-1 font-heading text-sm font-semibold text-secondary hover:underline">
              ← More articles
            </Link>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
