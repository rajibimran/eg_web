import { useEffect, useState, type FormEvent } from "react";
import { Loader2, FileDown, ShieldCheck, AlertCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Layout from "@/components/layout/Layout";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import {
  api,
  createEmptyPageHero,
  defaultReportPageConfig,
  formatPageTitle,
  getEmptyReportPageConfig,
  IS_STRAPI_CONFIGURED,
  USE_LOCAL_MOCK_HYDRATION,
  type PageHero,
} from "@/lib/api";

const defaultReportHero: PageHero = {
  page: "reports",
  title: "Check Your Report",
  subtitle: "Enter your Patient ID and registered phone number to access your medical report.",
  slides: [
    { src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&h=900&fit=crop", alt: "Medical report analysis" },
    { src: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1600&h=900&fit=crop", alt: "Health records management" },
  ],
  ctaButtons: [
    { label: "Book Appointment", href: "/book", variant: "primary" },
    { label: "Contact", href: "/contact", variant: "secondary" },
  ],
};

interface ReportResult {
  patientName: string;
  reportDate: string;
  status: string;
  reportId: string;
}

function CompactReportHeader({ hero }: { hero: PageHero }) {
  const ctas = hero.ctaButtons ?? [];
  return (
    <div className="relative overflow-hidden bg-primary text-primary-foreground">
      <div
        className="pointer-events-none absolute -right-20 top-0 h-40 w-40 rounded-full bg-secondary/15 blur-3xl"
        aria-hidden
      />
      <div className="container relative max-w-3xl px-4 py-6 sm:px-6 sm:py-7">
        <p className="font-body text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">Patient portal</p>
        <h1 className="mt-1 font-heading text-xl font-semibold tracking-tight sm:text-2xl">{hero.title}</h1>
        {hero.subtitle ? (
          <p className="mt-1.5 max-w-lg font-body text-sm leading-snug text-primary-foreground/85">{hero.subtitle}</p>
        ) : null}
        {ctas.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {ctas.map((c) =>
              c.variant === "secondary" ? (
                <Link
                  key={c.href + c.label}
                  to={c.href}
                  className="inline-flex items-center justify-center rounded-full border-2 border-white/35 bg-transparent px-4 py-1.5 font-heading text-xs font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
                >
                  {c.label}
                </Link>
              ) : (
                <Link
                  key={c.href + c.label}
                  to={c.href}
                  className="inline-flex items-center justify-center rounded-full bg-secondary px-4 py-1.5 font-heading text-xs font-semibold text-secondary-foreground shadow-md transition hover:bg-secondary/90"
                >
                  {c.label}
                </Link>
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const ReportCheck = () => {
  const { pathname } = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const [hero, setHero] = useState<PageHero | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultReportHero : IS_STRAPI_CONFIGURED ? null : createEmptyPageHero("reports"),
  );
  const [pageConfig, setPageConfig] = useState(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultReportPageConfig : IS_STRAPI_CONFIGURED ? null : getEmptyReportPageConfig(),
  );
  const [patientId, setPatientId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState<{ patientId?: string; phone?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [portalDownloadStarted, setPortalDownloadStarted] = useState(false);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const [h, cfg] = await Promise.all([api.hero.getByPage("reports", defaultReportHero), api.reportPage.get()]);
      if (!cancelled) {
        setHero(h);
        setPageConfig(cfg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const trimmedId = patientId.trim();
    const phoneDigits = phoneNumber.replace(/\D/g, "");

    if (!trimmedId) newErrors.patientId = "Patient ID is required";
    else if (trimmedId.length < 4 || trimmedId.length > 20) newErrors.patientId = "Enter a valid Patient ID";

    if (!phoneDigits) newErrors.phone = "Phone number is required";
    else if (phoneDigits.length < 10) newErrors.phone = "Enter a valid phone number";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setReport(null);
    setNotFound(false);
    setPortalDownloadStarted(false);

    if (!validate()) return;

    setIsLoading(true);
    try {
      if (IS_STRAPI_CONFIGURED) {
        const res = await api.labReportFiles.download(patientId, phoneNumber);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const url = URL.createObjectURL(res.blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = res.filename || `report-${patientId.trim().replace(/\W/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setPortalDownloadStarted(true);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (patientId.trim().toLowerCase() === "notfound") {
        setNotFound(true);
      } else {
        const demo = pageConfig ?? (USE_LOCAL_MOCK_HYDRATION ? defaultReportPageConfig : getEmptyReportPageConfig());
        setReport({
          patientName: demo.samplePatientName,
          reportDate: demo.sampleReportDate,
          status: demo.sampleStatus,
          reportId: `RPT-${patientId.trim().toUpperCase()}-2026`,
        });
      }
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loading = IS_STRAPI_CONFIGURED && (hero === null || pageConfig === null);
  const supportPhone = pageConfig?.supportPhone?.trim() ?? "";
  const heroForUi = hero ?? defaultReportHero;

  return (
    <Layout>
      <SeoHelmet
        layers={hero?.seo ? [hero.seo] : []}
        fallbackTitle={formatPageTitle(hero?.title?.trim() || "Check Report", siteName)}
        fallbackDescription={hero?.subtitle ?? "Enter your Patient ID and registered phone number to access your medical report."}
        pathForCanonical={pathname}
      />
      {loading ? (
        <>
          <div className="h-28 animate-pulse bg-primary/80" aria-busy="true" aria-label="Loading report page" />
          <PageBreadcrumb items={[{ label: "Report Search" }]} />
          <div className="container flex justify-center px-4 py-6">
            <div className="h-52 w-full max-w-md animate-pulse rounded-2xl bg-muted" />
          </div>
        </>
      ) : (
        <>
          <CompactReportHeader hero={heroForUi} />
          <PageBreadcrumb items={[{ label: "Report Search" }]} />

          <section className="border-t border-border/60 bg-gradient-to-b from-muted/30 to-background py-5 sm:py-6">
            <div className="container flex justify-center px-4 sm:px-6">
              <div className="w-full max-w-md">
                <div className="mb-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground sm:text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
                  <span>Secure connection</span>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[0_8px_28px_-14px_rgba(10,37,64,0.16)] sm:p-5">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <Label htmlFor="patientId" className="mb-1 block font-heading text-xs font-semibold text-foreground">
                        Patient ID or passport *
                      </Label>
                      <Input
                        id="patientId"
                        value={patientId}
                        onChange={(e) => {
                          setPatientId(e.target.value);
                          setErrors((p) => ({ ...p, patientId: undefined }));
                          setNotFound(false);
                          setPortalDownloadStarted(false);
                        }}
                        placeholder="e.g. BGD-AO-02001"
                        className={cn("h-10 font-body text-sm", errors.patientId && "border-destructive")}
                        maxLength={20}
                      />
                      {errors.patientId ? <p className="mt-1 font-body text-[11px] text-destructive">{errors.patientId}</p> : null}
                    </div>

                    <div>
                      <Label htmlFor="reportPhone" className="mb-1 block font-heading text-xs font-semibold text-foreground">
                        Registered phone *
                      </Label>
                      <Input
                        id="reportPhone"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(formatPhone(e.target.value));
                          setErrors((p) => ({ ...p, phone: undefined }));
                          setNotFound(false);
                          setPortalDownloadStarted(false);
                        }}
                        placeholder="01XX-XXX-XXXX"
                        className={cn("h-10 font-body text-sm", errors.phone && "border-destructive")}
                      />
                      {errors.phone ? <p className="mt-1 font-body text-[11px] text-destructive">{errors.phone}</p> : null}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="h-10 w-full rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                          Verifying…
                        </>
                      ) : (
                        "Check report"
                      )}
                    </Button>
                  </form>

                  {notFound ? (
                    <div className="mt-3 flex gap-2.5 rounded-xl border border-destructive/25 bg-destructive/5 p-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                      <div>
                        <p className="font-heading text-xs font-semibold text-destructive">Not found</p>
                        <p className="mt-0.5 font-body text-[11px] leading-snug text-muted-foreground">
                          Double-check ID and phone, or call reception for help.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {portalDownloadStarted ? (
                    <div className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-3">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-accent" aria-hidden />
                        <span className="font-heading text-xs font-semibold text-accent">Download started</span>
                      </div>
                      <p className="mt-1.5 font-body text-[11px] leading-snug text-muted-foreground">
                        If nothing appeared, check your browser download bar or permissions.
                      </p>
                    </div>
                  ) : null}

                  {report ? (
                    <div className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-3">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-accent" aria-hidden />
                        <span className="font-heading text-xs font-semibold text-accent">Report found</span>
                      </div>
                      <dl className="mt-2 space-y-1 font-body text-[11px] text-foreground sm:text-xs">
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">Patient</dt>
                          <dd className="text-right font-medium">{report.patientName}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">ID</dt>
                          <dd className="text-right font-medium tabular-nums">{report.reportId}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">Date</dt>
                          <dd className="text-right font-medium">{report.reportDate}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">Status</dt>
                          <dd className="text-right font-semibold text-accent">{report.status}</dd>
                        </div>
                      </dl>
                      <Button className="mt-3 h-10 w-full rounded-full bg-accent font-heading text-sm font-semibold text-accent-foreground hover:bg-accent/90">
                        <FileDown className="mr-2 h-4 w-4" aria-hidden />
                        Download PDF
                      </Button>
                    </div>
                  ) : null}
                </div>

                <p className="mt-3 text-center font-body text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                  {supportPhone ? (
                    <>
                      Issues? Call <span className="font-semibold text-foreground">{supportPhone}</span> or visit reception.
                    </>
                  ) : (
                    <>Issues? Visit reception.</>
                  )}
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </Layout>
  );
};

export default ReportCheck;
