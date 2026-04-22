import { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { api, defaultSiteConfig, IS_STRAPI_CONFIGURED } from "@/lib/api";
import { cn } from "@/lib/utils";

const QuickContactSection = () => {
  const { siteConfig } = useStrapiLayout();
  const sectionTitle =
    siteConfig.quickContactSectionTitle?.trim() || defaultSiteConfig.quickContactSectionTitle || "Get In Touch";
  const sectionBody =
    siteConfig.quickContactSectionBody?.trim() || defaultSiteConfig.quickContactSectionBody || "";
  const formHeading =
    siteConfig.quickContactFormHeading?.trim() || defaultSiteConfig.quickContactFormHeading || "Send a Message";
  const successHeading =
    siteConfig.quickContactSuccessHeading?.trim() || defaultSiteConfig.quickContactSuccessHeading || "Message Sent!";
  const successBody =
    siteConfig.quickContactSuccessBody?.trim() || defaultSiteConfig.quickContactSuccessBody || "";
  const iframeTitle =
    siteConfig.quickContactIframeTitle?.trim() ||
    defaultSiteConfig.quickContactIframeTitle ||
    `${siteConfig.siteName || defaultSiteConfig.siteName} location`;

  const telDigits = siteConfig.phone?.replace(/[^\d+]/g, "") ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitError(null);
    setIsSubmitting(true);
    const result = await api.contactSubmissions.submit({
      formKey: "home_quick",
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    setIsSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.error ?? "Could not send. Please try again or use the phone number above.");
      return;
    }
    setSubmitted(true);
  };

  const contactRows = [
    {
      icon: Phone,
      label: "Phone",
      node: telDigits ? (
        <a href={`tel:${telDigits}`} className="font-body text-[13px] text-muted-foreground transition-colors hover:text-secondary sm:text-sm">
          {siteConfig.phone}
        </a>
      ) : (
        <span className="text-[13px] text-muted-foreground sm:text-sm">—</span>
      ),
    },
    {
      icon: Mail,
      label: "Email",
      node: siteConfig.email?.trim() ? (
        <a
          href={`mailto:${siteConfig.email.trim()}`}
          className="break-all font-body text-[13px] text-muted-foreground transition-colors hover:text-secondary sm:text-sm"
        >
          {siteConfig.email}
        </a>
      ) : (
        <span className="text-[13px] text-muted-foreground sm:text-sm">—</span>
      ),
    },
    {
      icon: MapPin,
      label: "Address",
      node: (
        <p className="font-body text-[13px] leading-snug text-muted-foreground sm:text-sm">{siteConfig.address || "—"}</p>
      ),
    },
    {
      icon: Clock,
      label: "Hours",
      node: (
        <p className="font-body text-[13px] leading-snug text-muted-foreground sm:text-sm">{siteConfig.workingHours || "—"}</p>
      ),
    },
  ];

  return (
    <section
      className="relative border-t border-border/80 bg-gradient-to-b from-background via-muted/25 to-background py-10 sm:py-14"
      aria-labelledby="quick-contact-heading"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/40 to-transparent" aria-hidden />

      <div className="container px-4 sm:px-6">
        <header className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <div className="mb-3 flex items-center justify-center gap-3">
            <span className="h-px max-w-[72px] flex-1 bg-gradient-to-r from-transparent to-border sm:max-w-[100px]" aria-hidden />
            <p className="shrink-0 font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary sm:text-[11px]">
              Contact
            </p>
            <span className="h-px max-w-[72px] flex-1 bg-gradient-to-l from-transparent to-border sm:max-w-[100px]" aria-hidden />
          </div>
          <h2 id="quick-contact-heading" className="font-heading text-xl font-semibold tracking-tight text-primary sm:text-2xl">
            {sectionTitle}
          </h2>
          {sectionBody ? (
            <p className="mx-auto mt-2 max-w-md font-body text-sm leading-snug text-muted-foreground sm:text-[15px]">{sectionBody}</p>
          ) : null}
          {!IS_STRAPI_CONFIGURED ? (
            <p className="mx-auto mt-3 max-w-md rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              Connect the site to Strapi (<code className="rounded bg-amber-100/80 px-1 dark:bg-amber-900/60">VITE_STRAPI_URL</code>) to enable this form.
            </p>
          ) : null}
        </header>

        <div className="mx-auto grid min-w-0 max-w-5xl grid-cols-1 gap-5 lg:max-w-none lg:grid-cols-2 lg:gap-6 xl:gap-8">
          <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
            <div
              className={cn(
                "overflow-hidden rounded-xl border border-border/70 bg-card",
                "shadow-[0_4px_24px_-6px_rgba(10,37,64,0.1)]",
              )}
            >
              <div className="h-1 w-full bg-gradient-to-r from-secondary to-secondary/60" aria-hidden />
              <div className="divide-y divide-border/60 px-4 py-1 sm:px-5">
                {contactRows.map(({ icon: Icon, label, node }) => (
                  <div key={label} className="flex items-start gap-3 py-3.5 sm:gap-3.5 sm:py-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-secondary/20 bg-secondary/[0.07] sm:h-10 sm:w-10">
                      <Icon className="h-4 w-4 text-secondary sm:h-[18px] sm:w-[18px]" strokeWidth={2} aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="font-heading text-[11px] font-semibold uppercase tracking-wide text-primary/90">{label}</p>
                      <div className="mt-0.5">{node}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={cn(
                "aspect-video w-full overflow-hidden rounded-xl border border-border/70 bg-muted/20",
                "shadow-[0_4px_20px_-6px_rgba(10,37,64,0.12)] ring-1 ring-primary/[0.04]",
              )}
            >
              <iframe
                src={siteConfig.googleMapsEmbed}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={iframeTitle}
                className="h-full w-full"
              />
            </div>
          </div>

          <div
            className={cn(
              "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card",
              "shadow-[0_4px_24px_-6px_rgba(10,37,64,0.1)]",
            )}
          >
            <div className="h-1 w-full bg-gradient-to-r from-primary/90 to-primary/50" aria-hidden />
            <div className="p-4 sm:p-6">
              {submitted ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center px-2 py-8 text-center sm:min-h-[320px]">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-success/20 bg-success/10 sm:h-16 sm:w-16">
                    <Send className="h-6 w-6 text-success sm:h-7 sm:w-7" strokeWidth={2} aria-hidden />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-primary">{successHeading}</h3>
                  {successBody ? (
                    <p className="mt-2 max-w-sm font-body text-sm leading-relaxed text-muted-foreground">{successBody}</p>
                  ) : null}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h3 className="font-heading text-base font-semibold text-primary sm:text-lg">{formHeading}</h3>
                    <p className="mt-1 font-body text-xs text-muted-foreground sm:text-[13px]">
                      We reply during working hours. Fields marked * are required.
                    </p>
                  </div>

                  {submitError ? (
                    <p className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-xs leading-snug text-destructive sm:text-sm">
                      {submitError}
                    </p>
                  ) : null}

                  <div className="space-y-3.5 sm:space-y-4">
                    <div>
                      <Label htmlFor="qc-name" className="mb-1.5 block font-heading text-[11px] font-semibold uppercase tracking-wide text-foreground/90">
                        Name <span className="text-secondary">*</span>
                      </Label>
                      <Input
                        id="qc-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="h-10 rounded-lg border-border/80 bg-background/80 font-body text-sm transition-shadow focus-visible:ring-2 focus-visible:ring-secondary/30 sm:h-11"
                        maxLength={100}
                        required
                        autoComplete="name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="qc-email" className="mb-1.5 block font-heading text-[11px] font-semibold uppercase tracking-wide text-foreground/90">
                        Email <span className="text-secondary">*</span>
                      </Label>
                      <Input
                        id="qc-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="h-10 rounded-lg border-border/80 bg-background/80 font-body text-sm transition-shadow focus-visible:ring-2 focus-visible:ring-secondary/30 sm:h-11"
                        maxLength={255}
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="qc-message" className="mb-1.5 block font-heading text-[11px] font-semibold uppercase tracking-wide text-foreground/90">
                        Message <span className="text-secondary">*</span>
                      </Label>
                      <Textarea
                        id="qc-message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="How can we help you?"
                        className="min-h-[108px] resize-y rounded-lg border-border/80 bg-background/80 font-body text-sm transition-shadow focus-visible:ring-2 focus-visible:ring-secondary/30 sm:min-h-[120px]"
                        maxLength={1000}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 w-full rounded-full bg-secondary font-heading text-sm font-semibold text-secondary-foreground shadow-md transition-[filter,transform] hover:brightness-105 active:scale-[0.99] sm:h-11"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        Sending...
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
      </div>
    </section>
  );
};

export default QuickContactSection;
