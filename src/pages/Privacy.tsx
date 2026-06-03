import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { RichText } from "@/components/content/RichText";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import {
  api,
  defaultPrivacyPageConfig,
  formatPageTitle,
  getEmptyPrivacyPageConfig,
  IS_STRAPI_CONFIGURED,
  USE_LOCAL_MOCK_HYDRATION,
  type PrivacyPageConfig,
} from "@/lib/api";

const Privacy = () => {
  const { pathname } = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const [pageConfig, setPageConfig] = useState<PrivacyPageConfig | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultPrivacyPageConfig : IS_STRAPI_CONFIGURED ? null : getEmptyPrivacyPageConfig()
  );

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const cfg = await api.privacyPage.get();
      if (!cancelled) setPageConfig(cfg);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const title = pageConfig?.title?.trim() || "Privacy Policy";
  const fallbackDescription =
    siteConfig.defaultSeo?.metaDescription?.trim() ||
    `How ${siteName} collects, uses, and protects your personal and medical information.`;

  return (
    <Layout>
      <SeoHelmet
        layers={pageConfig?.seo ? [pageConfig.seo] : []}
        fallbackTitle={formatPageTitle(title, siteName)}
        fallbackDescription={fallbackDescription}
        fallbackOgImage={siteConfig.logo}
        fallbackOgImageAlt={`${siteName} logo`}
        pathForCanonical={pathname}
        autoJsonLd={{ kind: "webpage", pageName: title }}
      />
      <div className="bg-primary py-[48px]">
        <div className="container text-center">
          <h1 className="font-heading text-3xl font-extrabold text-primary-foreground sm:text-4xl">
            {IS_STRAPI_CONFIGURED && pageConfig === null ? (
              <span className="inline-block h-9 w-64 animate-pulse rounded bg-primary-foreground/20 sm:h-10 sm:w-80" />
            ) : (
              title
            )}
          </h1>
        </div>
      </div>
      <PageBreadcrumb items={[{ label: "Privacy Policy" }]} />
      <section className="py-[48px]">
        <div className="container max-w-3xl prose prose-sm">
          {IS_STRAPI_CONFIGURED && pageConfig === null ? (
            <div className="space-y-[24px]" aria-busy="true">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <div className="space-y-[24px] font-body text-sm text-muted-foreground leading-relaxed">
              {pageConfig?.intro ? (
                <RichText value={pageConfig.intro} className="[&_p]:mb-3 last:[&_p]:mb-0" />
              ) : null}
              {(pageConfig?.sections ?? []).map((section) => (
                <div key={section.heading}>
                  <h2 className="font-heading text-lg font-bold text-foreground">{section.heading}</h2>
                  <p>{section.body}</p>
                </div>
              ))}
              {pageConfig?.contactBlock ? (
                <RichText value={pageConfig.contactBlock} className="[&_a]:text-primary [&_a]:hover:underline" />
              ) : null}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
