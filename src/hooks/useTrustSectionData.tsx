import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  certificationBadges as defaultCerts,
  servicePackages as defaultPackages,
  stats as defaultStats,
  type StatItem,
  type ServicePackage,
} from "@/data/mockData";
import { api, IS_STRAPI_CONFIGURED, USE_LOCAL_MOCK_HYDRATION, type CertificationBadge } from "@/lib/api";

export type TrustSectionData = {
  stats: StatItem[] | null;
  packages: ServicePackage[] | null;
  certs: CertificationBadge[] | null;
  ready: boolean;
};

const TrustSectionDataContext = createContext<TrustSectionData | null>(null);

export function TrustSectionDataProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<StatItem[] | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultStats : IS_STRAPI_CONFIGURED ? null : [],
  );
  const [packages, setPackages] = useState<ServicePackage[] | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultPackages : IS_STRAPI_CONFIGURED ? null : [],
  );
  const [certs, setCerts] = useState<CertificationBadge[] | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultCerts : IS_STRAPI_CONFIGURED ? null : [],
  );
  const [ready, setReady] = useState(!IS_STRAPI_CONFIGURED);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const [s, p, c] = await Promise.all([
        api.stats.getAll(),
        api.servicePackages.getAll(),
        api.certifications.getAll(),
      ]);
      if (!cancelled) {
        setStats(s);
        setPackages(p);
        setCerts(c);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ stats, packages, certs, ready }),
    [stats, packages, certs, ready],
  );

  return <TrustSectionDataContext.Provider value={value}>{children}</TrustSectionDataContext.Provider>;
}

export function useTrustSectionData(): TrustSectionData {
  const ctx = useContext(TrustSectionDataContext);
  if (!ctx) {
    throw new Error("useTrustSectionData must be used within TrustSectionDataProvider");
  }
  return ctx;
}
