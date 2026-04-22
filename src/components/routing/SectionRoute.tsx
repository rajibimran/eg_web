import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { IS_STRAPI_CONFIGURED } from "@/lib/api";

type Section = "blog" | "news";

/** When Strapi is on, redirects to home if Site Config disables the section. */
export function SectionRoute({ section, children }: { section: Section; children: ReactNode }) {
  const { layoutReady, siteConfig } = useStrapiLayout();

  if (!IS_STRAPI_CONFIGURED) {
    return children;
  }

  if (!layoutReady) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-muted" aria-busy="true" aria-label="Loading" />
    );
  }

  if (section === "blog" && !siteConfig.showBlogSection) {
    return <Navigate to="/" replace />;
  }
  if (section === "news" && !siteConfig.showNewsSection) {
    return <Navigate to="/" replace />;
  }

  return children;
}
