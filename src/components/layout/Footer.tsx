import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { RichText } from "@/components/content/RichText";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { IS_STRAPI_CONFIGURED, type FooterColumnConfig } from "@/lib/api";

function FooterDynamicColumn({
  col,
  googleMapsEmbed,
  mapPlaceholderLabel,
  iframeTitle,
}: {
  col: FooterColumnConfig;
  googleMapsEmbed: string;
  mapPlaceholderLabel: string;
  iframeTitle: string;
}) {
  return (
    <div>
      <h3 className="font-heading text-base font-bold mb-3 sm:text-lg sm:mb-[16px]">{col.title}</h3>
      {col.body ? (
        <RichText value={col.body} className="font-body text-xs text-background/80 mb-3 sm:text-sm sm:mb-[16px] [&_p]:mb-2 last:[&_p]:mb-0" />
      ) : null}
      {col.links.length > 0 ? (
        <ul className="flex flex-col gap-2 sm:gap-[8px]">
          {col.links.map((link) => (
            <li key={`${link.href}-${link.label}`}>
              {link.href.startsWith("/") ? (
                <Link
                  to={link.href}
                  className="font-body text-xs text-background/80 transition-colors hover:text-background sm:text-sm"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  href={link.href}
                  className="font-body text-xs text-background/80 transition-colors hover:text-background sm:text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {col.showMap ? (
        googleMapsEmbed ? (
          <iframe
            title={iframeTitle}
            src={googleMapsEmbed}
            className="mt-3 aspect-video w-full rounded-lg border-0 sm:mt-[16px]"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="mt-3 flex aspect-video w-full items-center justify-center rounded-lg bg-background/10 text-xs text-background/50 sm:mt-[16px] sm:text-sm">
            <MapPin className="mr-2 h-4 w-4 sm:mr-[8px] sm:h-5 sm:w-5" />
            {mapPlaceholderLabel}
          </div>
        )
      ) : null}
    </div>
  );
}

const Footer = () => {
  const { layoutReady, siteConfig, footerQuickLinks, footerServiceLinks } = useStrapiLayout();

  const telHref = siteConfig.phone ? `tel:${siteConfig.phone.replace(/[^\d+]/g, "")}` : "tel:";
  const fb = siteConfig.socialLinks.facebook;
  const ig = siteConfig.socialLinks.instagram;
  const li = siteConfig.socialLinks.linkedin;
  const footerCols = siteConfig.footerColumns && siteConfig.footerColumns.length > 0 ? siteConfig.footerColumns : null;
  const mapIframeTitle = siteConfig.quickContactIframeTitle?.trim() || `${siteConfig.siteName || "Clinic"} location`;
  const privacyLabel = siteConfig.footerPrivacyLinkLabel?.trim() || "Privacy Policy";
  const mapPlaceholder = siteConfig.footerMapPlaceholderLabel?.trim() || "Map Placeholder";
  const copyrightExtra = siteConfig.footerCopyrightExtra?.trim() || ", Dhaka. All rights reserved.";

  const mainGridClass =
    footerCols == null
      ? "lg:grid-cols-4"
      : footerCols.length <= 1
        ? "lg:grid-cols-2"
        : footerCols.length === 2
          ? "lg:grid-cols-3"
          : "lg:grid-cols-4";

  if (IS_STRAPI_CONFIGURED && !layoutReady) {
    return (
      <footer className="bg-foreground text-background">
        <div className="container px-4 py-8 sm:px-6 sm:py-[48px]">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-8 w-32 animate-pulse rounded bg-background/10" />
                <div className="h-3 w-full animate-pulse rounded bg-background/10" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-background/10" />
              </div>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-foreground text-background">
      <div className="container px-4 py-8 sm:px-6 sm:py-[48px]">
        <div className={`grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-[32px] ${mainGridClass}`}>
          <div>
            <div className="mb-4 flex items-center gap-[8px] sm:mb-[16px]">
              {siteConfig.footerLogo?.trim() ? (
                <img
                  src={siteConfig.footerLogo}
                  alt={`${siteConfig.siteName} logo`}
                  className="h-[36px] w-auto max-w-[220px] object-contain object-left sm:h-10"
                />
              ) : siteConfig.siteName?.trim() ? (
                <p className="font-heading text-xl font-bold leading-tight tracking-tight text-background sm:text-2xl">
                  {siteConfig.siteName}
                </p>
              ) : null}
            </div>
            <p className="font-body text-xs leading-relaxed text-background/80 mb-4 sm:text-sm sm:mb-[16px]">
              {siteConfig.tagline}
              {siteConfig.footerBrandExtra ? (
                <>
                  {siteConfig.tagline ? ". " : ""}
                  {siteConfig.footerBrandExtra}
                </>
              ) : null}
            </p>
            <div className="flex flex-col gap-2 sm:gap-[8px]">
              <a
                href={telHref}
                className="flex items-center gap-2 text-xs text-background/80 hover:text-background sm:text-sm sm:gap-[8px]"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>{siteConfig.phone}</span>
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-2 text-xs text-background/80 hover:text-background sm:text-sm sm:gap-[8px]"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>{siteConfig.email}</span>
              </a>
              <div className="flex items-center gap-2 text-xs text-background/80 sm:text-sm sm:gap-[8px]">
                <MapPin className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>{siteConfig.address}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-background/80 sm:text-sm sm:gap-[8px]">
                <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                <span>{siteConfig.workingHours}</span>
              </div>
            </div>
          </div>

          {footerCols ? (
            footerCols.map((col) => (
              <FooterDynamicColumn
                key={col.title}
                col={col}
                googleMapsEmbed={siteConfig.googleMapsEmbed}
                mapPlaceholderLabel={mapPlaceholder}
                iframeTitle={mapIframeTitle}
              />
            ))
          ) : (
            <>
              <div>
                <h3 className="font-heading text-base font-bold mb-3 sm:text-lg sm:mb-[16px]">
                  {siteConfig.footerLegacyQuickTitle?.trim() || "Quick Navigation"}
                </h3>
                <ul className="flex flex-col gap-2 sm:gap-[8px]">
                  {footerQuickLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="font-body text-xs text-background/80 transition-colors hover:text-background sm:text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-heading text-base font-bold mb-3 sm:text-lg sm:mb-[16px]">
                  {siteConfig.footerLegacyServicesTitle?.trim() || "Our Services"}
                </h3>
                <ul className="flex flex-col gap-2 sm:gap-[8px]">
                  {footerServiceLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="font-body text-xs text-background/80 transition-colors hover:text-background sm:text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-heading text-base font-bold mb-3 sm:text-lg sm:mb-[16px]">
                  {siteConfig.footerLegacyHelpTitle?.trim() || "Help Desk"}
                </h3>
                <p className="font-body text-xs text-background/80 mb-3 sm:text-sm sm:mb-[16px]">
                  {siteConfig.footerLegacyHelpBody?.trim() ||
                    "Need assistance? Our help desk is available during working hours."}
                </p>
                {siteConfig.googleMapsEmbed ? (
                  <iframe
                    title={mapIframeTitle}
                    src={siteConfig.googleMapsEmbed}
                    className="aspect-video w-full rounded-lg border-0"
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="aspect-video w-full rounded-lg bg-background/10 flex items-center justify-center text-xs text-background/50 sm:text-sm">
                    <MapPin className="mr-2 h-4 w-4 sm:mr-[8px] sm:h-5 sm:w-5" />
                    {mapPlaceholder}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 border-t border-background/20 pt-4 sm:mt-[48px] sm:flex-row sm:justify-between sm:gap-[12px] sm:pt-[24px]">
          <p className="font-body text-[10px] text-background/50 text-center sm:text-xs">
            © {new Date().getFullYear()} {siteConfig.siteName}
            {copyrightExtra}
          </p>
          <div className="flex items-center gap-4 sm:gap-[16px]">
            <Link to="/privacy" className="font-body text-[10px] text-background/50 hover:text-background sm:text-xs">
              {privacyLabel}
            </Link>
            <div className="flex items-center gap-3 sm:gap-[12px]">
              {fb ? (
                <a href={fb} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-background/50 hover:text-background">
                  <Facebook className="h-4 w-4" />
                </a>
              ) : null}
              {ig ? (
                <a href={ig} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-background/50 hover:text-background">
                  <Instagram className="h-4 w-4" />
                </a>
              ) : null}
              {li ? (
                <a href={li} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-background/50 hover:text-background">
                  <Linkedin className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
