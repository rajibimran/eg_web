import { Stethoscope, ScanLine, TestTubes, Syringe, type LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Stethoscope,
  ScanLine,
  TestTubes,
  Syringe,
};

type ServiceMarkProps = {
  icon: string;
  iconImage?: string;
  className?: string;
};

/** Service list/detail icon: prefers Strapi **iconImage** (Media), else Lucide **icon** key. */
export function ServiceMark({ icon, iconImage, className = "h-5 w-5 text-primary" }: ServiceMarkProps) {
  if (iconImage) {
    return (
      <img
        src={iconImage}
        alt=""
        aria-hidden
        className={`object-contain ${className}`}
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
      />
    );
  }
  const Icon = iconMap[icon] ?? Stethoscope;
  return <Icon className={className} aria-hidden />;
}
