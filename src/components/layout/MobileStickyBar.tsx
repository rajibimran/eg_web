import { Link } from "react-router-dom";
import { Phone } from "lucide-react";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";

const MobileStickyBar = () => {
  const { siteConfig } = useStrapiLayout();
  const telDigits = siteConfig.phone?.replace(/[^\d+]/g, "") ?? "";
  const telHref = telDigits ? `tel:${telDigits}` : "tel:+880248316027";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur supports-[backdrop-filter]:bg-card/90 lg:hidden">
      <Link
        to="/book"
        className="flex h-12 min-h-[48px] flex-1 touch-manipulation items-center justify-center gap-2 bg-accent px-2 text-center font-heading text-xs font-semibold text-accent-foreground sm:text-sm"
      >
        Book appointment
      </Link>
      <a
        href={telHref}
        className="flex h-12 min-h-[48px] flex-1 touch-manipulation items-center justify-center gap-2 bg-primary px-2 text-center font-heading text-xs font-semibold text-primary-foreground sm:text-sm"
      >
        <Phone className="h-4 w-4 shrink-0" aria-hidden />
        Call now
      </a>
    </div>
  );
};

export default MobileStickyBar;
