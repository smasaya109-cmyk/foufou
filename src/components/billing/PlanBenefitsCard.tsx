"use client";

import useSWR from "swr";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";
import { swrFetcher } from "@/lib/swr";

export default function PlanBenefitsCard() {
  const lang = useLang();
  const copy = getCopy(lang);
  const { data } = useSWR("/api/groups", swrFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true
  });
  const plan = data?.plan ?? "free";

  if (plan === "free") return null;

  const isPremium = plan === "premium";
  const title = isPremium ? copy.subscription.premiumPlan : copy.subscription.proPlan;
  const headline =
    lang === "en"
      ? isPremium
        ? "Premium features you can use now"
        : "Pro features you can use now"
      : isPremium
        ? "Premiumで使える機能"
        : "Proで使える機能";

  const proItems = [
    copy.subscription.unlimitedGroups,
    copy.subscription.advancedSplit,
    copy.subscription.insights,
    copy.subscription.export,
    copy.subscription.editorsLimit
  ];
  const premiumItems = [
    copy.subscription.photoShare,
    copy.subscription.editorsUnlimited,
    lang === "en" ? "All Pro features" : "Proの全機能"
  ];
  const items = isPremium ? [...premiumItems, ...proItems] : proItems;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{title}</p>
          <h2 className="text-xl font-semibold">{headline}</h2>
        </div>
      </div>
      <ul className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
