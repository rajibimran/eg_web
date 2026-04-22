"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Stethoscope, ScanLine, TestTubes, Syringe,
  ChevronRight, ChevronLeft, Loader2, CheckCircle, CalendarIcon, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import PageHeroSlider from "@/components/PageHeroSlider";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import {
  api,
  createEmptyPageHero,
  defaultBookingPageConfig,
  formatPageTitle,
  getEmptyBookingPageConfig,
  IS_STRAPI_CONFIGURED,
  USE_LOCAL_MOCK_HYDRATION,
  type PageHero,
} from "@/lib/api";

const iconMap: Record<string, React.ElementType> = {
  Stethoscope, ScanLine, TestTubes, Syringe,
};

const defaultBookingServices = [
  { id: "physical-examination", icon: "Stethoscope", title: "Physical Examination" },
  { id: "digital-radiology", icon: "ScanLine", title: "Digital Radiology" },
  { id: "laboratory-tests", icon: "TestTubes", title: "Laboratory Tests" },
  { id: "vaccination", icon: "Syringe", title: "Vaccination" },
];

const defaultBookHero: PageHero = {
  page: "book",
  title: "Book Appointment",
  subtitle: "Schedule your medical examination in three simple steps.",
  slides: [
  { src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&h=900&fit=crop", alt: "Booking an appointment" },
  { src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&h=900&fit=crop", alt: "Medical center reception" },
  ],
  ctaButtons: [
    { label: "Our Services", href: "/services", variant: "secondary" },
    { label: "Contact", href: "/contact", variant: "primary" },
  ],
};

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
}

function normalizeSlotLabel(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

const BookAppointment = () => {
  const { pathname } = useLocation();
  const { siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const [hero, setHero] = useState<PageHero | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultBookHero : IS_STRAPI_CONFIGURED ? null : createEmptyPageHero("book")
  );
  const [pageConfig, setPageConfig] = useState(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultBookingPageConfig : IS_STRAPI_CONFIGURED ? null : getEmptyBookingPageConfig()
  );
  const [bookingServices, setBookingServices] = useState(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultBookingServices : IS_STRAPI_CONFIGURED ? [] : defaultBookingServices
  );
  const [ready, setReady] = useState(!IS_STRAPI_CONFIGURED);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const [h, cfg, services] = await Promise.all([
        api.hero.getByPage("book", defaultBookHero),
        api.bookingPage.get(),
        api.services.getAll(),
      ]);
      if (!cancelled) {
        const svcRows = services
          .map((s) => ({ id: s.href.replace("/services/", ""), icon: s.icon, title: s.title }))
          .filter((s) => s.id && s.title);
        setHero(h);
        setPageConfig(cfg);
        setBookingServices(svcRows.length > 0 ? svcRows : defaultBookingServices);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Load slots already taken for the selected day (server enforces the same rule). */
  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED || !ready || !selectedDate) {
      setBookedSlots([]);
      return;
    }
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    let cancelled = false;
    setAvailabilityLoading(true);
    (async () => {
      const taken = await api.bookingRequests.getBookedSlotsForDate(dateKey);
      if (!cancelled) {
        setBookedSlots(taken);
        setSelectedTime((prev) => {
          if (!prev) return prev;
          const n = normalizeSlotLabel(prev);
          return taken.some((t) => normalizeSlotLabel(t) === n) ? "" : prev;
        });
      }
    })().finally(() => {
      if (!cancelled) setAvailabilityLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [IS_STRAPI_CONFIGURED, ready, selectedDate]);

  const bookingTimeSlots =
    pageConfig != null
      ? pageConfig.timeSlots
      : USE_LOCAL_MOCK_HYDRATION
        ? defaultBookingPageConfig.timeSlots
        : [];

  const progressValue = step === 1 ? 33 : step === 2 ? 66 : 100;

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const phoneDigits = phone.replace(/\D/g, "");

    if (!trimmedName) newErrors.name = "Name is required";
    else if (trimmedName.length > 100) newErrors.name = "Name must be under 100 characters";

    if (!phoneDigits) newErrors.phone = "Phone number is required";
    else if (phoneDigits.length < 10) newErrors.phone = "Enter a valid phone number";

    if (!trimmedEmail) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) newErrors.email = "Enter a valid email";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canProceed = () => {
    if (step === 1) return !!selectedService;
    if (step === 2) return !!selectedDate && !!selectedTime;
    return true;
  };

  const handleNext = () => {
    if (step === 3) {
      if (!validateStep3()) return;
      handleSubmit();
      return;
    }
    setSubmitError(null);
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (!IS_STRAPI_CONFIGURED) {
        await new Promise((r) => setTimeout(r, 800));
        setIsSuccess(true);
        return;
      }
      if (!selectedDate || !selectedTime || !selectedService) {
        setSubmitError("Please complete date, time, and service.");
        return;
      }
      const dateKey = format(selectedDate, "yyyy-MM-dd");
      const svc = bookingServices.find((s) => s.id === selectedService);
      const result = await api.bookingRequests.submit({
        patientName: name.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, ""),
        serviceId: selectedService,
        serviceTitle: svc?.title,
        appointmentDate: dateKey,
        timeSlot: selectedTime,
      });
      if (!result.ok) {
        setSubmitError(result.error ?? "Could not submit booking.");
        if (result.conflict && selectedDate) {
          const taken = await api.bookingRequests.getBookedSlotsForDate(dateKey);
          setBookedSlots(taken);
        }
        return;
      }
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Layout>
        <SeoHelmet
          layers={pageConfig?.seo ? [pageConfig.seo] : []}
          fallbackTitle={formatPageTitle("Appointment confirmed", siteName)}
          fallbackDescription="Your booking was submitted successfully."
          pathForCanonical={pathname}
          forceNoIndex
        />
        <section className="py-[64px]">
          <div className="container flex justify-center">
            <div className="w-full max-w-lg rounded-lg border border-border bg-card p-[32px] shadow-[0_4px_8px_rgba(0,0,0,0.1)] text-center">
              <div className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full bg-accent/10 mb-[24px]">
                <CheckCircle className="h-[32px] w-[32px] text-accent" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Request received</h2>
              <p className="mt-[8px] font-body text-sm text-muted-foreground">
                We saved your booking request. Staff will contact you to confirm. You can also track it in the clinic admin under <span className="font-medium">Appointment booking</span>.
              </p>
              <div className="mt-[24px] rounded-lg bg-muted p-[16px] text-left space-y-[8px]">
                <p className="font-body text-sm text-foreground">
                  <span className="font-semibold">Service:</span> {bookingServices.find((s) => s.id === selectedService)?.title}
                </p>
                <p className="font-body text-sm text-foreground">
                  <span className="font-semibold">Date:</span> {selectedDate ? format(selectedDate, "PPP") : ""}
                </p>
                <p className="font-body text-sm text-foreground">
                  <span className="font-semibold">Time:</span> {selectedTime}
                </p>
                <p className="font-body text-sm text-foreground">
                  <span className="font-semibold">Patient:</span> {name.trim()}
                </p>
              </div>
              <p className="mt-[16px] font-body text-xs text-muted-foreground">
                A confirmation SMS and email will be sent to your registered contact details.
              </p>
              <Button
                onClick={() => { setStep(1); setSelectedService(""); setSelectedDate(undefined); setSelectedTime(""); setName(""); setPhone(""); setEmail(""); setIsSuccess(false); }}
                className="mt-[24px] h-[44px] rounded-[4px] bg-primary px-[24px] py-[12px] font-heading text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Book Another Appointment
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SeoHelmet
        layers={hero?.seo ? [hero.seo] : []}
        fallbackTitle={formatPageTitle(hero?.title?.trim() || "Book Appointment", siteName)}
        fallbackDescription={hero?.subtitle ?? "Schedule your medical examination in three simple steps."}
        pathForCanonical={pathname}
      />
      {!ready || !hero || !pageConfig ? (
        <section className="relative min-h-[420px] animate-pulse bg-muted" aria-busy="true" aria-label="Loading booking page" />
      ) : (
        <>
      <PageHeroSlider
        images={hero.slides}
        fallbackCtaButtons={hero.ctaButtons}
        title={hero.title}
        subtitle={hero.subtitle}
      />

      <PageBreadcrumb items={[{ label: "Book Appointment" }]} />

      <section className="py-[48px]">
        <div className="container flex flex-col items-center">
          <div className="flex items-center gap-[8px] mb-[16px]">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <span className="font-body text-xs text-muted-foreground">Secure Booking — Your data is protected</span>
          </div>
          <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-[32px] shadow-[0_4px_8px_rgba(0,0,0,0.1)]">
            <div className="mb-[32px]">
              <div className="flex justify-between mb-[8px]">
                {["Select Service", "Date & Time", "Your Details"].map((label, i) => (
                  <span key={label} className={cn("font-heading text-xs font-semibold", step >= i + 1 ? "text-primary" : "text-muted-foreground")}>
                    {label}
                  </span>
                ))}
              </div>
              <Progress value={progressValue} className="h-[8px]" />
            </div>

            {step === 1 && (
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-[24px]">Choose a Service</h2>
                <div className="grid grid-cols-2 gap-[16px]">
                  {bookingServices.map((svc) => {
                    const Icon = iconMap[svc.icon] || Stethoscope;
                    const isSelected = selectedService === svc.id;
                    return (
                      <button
                        key={svc.id}
                        onClick={() => setSelectedService(svc.id)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-lg border-2 p-[16px] transition-all min-h-[110px]",
                          isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
                        )}
                      >
                        <Icon className={cn("h-[28px] w-[28px] mb-[8px]", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("font-heading text-xs font-semibold text-center", isSelected ? "text-primary" : "text-foreground")}>
                          {svc.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-[24px]">Pick Date & Time</h2>
                <div className="space-y-[24px]">
                  <div>
                    <Label className="font-heading text-sm font-semibold text-foreground mb-[8px] block">Appointment Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full h-[44px] justify-start text-left font-body text-sm", !selectedDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-[8px] h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={(date) => date < new Date() || date.getDay() === 5} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="font-heading text-sm font-semibold text-foreground mb-[8px] block">Available Time Slots</Label>
                    {availabilityLoading ? (
                      <p className="font-body text-xs text-muted-foreground">Checking availability…</p>
                    ) : null}
                    {!selectedDate ? (
                      <p className="font-body text-xs text-muted-foreground">Select a date to see time slots.</p>
                    ) : null}
                    <div className="grid grid-cols-3 gap-[8px] sm:grid-cols-5">
                      {bookingTimeSlots.map((slot) => {
                        const n = normalizeSlotLabel(slot);
                        const taken = bookedSlots.some((b) => normalizeSlotLabel(b) === n);
                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={taken || availabilityLoading}
                            title={taken ? "This time is already booked" : undefined}
                            onClick={() => !taken && setSelectedTime(slot)}
                            className={cn(
                              "h-[44px] rounded-[4px] border px-[8px] font-body text-xs font-medium transition-colors",
                              taken
                                ? "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-70"
                                : selectedTime === slot
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-card text-foreground hover:border-primary/40"
                            )}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                    {IS_STRAPI_CONFIGURED && selectedDate && bookedSlots.length > 0 ? (
                      <p className="mt-2 font-body text-[11px] text-muted-foreground">Greyed-out times are no longer available.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground mb-[24px]">Your Details</h2>
                {submitError ? (
                  <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 font-body text-sm text-destructive">{submitError}</p>
                ) : null}
                <div className="space-y-[16px]">
                  <div>
                    <Label htmlFor="name" className="font-heading text-sm font-semibold text-foreground mb-[4px] block">Full Name *</Label>
                    <Input id="name" value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }} placeholder="Enter your full name" className={cn("h-[44px] font-body text-sm", errors.name && "border-destructive")} maxLength={100} />
                    {errors.name && <p className="mt-[4px] font-body text-xs text-destructive">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="font-heading text-sm font-semibold text-foreground mb-[4px] block">Phone Number *</Label>
                    <Input id="phone" value={phone} onChange={handlePhoneChange} placeholder="01XX-XXX-XXXX" className={cn("h-[44px] font-body text-sm", errors.phone && "border-destructive")} />
                    {errors.phone && <p className="mt-[4px] font-body text-xs text-destructive">{errors.phone}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email" className="font-heading text-sm font-semibold text-foreground mb-[4px] block">Email Address *</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }} placeholder="your@email.com" className={cn("h-[44px] font-body text-sm", errors.email && "border-destructive")} maxLength={255} />
                    {errors.email && <p className="mt-[4px] font-body text-xs text-destructive">{errors.email}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-[32px] flex justify-between">
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 1} className="h-[44px] rounded-[4px] px-[24px] py-[12px] font-heading text-sm font-semibold">
                <ChevronLeft className="mr-[4px] h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext} disabled={!canProceed() || isSubmitting} className="h-[44px] rounded-[4px] bg-accent px-[24px] py-[12px] font-heading text-sm font-semibold text-accent-foreground hover:bg-accent/90">
                {isSubmitting && <Loader2 className="mr-[4px] h-4 w-4 animate-spin" />}
                {step === 3 ? (isSubmitting ? "Booking..." : "Confirm Booking") : "Next"}
                {step < 3 && <ChevronRight className="ml-[4px] h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </section>
        </>
      )}
    </Layout>
  );
};

export default BookAppointment;
