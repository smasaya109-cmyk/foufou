"use client";

import PremiumBadge from "@/components/group/PremiumBadge";
import type { ReactNode } from "react";
import { useLang } from "@/hooks/useLang";

export default function GroupHeader({
  title,
  icon,
  period,
  premiumLabel,
  action,
}: {
  title: string;
  icon?: string | null;
  period?: string;
  premiumLabel: string;
  action?: ReactNode;
}) {
  const lang = useLang();
  return (
    <div className="card p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {lang === "en" ? "Trip" : "TRIP"}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon ?? "🧳"}</span>
            <h1 className="section-title text-3xl">{title}</h1>
          </div>
          {period ? <p className="text-sm text-muted">{period}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <PremiumBadge label={premiumLabel} />
        </div>
      </div>
    </div>
  );
}
