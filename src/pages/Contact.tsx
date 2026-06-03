import { useEffect, useState, type FormEvent } from "react";
import { Phone, Mail, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Layout from "@/components/layout/Layout";
import PageHeroSlider from "@/components/PageHeroSlider";
import PageBreadcrumb from "@/components/layout/PageBreadcrumb";
import { SeoHelmet } from "@/components/seo/SeoHelmet";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { api, createEmptyPageHero, formatPageTitle, IS_STRAPI_CONFIGURED, USE_LOCAL_MOCK_HYDRATION, type PageHero } from "@/lib/api";
import { cn } from "@/lib/utils";

const defaultContactHero: PageHero = {
  page: "contact",
  title: "Contact Us",
  subtitle: "We're here to help. Reach out for appointments, inquiries, or assistance.",
  slides: [
    { src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&h=900&fit=crop", alt: "Medical center reception" },
    { src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1600&h=900&fit=crop", alt: "Healthcare professionals" },
    { src: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1600&h=900&fit=crop", alt: "Patient support" },
  ],
  ctaButtons: [{ label: "Book Appointment", href: "/book", variant: "primary" }],
};

const Contact = () => {
  const { pathname } = useLocation();
  const { layoutReady, siteConfig } = useStrapiLayout();
  const siteName = siteConfig.siteName?.trim() || "Site";
  const [hero, setHero] = useState<PageHero | null>(() =>
    USE_LOCAL_MOCK_HYDRATION ? defaultContactHero : IS_STRAPI_CONFIGURED ? null : createEmptyPageHero("contact"),
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [serviceOptions, setServiceOptions] = useState<{ id: string; label: string }[]>([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      const [h, services] = await Promise.all([api.hero.getByPage("contact", defaultContactHero), api.services.getAll()]);
      if (!cancelled) {
        setHero(h);
        setServiceOptions(
          services
            .map((s) => ({ id: s.href.replace("/services/", ""), label: s.title }))
            .filter((s) => s.id && s.label),
        );
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitError(null);
    setIsSubmitting(true);
    const result = await api.contactSubmissions.submit({
      formKey: "contact_page",
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      serviceInterest: service ? service.trim() : undefined,
      message: message.trim(),
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error ?? "Could not send. Please try again or call us.");
      return;
    }
    setSubmitted(true);
  };

  const strapiBlocking = IS_STRAPI_CONFIGURED && (!layoutReady || !hero);
  if (strapiBlocking) {
    return (
      <Layout>
        <SeoHelmet
          layers={hero?.seo ? [hero.seo] : []}
          fallbackTitle={formatPageTitle("Contact Us", siteName)}
          fallbackDescription={hero?.subtitle ?? defaultContactHero.subtitle}
          fallbackOgImage={hero?.slides?.[0]?.src}
          fallbackOgImageAlt={hero?.slides?.[0]?.alt}
          pathForCanonical={pathname}
          autoJsonLd={{ kind: "webpage", pageName: "Contact Us" }}
        />
        <section className="relative h-48 animate-pulse bg-muted sm:h-56" aria-busy="true" aria-label="Loading contact page" />
        <PageBreadcrumb items={[{ label: "Contact Us" }]} />
        <div className="container max-w-5xl px-4 py-6 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-2xl bg-muted/90" />
            <div className="h-64 animate-pulse rounded-2xl bg-muted/90" />
          </div>
        </div>
      </Layout>
    );
  }

  const telHref = siteConfig.phone ? `tel:${siteConfig.phone.replace(/[^\d+]/g, "")}` : "";
  const contactRows = [
    { icon: Phone, label: "Phone", value: siteConfig.phone, href: telHref },
    { icon: Mail, label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
    { icon: MapPin, label: "Address", value: siteConfig.address },
    { icon: Clock, label: "Hours", value: siteConfig.workingHours },
  ];

  return (
    <Layout>
      <SeoHelmet
        layers={[hero!.seo]}
        fallbackTitle={formatPageTitle(hero!.title || "Contact Us", siteName)}
        fallbackDescription={hero!.subtitle}
        fallbackOgImage={hero!.slides?.[0]?.src}
        fallbackOgImageAlt={hero!.slides?.[0]?.alt}
        pathForCanonical={pathname}
        autoJsonLd={{ kind: "webpage", pageName: hero!.title || "Contact Us" }}
      />
      <PageHeroSlider
        images={hero!.slides}
        fallbackCtaButtons={hero!.ctaButtons}
        title={hero!.title}
        subtitle={hero!.subtitle}
      />

      <PageBreadcrumb items={[{ label: "Contact Us" }]} />

      <section className="border-t border-border/60 bg-gradient-to-b from-muted/35 to-background py-6 sm:py-8">
        <div className="container max-w-5xl px-4 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-6">
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
                <h2 className="font-heading text-base font-semibold text-primary">Contact</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {contactRows.map(({ icon: Icon, label, value, href }) => (
                    <div
                      key={label}
                      className={cn(
                        "flex gap-2.5 rounded-xl border border-border/50 bg-background/60 px-3 py-2.5",
                        (label === "Phone" || label === "Email") && "sm:col-span-2",
                      )}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                        <Icon className="h-4 w-4 text-secondary" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                        {href ? (
                          <a
                            href={href}
                            className="mt-0.5 block break-words font-body text-sm leading-snug text-foreground underline-offset-2 hover:text-secondary hover:underline"
                          >
                            {value}
                          </a>
                        ) : (
                          <p className="font-body text-sm leading-snug text-foreground">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-40 overflow-hidden rounded-2xl border border-border/70 shadow-sm sm:h-44">
                {siteConfig.googleMapsEmbed ? (
                  <iframe
                    src={siteConfig.googleMapsEmbed}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Clinic location"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">Map unavailable</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-[0_8px_28px_-14px_rgba(10,37,64,0.18)] sm:p-5">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-6 text-center sm:py-8">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/12">
                    <Send className="h-6 w-6 text-accent" aria-hidden />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-primary">Message sent</h3>
                  <p className="mt-1 max-w-xs font-body text-xs text-muted-foreground">We&apos;ll get back to you as soon as we can.</p>
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setEmail("");
                      setPhone("");
                      setService("");
                      setMessage("");
                    }}
                    className="mt-5 h-10 rounded-full bg-primary px-6 font-heading text-sm font-semibold"
                  >
                    Send another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <h2 className="font-heading text-base font-semibold text-primary">Message us</h2>
                    <p className="mt-0.5 font-body text-[11px] leading-snug text-muted-foreground">
                      Staff receive submissions in{" "}
                      <span className="font-medium text-foreground">Site config → Contact form inbox</span>.
                      {siteConfig.contactFormSendConfirmation
                        ? " With mail configured, you may get a short confirmation email."
                        : " Confirmation emails to visitors are off."}
                    </p>
                  </div>
                  {submitError ? (
                    <p className="rounded-lg border border-destructive/25 bg-destructive/10 px-2.5 py-2 font-body text-xs text-destructive">{submitError}</p>
                  ) : null}
                  <div>
                    <Label htmlFor="c-name" className="mb-1 block font-heading text-xs font-semibold text-foreground">
                      Full name *
                    </Label>
                    <Input
                      id="c-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="h-10 font-body text-sm"
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="c-email" className="mb-1 block font-heading text-xs font-semibold text-foreground">
                        Email *
                      </Label>
                      <Input
                        id="c-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="h-10 font-body text-sm"
                        maxLength={255}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="c-phone" className="mb-1 block font-heading text-xs font-semibold text-foreground">
                        Phone
                      </Label>
                      <Input
                        id="c-phone"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        placeholder="01XX-XXX-XXXX"
                        className="h-10 font-body text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="c-service" className="mb-1 block font-heading text-xs font-semibold text-foreground">
                      Service interest
                    </Label>
                    <Select value={service} onValueChange={setService}>
                      <SelectTrigger id="c-service" className="h-10 font-body text-sm">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="general">General inquiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="c-message" className="mb-1 block font-heading text-xs font-semibold text-foreground">
                      Message *
                    </Label>
                    <Textarea
                      id="c-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="How can we help?"
                      className={cn("min-h-[96px] resize-y font-body text-sm")}
                      maxLength={1000}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 w-full rounded-full bg-primary font-heading text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        Sending…
                      </>
                    ) : (
                      "Send message"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
