"use client";

import Link from "next/link";
import { useState } from "react";
import Alert from "@/components/common/Alert";
import { fetchWithAuth } from "@/lib/client-api";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export default function SubscriptionPage() {
  const paymentsDisabled = false;
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const isMonthly = billing === "monthly";
  const [proPending, setProPending] = useState(false);
  const [premiumPending, setPremiumPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lang = useLang();
  const copy = getCopy(lang);

  async function startCheckout(tier: "pro" | "premium") {
    if (paymentsDisabled) return;
    setError(null);
    if (tier === "pro") setProPending(true);
    if (tier === "premium") setPremiumPending(true);
    try {
      const data = await fetchWithAuth(
        tier === "pro" ? "/api/billing/pro/checkout" : "/api/billing/premium/checkout",
        {
          method: "POST",
          body: JSON.stringify({ plan: isMonthly ? "monthly" : "yearly" })
        }
      );
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err?.message ?? copy.subscription.checkoutFailed);
    } finally {
      if (tier === "pro") setProPending(false);
      if (tier === "premium") setPremiumPending(false);
    }
  }
  function InfoTip({ text }: { text: string }) {
    return (
      <span className="group relative inline-flex items-center">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--stroke)] bg-white text-[11px] font-semibold text-[var(--ink-muted)]">
          ?
        </span>
        <span className="pointer-events-none absolute left-1/2 top-7 z-10 w-56 -translate-x-1/2 rounded-xl bg-black px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
          {text}
        </span>
      </span>
    );
  }
  return (
    <div className="space-y-10">
      <div className="card p-7 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          {lang === "en" ? "Upgrade" : "Upgrade"}
        </p>
        <h1 className="section-title text-3xl">{copy.subscription.title}</h1>
        <p className="text-sm text-muted">{copy.subscription.subtitle}</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex w-full justify-center">
          <div className="inline-flex items-center rounded-full border-2 border-[var(--stroke)] bg-white p-1 text-xs">
            <button
              className={`rounded-full px-4 py-2 font-semibold ${
                isMonthly ? "bg-[var(--accent)] text-white" : "text-[var(--ink-muted)]"
              }`}
              onClick={() => setBilling("monthly")}
            >
              {copy.subscription.monthly}
            </button>
            <button
              className={`rounded-full px-4 py-2 font-semibold ${
                !isMonthly ? "bg-[var(--accent)] text-white" : "text-[var(--ink-muted)]"
              }`}
              onClick={() => setBilling("yearly")}
            >
              {copy.subscription.yearly}
              <span className="ml-2 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] text-[var(--accent-strong)]">
                {copy.subscription.deal}
              </span>
            </button>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card flex h-full flex-col p-6">
            <p className="text-sm font-semibold text-muted">{copy.subscription.freePlan}</p>
            <div className="mt-3 flex min-h-[72px] flex-wrap items-baseline gap-2">
              <span className="text-3xl font-extrabold leading-none">¥0</span>
              <span className="text-sm text-muted">{copy.subscription.perMonth}</span>
              <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] text-[var(--ink-muted)]">
                {copy.subscription.foreverFree}
              </span>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  ✓
                </span>
                <span className="flex items-center gap-2">
                  {copy.subscription.groupLimit}
                  <InfoTip text={copy.subscription.groupLimitTip} />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  ✓
                </span>
                <span className="flex items-center gap-2">
                  {copy.subscription.expenseCore}
                  <InfoTip text={copy.subscription.expenseCoreTip} />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  ✓
                </span>
                <span className="flex items-center gap-2">
                  {copy.subscription.basicSplit}
                  <InfoTip text={copy.subscription.basicSplitTip} />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  ✓
                </span>
                <span className="flex items-center gap-2">
                  {copy.subscription.shareView}
                  <InfoTip text={copy.subscription.shareViewTip} />
                </span>
              </li>
            </ul>
            <div className="mt-auto pt-6">
              <Link href="/app" className="btn-outline inline-flex h-12 w-full items-center justify-center">
              {copy.subscription.freeStart}
              </Link>
            </div>
          </div>

          <div className="card flex h-full flex-col border-2 border-[var(--accent)] p-6">
            <p className="text-sm font-semibold text-[var(--accent-strong)]">{copy.subscription.proPlan}</p>
            <div className="mt-3 flex min-h-[72px] flex-wrap items-baseline gap-2">
              <span className="text-3xl font-extrabold leading-none">
                {isMonthly ? "¥880" : "¥6,600"}
              </span>
              <span className="text-sm text-muted">{isMonthly ? copy.subscription.perMonth : copy.subscription.perYear}</span>
              <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] text-[var(--accent-strong)]">
                {isMonthly ? copy.subscription.priceYearlyPro : copy.subscription.priceMonthlyEquivalentPro}
              </span>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                  ★
                </span>
                <span className="flex items-center gap-2">
                  {copy.subscription.unlimitedGroups}
                  <InfoTip text={copy.subscription.unlimitedGroupsTip} />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                  ★
                </span>
                <span className="flex items-center gap-2">
                  {copy.subscription.advancedSplit}
                  <InfoTip text={copy.subscription.advancedSplitTip} />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                  ★
                </span>
                <span className="flex items-center gap-2">
                  {copy.subscription.insights}
                  <InfoTip text={copy.subscription.insightsTip} />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                  ★
                </span>
                <span className="flex items-center gap-2">
                  {copy.subscription.export}
                  <InfoTip text={copy.subscription.exportTip} />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                  ★
                </span>
                <span className="flex items-center gap-2">
                  {copy.subscription.editorsLimit}
                  <InfoTip text={copy.subscription.editorsLimitTip} />
                </span>
              </li>
            </ul>
            <div className="mt-auto pt-6">
              <button
                className="btn-primary inline-flex h-12 w-full items-center justify-center"
                onClick={() => startCheckout("pro")}
                disabled={proPending || paymentsDisabled}
              >
                {paymentsDisabled ? copy.common.preparing : proPending ? copy.common.processing : copy.subscription.proStart}
              </button>
            </div>
          </div>

          <div className="card flex h-full flex-col p-6">
            <p className="text-sm font-semibold text-muted">{copy.subscription.premiumPlan}</p>
            <div className="mt-3 flex min-h-[72px] flex-wrap items-baseline gap-2">
              <span className="text-3xl font-extrabold leading-none">
                {isMonthly ? "¥1,480" : "¥11,880"}
              </span>
              <span className="text-sm text-muted">{isMonthly ? copy.subscription.perMonth : copy.subscription.perYear}</span>
              <span className="inline-flex shrink-0 items-center rounded-full bg-[var(--bg-soft)] px-2 py-0.5 text-[10px] text-[var(--ink-muted)]">
                {isMonthly ? copy.subscription.priceYearlyPremium : copy.subscription.priceMonthlyEquivalentPremium}
              </span>
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  ✓
                </span>
                <span className="flex items-center gap-2">
                  {copy.subscription.photoShare}
                  <InfoTip text={copy.subscription.photoShareTip} />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  ✓
                </span>
                <span className="flex items-center gap-2">
                  {copy.subscription.editorsUnlimited}
                  <InfoTip text={copy.subscription.editorsUnlimitedTip} />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  ✓
                </span>
                <span className="flex items-center gap-2">
                  {lang === "en" ? "All Pro features" : "Proの全機能"}
                  <InfoTip text={lang === "en" ? "Includes all Pro features." : "Proの全機能が含まれます。"} />
                </span>
              </li>
            </ul>
            <div className="mt-auto pt-6">
              <button
                className="btn-outline inline-flex h-12 w-full items-center justify-center"
                onClick={() => startCheckout("premium")}
                disabled={premiumPending || paymentsDisabled}
              >
                {paymentsDisabled ? copy.common.preparing : premiumPending ? copy.common.processing : copy.subscription.premiumStart}
              </button>
            </div>
          </div>
        </div>

        {null}
      </div>
      {error ? <Alert message={error} /> : null}

    </div>
  );
}
