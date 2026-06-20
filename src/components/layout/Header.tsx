import { useMemo, useState } from "react";
import {
  Menu,
  Phone,
  ChevronDown,
  Mail,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";
import { IS_STRAPI_CONFIGURED } from "@/lib/api";
import type { NavItem } from "@/data/mockData";
import { cn } from "@/lib/utils";

function isNavActive(pathname: string, href: string): boolean {
  if (!href || href === "#") return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DesktopNavLink({ to, children, active }: { to: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "font-gamcaNav relative py-2 text-[15px] font-semibold capitalize text-primary no-underline transition-colors duration-300 ease-in-out",
        "after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-0 after:-translate-x-1/2 after:bg-secondary after:transition-all after:duration-300 after:content-['']",
        "hover:text-secondary hover:after:left-1/2 hover:after:w-full hover:after:-translate-x-1/2",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
        active &&
          "text-primary after:left-0 after:h-[3px] after:w-full after:-translate-x-0 after:bg-secondary",
      )}
    >
      {children}
    </Link>
  );
}

function DesktopNavDropdown({ item, pathname }: { item: NavItem; pathname: string }) {
  const childActive = item.children?.some((c) => isNavActive(pathname, c.href)) ?? false;
  return (
    <div className="group relative">
      <button
        type="button"
        className={cn(
          "font-gamcaNav inline-flex items-center gap-1 py-2 text-[15px] font-semibold capitalize text-primary transition-colors duration-300",
          "hover:text-secondary",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
          childActive && "text-primary",
        )}
        aria-expanded="false"
        aria-haspopup="true"
      >
        {item.label}
        <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" aria-hidden />
      </button>
      <div className="invisible absolute left-0 top-full z-50 w-[200px] pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
        <ul
          className="rounded-[3px] border border-primary/12 bg-muted py-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          role="menu"
        >
          {item.children?.map((child) => (
            <li key={child.href} role="none">
              <Link
                role="menuitem"
                to={child.href}
                className={cn(
                  "font-gamcaNav block px-4 py-2.5 text-[14px] font-semibold text-primary transition-colors hover:bg-white hover:text-secondary",
                  isNavActive(pathname, child.href) && "bg-white text-secondary",
                )}
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function renderDesktopNavItem(item: NavItem, pathname: string) {
  if (item.children?.length) {
    return <DesktopNavDropdown key={item.label} item={item} pathname={pathname} />;
  }
  return (
    <DesktopNavLink key={item.href} to={item.href} active={isNavActive(pathname, item.href)}>
      {item.label}
    </DesktopNavLink>
  );
}

const Header = () => {
  const { layoutReady, siteConfig, navItems } = useStrapiLayout();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  const items = navItems;
  const flatItems = useMemo(
    () => items.flatMap((item) => (item.children ? item.children : [item])),
    [items],
  );

  const itemsForSplit = useMemo(() => {
    const withReports: NavItem[] = [...items, { label: "Reports", href: "/reports" }];
    return withReports;
  }, [items]);

  const { leftNav, rightNav } = useMemo(() => {
    const mid = Math.ceil(itemsForSplit.length / 2);
    return {
      leftNav: itemsForSplit.slice(0, mid),
      rightNav: itemsForSplit.slice(mid),
    };
  }, [itemsForSplit]);

  const telHref = siteConfig.phone ? `tel:${siteConfig.phone.replace(/[^\d+]/g, "")}` : "tel:";
  const mailHref = siteConfig.email?.trim() ? `mailto:${siteConfig.email.trim()}` : "";
  const social = siteConfig.socialLinks ?? {};
  const socialEntries = [
    { url: social.facebook, Icon: Facebook, label: "Facebook" },
    { url: social.twitter, Icon: Twitter, label: "Twitter" },
    { url: social.linkedin, Icon: Linkedin, label: "LinkedIn" },
    { url: social.instagram, Icon: Instagram, label: "Instagram" },
    { url: social.youtube, Icon: Youtube, label: "YouTube" },
  ].filter((s): s is { url: string; Icon: typeof Facebook; label: string } => Boolean(s.url?.trim()));

  if (IS_STRAPI_CONFIGURED && !layoutReady) {
    return (
      <header
        className="sticky top-0 z-50 w-full isolate bg-white [backface-visibility:hidden]"
        role="banner"
      >
        <div className="hidden bg-primary text-primary-foreground lg:block">
          <div className="mx-auto flex max-w-[1400px] flex-row items-center justify-between gap-4 px-5 py-1.5 lg:h-10">
            <div className="flex min-w-0 flex-1 items-center justify-start gap-3">
              <div className="flex min-w-0 gap-0.5 overflow-hidden lg:flex-none lg:overflow-visible">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-7 w-7 shrink-0 animate-pulse rounded-[3px] bg-white/15" />
                ))}
              </div>
            </div>
            <div className="flex flex-row flex-nowrap items-center justify-end gap-3">
              <div className="h-3 w-28 animate-pulse rounded bg-white/20" />
              <div className="h-3 w-32 animate-pulse rounded bg-white/20" />
              <div className="h-7 w-28 animate-pulse rounded-[3px] bg-white/25" />
            </div>
          </div>
        </div>
        <div
          className="border-b border-primary/10 bg-[rgba(255,255,255,0.92)] shadow-[0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-[10px] supports-[backdrop-filter]:bg-[rgba(255,255,255,0.92)]"
          style={{ backdropFilter: "blur(10px)" }}
        >
          <div className="mx-auto hidden h-20 max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 lg:grid xl:px-8">
            <div className="flex justify-end gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-14 animate-pulse rounded bg-muted" />
              ))}
            </div>
            <div className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex justify-start gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-14 animate-pulse rounded bg-muted" />
              ))}
            </div>
          </div>
          <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-3 sm:px-6 lg:hidden">
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted sm:h-10 sm:w-10" />
            <div className="h-10 w-10 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className="sticky top-0 z-50 w-full isolate bg-white shadow-[0_1px_0_hsl(var(--primary)/0.08)] [backface-visibility:hidden] supports-[backdrop-filter]:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
      role="banner"
    >
      <div className="hidden bg-primary text-primary-foreground lg:block">
        <div className="mx-auto flex max-w-[1400px] flex-row items-center justify-between gap-4 px-5 py-1.5 lg:h-10">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={cn(
                "flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-none lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden",
                socialEntries.length > 3 && "touch-pan-x",
              )}
            >
              {socialEntries.length > 0 ? (
                socialEntries.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[3px] border border-[rgba(255,255,255,0.3)] text-white transition-all duration-300 hover:border-secondary hover:bg-secondary hover:text-secondary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
                    aria-label={label}
                  >
                    <Icon className="h-[13px] w-[13px]" strokeWidth={2} />
                  </a>
                ))
              ) : (
                <span className="line-clamp-1 font-gamcaNav text-[13px] font-medium leading-snug text-white">
                  {siteConfig.workingHours}
                </span>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-row flex-nowrap items-center justify-end gap-4">
            <a
              href={telHref}
              className="font-gamcaNav flex items-center gap-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
              style={{ letterSpacing: "0.3px" }}
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
              <span className="min-w-0 break-words">{siteConfig.phone}</span>
            </a>
            {mailHref ? (
              <a
                href={mailHref}
                className="font-gamcaNav flex max-w-[min(280px,32vw)] items-center gap-1.5 text-[13px] font-normal text-white transition-opacity hover:opacity-90 xl:max-w-[340px]"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-white" aria-hidden />
                <span className="min-w-0 truncate">{siteConfig.email}</span>
              </a>
            ) : null}
            <Link
              to="/book"
              className="font-gamcaNav inline-flex shrink-0 whitespace-nowrap rounded-full border-2 border-secondary bg-secondary px-[18px] py-1.5 text-center text-xs font-bold uppercase tracking-wide text-secondary-foreground transition-all duration-300 hover:bg-transparent hover:text-white"
              style={{ letterSpacing: "0.5px" }}
            >
              Book appointment
            </Link>
          </div>
        </div>
      </div>

      <div
        className="border-b border-primary/12 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/88"
        style={{ WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}
      >
        {/* Mobile / tablet: logo left, hamburger right */}
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-3 sm:px-6 lg:hidden">
          <Link
            to="/"
            className="flex shrink-0 items-center transition-transform duration-300 hover:scale-[1.03]"
            aria-label={`${siteConfig.siteName} home`}
          >
            <img
                src={siteConfig.logo}
                alt={`${siteConfig.siteName} logo`}
                className="h-10 w-auto max-w-[140px] object-contain sm:h-11 sm:max-w-[150px]"
                width={150}
                height={56}
            />
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-primary hover:bg-primary/10"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" strokeWidth={2} />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex h-full w-[280px] max-w-[85vw] flex-col border-l border-white/10 bg-primary p-0 text-primary-foreground"
            >
              <div className="border-b border-white/10 px-6 py-5">
                <SheetTitle className="text-left font-gamcaLogo text-lg font-bold text-white">
                  Menu
                </SheetTitle>
              </div>
              <nav className="flex flex-col gap-1 px-4 py-4 font-gamcaNav" aria-label="Main navigation">
                {flatItems.map((item) => (
                  <Link
                    key={`${item.href}-${item.label}`}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-md px-3 py-3 text-[15px] font-semibold transition-colors hover:bg-white/10 hover:text-secondary",
                      isNavActive(pathname, item.href) && "bg-white/10 text-secondary",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/reports"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-3 text-[15px] font-semibold transition-colors hover:bg-white/10 hover:text-secondary",
                    isNavActive(pathname, "/reports") && "bg-white/10 text-secondary",
                  )}
                >
                  Reports
                </Link>
                <Link to="/book" onClick={() => setOpen(false)} className="mt-2 px-3">
                  <span className="flex w-full items-center justify-center rounded-full border-2 border-secondary bg-secondary py-2.5 text-center text-xs font-bold uppercase tracking-wide text-secondary-foreground transition-all hover:bg-transparent hover:text-white">
                    Book appointment
                  </span>
                </Link>
              </nav>
              <div className="mt-auto border-t border-white/10 px-6 py-5">
                <p className="mb-3 font-gamcaNav text-xs font-semibold uppercase tracking-wider text-white/70">
                  Contact
                </p>
                <div className="space-y-3">
                  <a
                    href={telHref}
                    onClick={() => setOpen(false)}
                    className="font-gamcaNav flex items-center gap-2.5 text-sm font-medium text-white transition-colors hover:text-secondary"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-secondary" aria-hidden />
                    <span className="min-w-0 break-words">{siteConfig.phone}</span>
                  </a>
                  {mailHref ? (
                    <a
                      href={mailHref}
                      onClick={() => setOpen(false)}
                      className="font-gamcaNav flex items-center gap-2.5 text-sm font-normal text-white transition-colors hover:text-secondary"
                    >
                      <Mail className="h-4 w-4 shrink-0 text-white/90" aria-hidden />
                      <span className="min-w-0 break-all">{siteConfig.email}</span>
                    </a>
                  ) : null}
                  {socialEntries.length === 0 && siteConfig.workingHours ? (
                    <p className="font-gamcaNav text-xs leading-snug text-white/75">{siteConfig.workingHours}</p>
                  ) : null}
                </div>
              </div>
              {socialEntries.length > 0 ? (
                <div className="border-t border-white/10 px-6 py-5">
                  <p className="mb-2 font-gamcaNav text-xs font-semibold uppercase tracking-wider text-white/70">
                    Follow us
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {socialEntries.map(({ url, Icon, label }) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-[3px] border border-white/30 text-white transition-colors hover:bg-secondary hover:text-secondary-foreground"
                        aria-label={label}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop: grid keeps logo centered without overlapping nav links */}
        <div className="mx-auto hidden h-24 max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 lg:grid xl:h-28 xl:px-8">
          <nav
            className="flex min-w-0 items-center justify-end gap-x-5 xl:gap-x-9"
            aria-label="Main navigation left"
          >
            {leftNav.map((item) => renderDesktopNavItem(item, pathname))}
          </nav>

          <div className="flex shrink-0 justify-center px-2">
            <Link
              to="/"
              className="flex transition-transform duration-300 hover:scale-[1.03]"
              aria-label={`${siteConfig.siteName} home`}
            >
              <img
                  src={siteConfig.logo}
                  alt={`${siteConfig.siteName} logo`}
                  className="h-14 w-auto max-w-[170px] object-contain xl:h-16 xl:max-w-[190px]"
                  width={190}
                  height={70}
              />
            </Link>
          </div>

          <nav
            className="flex min-w-0 items-center justify-start gap-x-5 xl:gap-x-9"
            aria-label="Main navigation right"
          >
            {rightNav.map((item) => renderDesktopNavItem(item, pathname))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
