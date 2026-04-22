import { CertificationBadgeMedia } from "@/components/cert/CertificationBadgeMedia";
import { IS_STRAPI_CONFIGURED } from "@/lib/api";
import { useTrustSectionData } from "@/hooks/useTrustSectionData";

/** Accreditations strip — institutional presentation for a diagnostic center. */
const TrustCertRibbon = () => {
  const { certs, ready } = useTrustSectionData();

  if (!IS_STRAPI_CONFIGURED) {
    return null;
  }

  if (!ready || !certs) {
    return (
      <section className="overflow-x-hidden bg-primary py-4" aria-busy="true" aria-label="Loading certifications">
        <div className="container px-4 sm:px-6">
          <div className="flex gap-4 overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 w-28 shrink-0 animate-pulse rounded-md bg-primary-foreground/15 sm:h-12 sm:w-36" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (certs.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-x-hidden bg-primary text-primary-foreground">
      <div className="absolute inset-x-0 top-0 h-1 rounded-none bg-secondary" aria-hidden />
      <div className="container flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:gap-8 sm:px-6 sm:py-6">
        <div className="shrink-0 sm:max-w-[200px]">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/75">Accreditation</p>
          <p className="mt-1 font-heading text-sm font-semibold leading-snug sm:text-base">
            Laboratory &amp; screening partners
          </p>
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex animate-scroll gap-3 sm:gap-5" style={{ width: "max-content" }}>
            {[...certs, ...certs].map((cert, i) => (
              <div
                key={`${cert.id}-${i}`}
                className="flex h-11 items-center justify-center rounded-md border border-slate-200/90 bg-white px-4 shadow-sm sm:h-12 sm:px-6"
              >
                <CertificationBadgeMedia
                  cert={cert}
                  className="flex max-h-full min-h-0 max-w-full items-center justify-center text-slate-900 no-underline hover:opacity-90"
                  classNameImg="max-h-7 max-w-[120px] object-contain sm:max-h-8"
                  classNameText="font-heading text-center text-[11px] font-semibold leading-tight text-slate-900 sm:text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustCertRibbon;
