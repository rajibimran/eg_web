import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/content/RichText";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { api, IS_STRAPI_CONFIGURED, USE_LOCAL_MOCK_HYDRATION, type CountryGuideline } from "@/lib/api";
import {
  FileText,
  AlertCircle,
  Info,
  Users,
  Lightbulb,
  Calendar,
  CheckCircle2,
} from "lucide-react";

const LOCAL_GUIDELINES_FALLBACK: CountryGuideline[] = [
  {
    id: "ksa",
    name: "Saudi Arabia",
    flag: "https://flagcdn.com/w80/sa.png",
    processingTime: "2 to 4 working days",
    approvalNote: "100% WAFID Approved",
    expertTip:
      "Book your KSA medical appointment at least 2 weeks before your intended travel date. Early morning slots (9 AM) are best to avoid long waiting times.",
    mandatoryTests:
      "Work visa requirements for Saudi Arabia are among the most stringent in the GCC. Mandatory tests include a comprehensive physical examination, blood tests for HIV, Hepatitis B & C, and Syphilis. Chest X-rays are required to screen for Tuberculosis (TB). Stool and urine analysis check for parasitic infections and kidney function. Applicants must provide proof of mandatory vaccinations as specified by the Saudi Ministry of Health.",
    rejectionCriteria:
      "Conditions that may cause immediate rejection include active Tuberculosis, positive HIV status, and chronic Hepatitis. Significant vision impairment, uncontrolled hypertension, and advanced diabetes are critical factors. Neuropsychiatric disorders or major physical disabilities hindering job performance will result in an 'Unfit' status.",
    specialRules:
      "KSA requires the medical center to be linked directly to the Enjaz system. For certain professional categories, additional tests like color blindness or psychological assessments may be requested by the employer.",
    visaCategories:
      "General Labor, Construction Workers, Drivers, Engineers, Medical Professionals, and Family Joining/Residence visas.",
  },
  {
    id: "uae",
    name: "United Arab Emirates",
    flag: "https://flagcdn.com/w80/ae.png",
    processingTime: "2 to 3 working days",
    approvalNote: "100% WAFID Approved",
    expertTip:
      "UAE has separate health authorities for each emirate — DHA for Dubai, HAAD for Abu Dhabi. Ensure your medical center is authorized for your specific emirate destination.",
    mandatoryTests:
      "UAE screening focuses heavily on communicable disease detection. Tests include HIV, Hepatitis B & C, Syphilis (VDRL), chest X-ray for TB, and complete blood count. Urine analysis for drug screening may apply for certain job categories. Physical examination includes vision, hearing, and systemic review.",
    rejectionCriteria:
      "Active TB, HIV positive, Hepatitis B/C, leprosy, and drug abuse are grounds for immediate rejection. Pregnancy in unmarried applicants, severe mental health conditions, and uncontrolled chronic diseases also lead to 'Unfit' status.",
    specialRules:
      "Free Zone and Mainland visas may have different screening requirements. Some emirates require additional tests for domestic workers. The UAE periodically updates its screening panels — always confirm current requirements before your appointment.",
    visaCategories:
      "Employment Visa, Investor Visa, Domestic Worker, Family/Residence, Free Zone Employment, and Golden Visa holders.",
  },
  {
    id: "qatar",
    name: "Qatar",
    flag: "https://flagcdn.com/w80/qa.png",
    processingTime: "3 to 5 working days",
    approvalNote: "100% WAFID Approved",
    expertTip:
      "Qatar's medical requirements have become more stringent since FIFA 2022 infrastructure projects. Book early and ensure all vaccinations are up to date before your appointment.",
    mandatoryTests:
      "Qatar mandates comprehensive blood tests for HIV, Hepatitis B & C, and Syphilis. Chest X-ray for TB screening is required. Full physical examination includes cardiovascular assessment, vision testing, and musculoskeletal evaluation. Urine and stool analysis are standard for all visa categories.",
    rejectionCriteria:
      "Positive results for any infectious disease will lead to rejection. Uncontrolled diabetes, severe cardiac conditions, and active psychiatric disorders are disqualifying. Physical disabilities affecting the specific job role may also result in 'Unfit' certification.",
    specialRules:
      "Qatar requires biometric verification linked to the Qatar Visa Center system. Workers in food handling or healthcare roles must undergo additional screening for communicable diseases and may require specific vaccinations.",
    visaCategories:
      "Work Permit, Temporary Work Visa, Family Residence, Business Visa, and Domestic Worker Visa.",
  },
  {
    id: "kuwait",
    name: "Kuwait",
    flag: "https://flagcdn.com/w80/kw.png",
    processingTime: "3 to 5 working days",
    approvalNote: "100% WAFID Approved",
    expertTip:
      "Kuwait has strict age-related criteria for certain job categories. Verify your eligibility before booking to avoid unnecessary costs and delays.",
    mandatoryTests:
      "Kuwait requires blood tests for HIV, Hepatitis B & C, Syphilis, and malaria. Chest X-ray for TB is mandatory. Physical examination covers blood pressure, BMI, vision, and hearing. Complete urine analysis and stool examination are required for all applicants.",
    rejectionCriteria:
      "Positive infectious disease results, drug traces in urine, active TB, and chronic Hepatitis are immediate disqualifiers. Severe obesity (BMI > 35), uncontrolled hypertension, and significant physical limitations are also cause for rejection.",
    specialRules:
      "Kuwait enforces an age cap for certain blue-collar visa categories. The medical report must be stamped and verified by the Kuwait Embassy. Repeat applicants after an 'Unfit' result must wait a minimum of 3 months before re-examination.",
    visaCategories:
      "Work Visa (Article 18), Domestic Worker (Article 20), Dependent Visa, Government Project Worker, and Private Sector Employment.",
  },
  {
    id: "bahrain",
    name: "Bahrain",
    flag: "https://flagcdn.com/w80/bh.png",
    processingTime: "2 to 3 working days",
    approvalNote: "100% WAFID Approved",
    expertTip:
      "Bahrain's process is one of the most streamlined in the GCC. Results are typically available faster than other countries. Morning appointments generally have shorter wait times.",
    mandatoryTests:
      "Standard blood screening for HIV, Hepatitis B & C, and Syphilis. Chest X-ray for TB detection. Physical examination includes cardiovascular, respiratory, and musculoskeletal assessment. Urine analysis for kidney function and drug screening.",
    rejectionCriteria:
      "Active infectious diseases, positive HIV/Hepatitis, and active TB lead to rejection. Uncontrolled chronic conditions, severe psychiatric disorders, and physical disabilities that prevent job performance are disqualifying factors.",
    specialRules:
      "Bahrain's medical process is fully integrated with the WAFID system, allowing for quick digital verification. The Labour Market Regulatory Authority (LMRA) oversees all work permit medicals. Some employers may request additional occupational health assessments.",
    visaCategories:
      "Work Permit, Flexi Permit, Family Visit, Residence Visa, and Self-Sponsorship Visa.",
  },
  {
    id: "oman",
    name: "Oman",
    flag: "https://flagcdn.com/w80/om.png",
    processingTime: "3 to 5 working days",
    approvalNote: "100% WAFID Approved",
    expertTip:
      "Oman requires all medical certificates to be attested by the Omani Embassy. Start the process early as attestation may add 2-3 extra days to your timeline.",
    mandatoryTests:
      "Comprehensive blood panel for HIV, Hepatitis B & C, Syphilis, and malaria. Chest X-ray for TB screening. Full physical examination with emphasis on occupational fitness. Stool analysis for parasitic infections and urine analysis for kidney function and drug screening.",
    rejectionCriteria:
      "Positive results for infectious diseases are automatic disqualifiers. Severe chronic illnesses, untreated mental health conditions, and significant physical disabilities are grounds for rejection. Abnormal liver or kidney function tests may require further investigation.",
    specialRules:
      "Oman requires embassy attestation of the medical report in addition to WAFID upload. The Royal Oman Police (ROP) may request additional verification for certain visa categories. Omanisation policies may affect visa issuance for specific job roles.",
    visaCategories:
      "Employment Visa, Family Joining, Investor Visa, Domestic Worker, and Temporary Work Permit.",
  },
];

function CountryPanels({ country }: { country: CountryGuideline }) {
  const panelClass =
    "rounded-xl border border-border/70 bg-muted/25 p-3 sm:p-4 [&_p:first-child]:mt-0";
  const headClass = "mb-1.5 flex items-center gap-1.5 sm:mb-2";
  const textClass = "[&_p]:text-[13px] sm:[&_p]:text-sm [&_p]:leading-snug [&_p]:text-muted-foreground";

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
      <div className={panelClass}>
        <div className={headClass}>
          <FileText className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
          <h4 className="font-heading text-[10px] font-bold uppercase tracking-wider text-foreground sm:text-xs">Mandatory tests</h4>
        </div>
        <RichText value={country.mandatoryTests} className={textClass} />
      </div>
      <div className={panelClass}>
        <div className={headClass}>
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive sm:h-4 sm:w-4" />
          <h4 className="font-heading text-[10px] font-bold uppercase tracking-wider text-foreground sm:text-xs">Rejection criteria</h4>
        </div>
        <RichText value={country.rejectionCriteria} className={textClass} />
      </div>
      <div className={panelClass}>
        <div className={headClass}>
          <Info className="h-3.5 w-3.5 shrink-0 text-secondary sm:h-4 sm:w-4" />
          <h4 className="font-heading text-[10px] font-bold uppercase tracking-wider text-foreground sm:text-xs">Special rules</h4>
        </div>
        <RichText value={country.specialRules} className={textClass} />
      </div>
      <div className={panelClass}>
        <div className={headClass}>
          <Users className="h-3.5 w-3.5 shrink-0 text-secondary sm:h-4 sm:w-4" />
          <h4 className="font-heading text-[10px] font-bold uppercase tracking-wider text-foreground sm:text-xs">Visa categories</h4>
        </div>
        <RichText value={country.visaCategories} className={textClass} />
      </div>
    </div>
  );
}

const CountryGuidelinesSection = () => {
  const [guidelines, setGuidelines] = useState<CountryGuideline[] | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? LOCAL_GUIDELINES_FALLBACK : !IS_STRAPI_CONFIGURED ? [] : null,
  );
  const [ready, setReady] = useState(!IS_STRAPI_CONFIGURED);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const list = await api.countryGuidelines.getAll(LOCAL_GUIDELINES_FALLBACK);
      if (!cancelled) {
        setGuidelines(list);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (IS_STRAPI_CONFIGURED && !ready) {
    return (
      <section className="border-t border-border/80 bg-muted/25 py-6 sm:py-10" aria-busy="true" aria-label="Loading country guidelines">
        <div className="container px-4 sm:px-6">
          <div className="mb-5 h-16 max-w-2xl animate-pulse rounded-2xl bg-muted/80 sm:mb-6" />
          <div className="mx-auto max-w-3xl space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/70" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!guidelines?.length) {
    return null;
  }

  const defaultOpen = guidelines[0]?.id ?? "";

  return (
    <section className="relative border-t border-border/80 bg-gradient-to-b from-background via-muted/35 to-background py-8 sm:py-12">
      <div className="container px-4 sm:px-6">
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-md shadow-primary/[0.04] sm:mb-7">
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-secondary to-secondary/60" aria-hidden />
          <div className="flex flex-col gap-3 bg-gradient-to-br from-card via-card to-muted/20 px-4 py-4 pl-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-4 sm:pl-6">
            <div className="min-w-0">
              <p className="font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary">Protocols</p>
              <h2 className="mt-1 font-heading text-lg font-semibold leading-snug tracking-tight text-primary sm:text-xl">
                Country-specific screening requirements
              </h2>
            </div>
            <p className="max-w-md font-body text-xs leading-snug text-muted-foreground sm:max-w-sm sm:border-l sm:border-border/60 sm:pl-6 sm:text-[13px]">
              Visa criteria, timelines, and documentation — quick reference by destination.
            </p>
          </div>
        </div>

        <Accordion type="single" collapsible defaultValue={defaultOpen} className="mx-auto max-w-4xl space-y-2">
          {guidelines.map((country) => (
            <AccordionItem
              key={country.id}
              value={country.id}
              className="rounded-xl border border-border/70 bg-card px-3 !border-b-0 shadow-sm sm:px-5 data-[state=open]:shadow-md data-[state=open]:ring-1 data-[state=open]:ring-secondary/15"
            >
              <AccordionTrigger className="gap-2 py-3 text-left font-heading text-sm font-semibold hover:no-underline data-[state=open]:text-secondary sm:py-3.5 sm:text-base [&[data-state=open]>svg]:text-secondary">
                <span className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                  <img src={country.flag} alt="" className="h-5 w-8 shrink-0 rounded-sm object-cover ring-1 ring-border/80 sm:h-6 sm:w-9" />
                  <span className="flex min-w-0 flex-col items-start gap-0 text-left sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="break-words">{country.name}</span>
                    <span className="font-body text-[11px] font-normal text-muted-foreground sm:text-xs">
                      {country.processingTime}
                    </span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-4 pt-0 sm:pb-5">
                <div className="grid gap-4 border-t border-border/60 pt-4 sm:grid-cols-3 sm:gap-5 sm:pt-4">
                  <div className="space-y-3 sm:col-span-1">
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3 sm:p-4">
                      <p className="font-body text-[13px] leading-snug text-muted-foreground">
                        Results typically upload in{" "}
                        <span className="font-semibold text-foreground">{country.processingTime}</span> (WAFID / GAMCA).
                      </p>
                      <ul className="mt-3 space-y-1.5 text-[13px] text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>Medical report validity per embassy rules</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                          <span>{country.approvalNote}</span>
                        </li>
                      </ul>
                      <Link to="/book" className="mt-3 block">
                        <Button className="h-9 w-full rounded-full bg-secondary font-heading text-xs font-semibold text-secondary-foreground shadow-sm hover:brightness-110 sm:h-10 sm:text-sm">
                          Book — {country.name}
                        </Button>
                      </Link>
                    </div>
                    <div className="rounded-xl border border-secondary/20 bg-secondary/[0.06] p-3 sm:p-3.5">
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-secondary" />
                        <span className="font-heading text-[10px] font-bold uppercase tracking-wider text-secondary">Tip</span>
                      </div>
                      <RichText
                        value={country.expertTip}
                        className="[&_p]:text-[12px] sm:[&_p]:text-[13px] [&_p]:leading-snug [&_p]:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <CountryPanels country={country} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default CountryGuidelinesSection;
