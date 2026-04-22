import type { CertificationBadge } from "@/lib/api";

type Props = {
  cert: CertificationBadge;
  /** Applied to the interactive wrapper (`<a>` or `<span>`). */
  className?: string;
  classNameImg?: string;
  classNameText?: string;
};

/**
 * Logo or text label for a certification row; optional `verificationUrl` wraps content in an external link.
 */
export function CertificationBadgeMedia({ cert, className = "", classNameImg = "", classNameText = "" }: Props) {
  const title = cert.shortDescription?.trim() || undefined;
  const alt = cert.name?.trim() || cert.shortDescription?.trim()?.slice(0, 120) || "Certification partner";
  const desc = cert.shortDescription?.trim() ?? "";
  const textLabel = cert.name?.trim() || (desc ? `${desc.slice(0, 48)}${desc.length > 48 ? "…" : ""}` : "Partner");

  const body = cert.logoUrl ? (
    <img src={cert.logoUrl} alt={alt} className={classNameImg} loading="lazy" decoding="async" />
  ) : (
    <span className={classNameText}>{textLabel}</span>
  );

  if (cert.verificationUrl?.trim()) {
    return (
      <a
        href={cert.verificationUrl.trim()}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={title}
      >
        {body}
      </a>
    );
  }

  return (
    <span className={className} title={title}>
      {body}
    </span>
  );
}
