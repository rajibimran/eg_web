import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { formatPageTitle } from "@/lib/api";

const NotFound = () => {
  const location = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <SeoHelmet
        useSiteDefault={false}
        layers={[]}
        fallbackTitle={formatPageTitle("404 — Page not found", siteName)}
        fallbackDescription={`The page you requested does not exist. Return to ${siteName} home.`}
        pathForCanonical={location.pathname}
        forceNoIndex
      />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
