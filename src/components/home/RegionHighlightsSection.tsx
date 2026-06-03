import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  api,
  IS_STRAPI_CONFIGURED,
  type CountryFlag,
  type RegionHighlightsSectionBanner,
} from "@/lib/api";

const LOCAL_COUNTRY_FLAG_FALLBACK: CountryFlag[] = [
  { name: "Bahrain", flag: "https://flagcdn.com/w160/bh.png" },
  { name: "Kuwait", flag: "https://flagcdn.com/w160/kw.png" },
  { name: "Oman", flag: "https://flagcdn.com/w160/om.png" },
  { name: "UAE", flag: "https://flagcdn.com/w160/ae.png" },
  { name: "Saudi Arabia", flag: "https://flagcdn.com/w160/sa.png" },
  { name: "Qatar", flag: "https://flagcdn.com/w160/qa.png" },
  { name: "Yemen", flag: "https://flagcdn.com/w160/ye.png" },
];

/** CMS-driven banner + country-flag rows; hidden when Strapi off, unpublished, or banner incomplete. */
const RegionHighlightsSection = () => {
  const [banner, setBanner] = useState<RegionHighlightsSectionBanner | null | undefined>(undefined);
  const [countries, setCountries] = useState<CountryFlag[]>([]);

  useEffect(() => {
    if (!IS_STRAPI_CONFIGURED) {
      setBanner(null);
      setCountries([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const [b, list] = await Promise.all([
        api.regionHighlightsSection.get(),
        api.countryFlags.getAll(LOCAL_COUNTRY_FLAG_FALLBACK),
      ]);
      if (!cancelled) {
        setBanner(b);
        setCountries(list);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!IS_STRAPI_CONFIGURED || banner === null) {
    return null;
  }

  if (banner === undefined || countries.length === 0) {
    return null;
  }

  return (
    <section className="overflow-x-hidden bg-muted/30 py-10 sm:py-16">
      <div className="container min-w-0 px-4 sm:px-6">
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-border/70 shadow-lg shadow-primary/10 sm:mb-10">
          <img
            src={banner.bannerImageUrl}
            alt={banner.bannerTitle}
            className="h-[240px] w-full object-cover sm:h-[320px] lg:h-[400px]"
            loading="lazy"
            width={1920}
            height={640}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/92 via-primary/55 to-secondary/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-transparent to-primary/20" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-[32px]">
            <h2 className="font-heading text-xl font-semibold tracking-tight text-white sm:text-2xl lg:text-4xl">
              {banner.bannerTitle}
            </h2>
            <p className="mt-1 line-clamp-2 max-w-xl font-body text-xs text-white/90 sm:mt-[8px] sm:line-clamp-none sm:text-sm lg:text-base">
              {banner.bannerDescription}
            </p>
            <div className="-mx-4 mt-2 flex snap-x snap-mandatory gap-1 overflow-x-auto px-4 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] sm:mx-0 sm:mt-[16px] sm:flex-wrap sm:gap-[12px] sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden">
              {countries.map((country) => (
                <div
                  key={country.name}
                  className="group/flag flex shrink-0 snap-start items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/40 sm:gap-[6px] sm:px-[12px] sm:py-[6px]"
                >
                  <img
                    src={country.flag}
                    alt={`${country.name} flag`}
                    className="h-3.5 w-4 rounded-sm object-cover sm:h-[20px] sm:w-[28px]"
                    loading="lazy"
                  />
                  <span className="whitespace-nowrap font-heading text-[9px] font-semibold text-white sm:text-xs">
                    {country.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {countries.map((country) => (
            <div
              key={country.name}
              className="group flex flex-col items-center rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md sm:p-6"
            >
              <div className="relative mb-3 flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full border-[3px] border-muted bg-muted transition-transform duration-300 group-hover:scale-110 group-hover:border-primary/20 sm:mb-[16px] sm:h-[80px] sm:w-[80px]">
                <img
                  src={country.flag}
                  alt={`${country.name} flag`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <h3 className="mb-2 text-center font-heading text-xs font-semibold text-foreground sm:mb-[12px] sm:text-sm">
                {country.name.toUpperCase()}
              </h3>
              <Link to="/book">
                <Button
                  variant="outline"
                  className="h-8 rounded-full border-secondary/40 px-3 font-heading text-[10px] font-semibold text-secondary transition-colors group-hover:bg-secondary group-hover:text-secondary-foreground sm:h-9 sm:px-5 sm:text-xs"
                >
                  Book Now
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegionHighlightsSection;
