import Image from "next/image";

export default function PaywallBanner({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
  iconSrc
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: string;
  iconSrc?: string;
}) {
  return (
    <div className="card border-2 border-[var(--accent)] bg-[var(--accent-soft)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          {iconSrc ? (
            <Image src={iconSrc} alt="" width={40} height={40} />
          ) : icon ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-2xl">
              {icon}
            </span>
          ) : null}
          <div>
          <p className="font-semibold text-[var(--accent-strong)]">{title}</p>
          <p className="text-sm text-[var(--ink-muted)]">{description}</p>
          </div>
        </div>
        {actionLabel && actionHref ? (
          <a
            href={actionHref}
            className="btn-primary inline-flex h-10 items-center justify-center px-4 text-xs"
          >
            {actionLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}
