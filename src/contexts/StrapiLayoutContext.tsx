import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FooterLink, NavItem } from "@/data/mockData";
import {
  certificationBadges as defaultCerts,
  footerQuickLinks as defaultQuickLinks,
  footerServices as defaultFooterServices,
  navItems as defaultNavItems,
} from "@/data/mockData";
import {
  api,
  defaultSiteConfig,
  emptySiteConfig,
  IS_MOCK_DATA_ENABLED,
  IS_STRAPI_CONFIGURED,
  type CertificationBadge,
  type SiteConfig,
} from "@/lib/api";

function filterNavBySiteConfig(items: NavItem[], showBlog: boolean, showNews: boolean): NavItem[] {
  const out: NavItem[] = [];
  for (const item of items) {
    const href = item.href ?? "";
    if ((href === "/blog" || href.startsWith("/blog/")) && !showBlog) continue;
    if ((href === "/news" || href.startsWith("/news/")) && !showNews) continue;
    let children: NavItem[] | undefined;
    if (item.children?.length) {
      children = filterNavBySiteConfig(item.children, showBlog, showNews);
    }
    if (item.children?.length && (!children || children.length === 0)) continue;
    out.push({ ...item, ...(children && children.length ? { children } : {}) });
  }
  return out;
}

export interface StrapiLayoutValue {
  layoutReady: boolean;
  siteConfig: SiteConfig;
  navItems: NavItem[];
  footerQuickLinks: FooterLink[];
  footerServiceLinks: FooterLink[];
  certifications: CertificationBadge[];
}

const StrapiLayoutContext = createContext<StrapiLayoutValue | null>(null);

function initialLayoutShell(): {
  siteConfig: SiteConfig;
  navItems: NavItem[];
  footerQuickLinks: FooterLink[];
  footerServiceLinks: FooterLink[];
  certifications: CertificationBadge[];
} {
  if (!IS_STRAPI_CONFIGURED && IS_MOCK_DATA_ENABLED) {
    return {
      siteConfig: defaultSiteConfig,
      navItems: defaultNavItems,
      footerQuickLinks: defaultQuickLinks,
      footerServiceLinks: defaultFooterServices,
      certifications: defaultCerts,
    };
  }
  if (!IS_STRAPI_CONFIGURED && !IS_MOCK_DATA_ENABLED) {
    return {
      siteConfig: emptySiteConfig,
      navItems: [],
      footerQuickLinks: [],
      footerServiceLinks: [],
      certifications: [],
    };
  }
  return {
    siteConfig: IS_MOCK_DATA_ENABLED ? defaultSiteConfig : emptySiteConfig,
    navItems: [],
    footerQuickLinks: [],
    footerServiceLinks: [],
    certifications: [],
  };
}

export function StrapiLayoutProvider({ children }: { children: ReactNode }) {
  const initial = initialLayoutShell();
  const [layoutReady, setLayoutReady] = useState(!IS_STRAPI_CONFIGURED);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(initial.siteConfig);
  const [navItems, setNavItems] = useState<NavItem[]>(initial.navItems);
  const [footerQuickLinks, setFooterQuickLinks] = useState<FooterLink[]>(initial.footerQuickLinks);
  const [footerServiceLinks, setFooterServiceLinks] = useState<FooterLink[]>(initial.footerServiceLinks);
  const [certifications, setCertifications] = useState<CertificationBadge[]>(initial.certifications);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      try {
        const [sc, nav, fq, fs, certs] = await Promise.all([
          api.siteConfig.get(),
          api.navigation.getAll(),
          api.footer.getQuickLinks(),
          api.footer.getServiceLinks(),
          api.certifications.getAll(),
        ]);
        if (!cancelled) {
          setSiteConfig(sc);
          setNavItems(filterNavBySiteConfig(nav, sc.showBlogSection, sc.showNewsSection));
          setFooterQuickLinks(fq);
          setFooterServiceLinks(fs);
          setCertifications(certs);
        }
      } finally {
        if (!cancelled) setLayoutReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      layoutReady,
      siteConfig,
      navItems,
      footerQuickLinks,
      footerServiceLinks,
      certifications,
    }),
    [layoutReady, siteConfig, navItems, footerQuickLinks, footerServiceLinks, certifications]
  );

  return <StrapiLayoutContext.Provider value={value}>{children}</StrapiLayoutContext.Provider>;
}

export function useStrapiLayout(): StrapiLayoutValue {
  const ctx = useContext(StrapiLayoutContext);
  if (!ctx) {
    throw new Error("useStrapiLayout must be used within StrapiLayoutProvider");
  }
  return ctx;
}
