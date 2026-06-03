import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Download, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { ServiceMark } from "@/components/service/ServiceMark";
import { RichText } from "@/components/content/RichText";
import { serviceDetails, type ServiceDetail, type ServiceCard } from "@/data/mockData";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { api, formatPageTitle, IS_STRAPI_CONFIGURED, USE_LOCAL_MOCK_HYDRATION } from "@/lib/api";

type RelatedNav = { slug: string; title: string; category: string; icon: string; iconImage?: string };

const ServicePage = () => {
  const { pathname } = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const { slug } = useParams<{ slug: string }>();
  const [service, setService] = useState<ServiceDetail | null | undefined>(() => {
    if (!slug) return null;
    if (USE_LOCAL_MOCK_HYDRATION) return serviceDetails[slug] ?? null;
    if (!IS_STRAPI_CONFIGURED) return null;
    return undefined;
  });
  const [allCards, setAllCards] = useState<ServiceCard[]>([]);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    api.services.getAll().then(setAllCards);
  }, []);

  useEffect(() => {
    if (!slug) {
      setService(null);
      return;
    }
    if (!IS_STRAPI_CONFIGURED) {
      setService(USE_LOCAL_MOCK_HYDRATION ? (serviceDetails[slug] ?? null) : null);
      return;
    }
    setService(undefined);
    let cancelled = false;
    (async () => {
      const s = await api.services.getBySlug(slug);
      if (!cancelled) setService(s ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const relatedForSidebar: RelatedNav[] =
    service && IS_STRAPI_CONFIGURED
      ? service.relatedSlugs
          .map((s) => allCards.find((c) => c.href === `/services/${s}`))
          .filter((c): c is ServiceCard => Boolean(c))
          .map((c) => ({
            slug: c.href.replace(/^\/services\//, ""),
            title: c.title,
            category: c.category,
            icon: c.icon,
            ...(c.iconImage ? { iconImage: c.iconImage } : {}),
          }))
      : service
        ? service.relatedSlugs
            .map((s) => serviceDetails[s])
            .filter((x): x is ServiceDetail => Boolean(x))
            .map((x) => ({
              slug: x.slug,
              title: x.title,
              category: x.category,
              icon: x.icon,
              ...(x.iconImage ? { iconImage: x.iconImage } : {}),
            }))
        : [];

  if (IS_STRAPI_CONFIGURED && service === undefined) {
    return (
      <Layout>
        <SeoHelmet
          layers={[]}
          fallbackTitle={formatPageTitle("Loading service", siteName)}
          fallbackDescription={siteConfig.tagline}
          pathForCanonical={pathname}
        />
        <section className="relative min-h-[320px] animate-pulse bg-muted" aria-busy="true" aria-label="Loading service" />
        <PageBreadcrumb items={[{ label: "Services", href: "/services" }, { label: "…" }]} />
        <div className="container space-y-6 py-[48px]">
          <div className="h-8 w-2/3 max-w-lg animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-1 gap-[32px] lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="h-32 animate-pulse rounded-lg bg-muted" />
              <div className="h-48 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="h-64 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!service) {
    return (
      <Layout>
        <SeoHelmet
          layers={[]}
          fallbackTitle={formatPageTitle("Service not found", siteName)}
          fallbackDescription="The requested service could not be found."
          pathForCanonical={pathname}
        />
        <div className="container py-[64px] text-center">
          <h1 className="font-heading text-3xl font-bold text-foreground">Service Not Found</h1>
          <p className="mt-[8px] font-body text-base text-muted-foreground">
            The service you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link to="/services">
            <Button className="mt-[24px] h-[44px] rounded-[4px] bg-primary px-[24px] py-[12px] font-heading text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Back to Services
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SeoHelmet
        layers={[service.seo]}
        fallbackTitle={formatPageTitle(service.title, siteName)}
        fallbackDescription={service.description.slice(0, 200)}
        fallbackTextForDescription={service.description}
        fallbackOgImage={service.heroImage}
        fallbackOgImageAlt={service.title}
        pathForCanonical={pathname}
        autoJsonLd={{ kind: "webpage", pageName: service.title }}
      />
      <section className="relative flex min-h-[320px] items-center overflow-hidden">
        {service.heroImage ? (
          <img
            src={service.heroImage}
            alt={service.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" aria-hidden />
        )}
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="container relative z-10 py-[48px]">
          <span className="mb-[8px] inline-block rounded bg-primary/20 px-[12px] py-[4px] font-body text-xs font-medium text-primary-foreground">
            {service.category}
          </span>
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">{service.title}</h1>
        </div>
      </section>

      <PageBreadcrumb items={[{ label: "Services", href: "/services" }, { label: service.title }]} />

      <div className="container py-[48px]">
        <div className="grid grid-cols-1 gap-[32px] lg:grid-cols-3">
          <div className="space-y-[48px] lg:col-span-2">
            <div>
              <h2 className="font-heading mb-[16px] text-2xl font-bold text-foreground">Overview</h2>
              <RichText value={service.description} />
            </div>

            <div>
              <h2 className="font-heading mb-[16px] text-2xl font-bold text-foreground">Tests Included</h2>
              <ul className="space-y-[12px]">
                {service.tests.map((t, i) => (
                  <li key={i} className="flex items-start gap-[12px]">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                    <span className="font-body text-sm text-foreground">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-heading mb-[16px] text-2xl font-bold text-foreground">Benefits</h2>
              <ul className="space-y-[12px]">
                {service.benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-[12px]">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span className="font-body text-sm text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-heading mb-[16px] text-2xl font-bold text-foreground">Pricing</h2>
              <div className="overflow-x-auto">
                <table className="w-full overflow-hidden rounded-lg border border-border border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-[16px] text-left font-heading text-sm font-semibold text-foreground">Package</th>
                      <th className="p-[16px] text-left font-heading text-sm font-semibold text-foreground">Price</th>
                      <th className="p-[16px] text-left font-heading text-sm font-semibold text-foreground">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {service.pricing.map((p, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                        <td className="p-[16px] font-body text-sm text-foreground">{p.item}</td>
                        <td className="p-[16px] font-heading text-sm font-semibold text-primary">{p.price}</td>
                        <td className="p-[16px] font-body text-sm text-muted-foreground">{p.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="font-heading mb-[16px] text-2xl font-bold text-foreground">Preparation Timeline</h2>
              <div className="relative pl-[32px]">
                <div className="absolute bottom-[8px] left-[11px] top-[8px] w-[2px] bg-border" />
                {service.timeline.map((step) => (
                  <div key={step.step} className="relative mb-[24px] last:mb-0">
                    <div className="absolute left-[-32px] top-[2px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-primary font-heading text-xs font-bold text-primary-foreground">
                      {step.step}
                    </div>
                    <h3 className="font-heading text-base font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-[4px] font-body text-sm text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-heading mb-[16px] text-2xl font-bold text-foreground">Required Documents</h2>
              <ul className="space-y-[12px]">
                {service.documents.map((doc, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-[16px]"
                  >
                    <div className="flex items-center gap-[12px]">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="font-body text-sm text-foreground">{doc.name}</span>
                      {doc.required && (
                        <span className="rounded bg-destructive/10 px-[8px] py-[2px] font-body text-xs font-medium text-destructive">
                          Required
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-[44px] w-[44px]" aria-label={`Download ${doc.name}`}>
                      <Download className="h-5 w-5" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-accent/10 p-[32px] text-center">
              <h2 className="font-heading text-2xl font-bold text-foreground">Ready to Get Started?</h2>
              <p className="mt-[8px] font-body text-sm text-muted-foreground">
                Book your {service.title.toLowerCase()} appointment today.
              </p>
              <Link to="/book">
                <Button className="mt-[24px] h-[48px] min-w-[220px] rounded-[4px] bg-accent px-[24px] py-[12px] font-heading text-base font-semibold text-accent-foreground shadow-md hover:bg-accent/90">
                  Book This Service
                </Button>
              </Link>
            </div>
          </div>

          <aside className="space-y-[24px]">
            <div className="sticky top-[112px] rounded-lg border border-border bg-card p-[24px]">
              <h3 className="font-heading mb-[16px] text-lg font-bold text-foreground">Related Services</h3>
              <ul className="space-y-[16px]">
                {relatedForSidebar.map((rs) => {
                  return (
                    <li key={rs.slug}>
                      <Link
                        to={`/services/${rs.slug}`}
                        className="flex items-center gap-[12px] rounded-lg p-[12px] transition-colors hover:bg-muted"
                      >
                        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <ServiceMark icon={rs.icon} iconImage={rs.iconImage} className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-heading text-sm font-semibold text-foreground">{rs.title}</p>
                          <p className="font-body text-xs text-muted-foreground">{rs.category}</p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-[24px] border-t border-border pt-[24px]">
                <Link to="/services">
                  <Button variant="outline" className="h-[44px] w-full rounded-[4px] font-heading text-sm font-semibold">
                    View All Services
                  </Button>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default ServicePage;
