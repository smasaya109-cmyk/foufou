"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";
import { fetchWithAuth } from "@/lib/client-api";
import { swrFetcher } from "@/lib/swr";

export default function ManageSubscriptionButton() {
  const lang = useLang();
  const copy = getCopy(lang);
  const { data } = useSWR("/api/groups", swrFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true
  });
  const plan = data?.plan ?? "free";
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const [showSurvey, setShowSurvey] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "premium" | "other">("pro");
  const [usagePeriod, setUsagePeriod] = useState("");
  const [reason, setReason] = useState("");
  const isPremium = plan === "premium";
  return (
    <div className="relative flex flex-col">
      <button
        className="rounded-full border border-[var(--stroke)] bg-white px-4 py-2 text-sm"
        disabled={pending}
        onClick={async () => {
          if (plan === "free") {
            const message = lang === "en" ? "You are currently on the Free plan." : "現在はFreeプランです。";
            setNotice(message);
            if (noticeTimer.current) {
              window.clearTimeout(noticeTimer.current);
            }
            noticeTimer.current = window.setTimeout(() => {
              setNotice(null);
            }, 2500);
            return;
          }
          setSelectedPlan(isPremium ? "premium" : "pro");
          setStep(0);
          setShowSurvey(true);
        }}
      >
        {pending ? copy.common.processing : copy.common.manageBilling}
      </button>
      {notice ? (
        <p className="pointer-events-none absolute left-0 top-full mt-2 text-xs text-muted">
          {notice}
        </p>
      ) : null}

      {showSurvey ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-10">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                {lang === "en" ? "Cancel subscription" : "解約前の確認"}
              </p>
              <button
                className="text-xs text-muted"
                onClick={() => setShowSurvey(false)}
              >
                {lang === "en" ? "Close" : "閉じる"}
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {step === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">
                    {lang === "en"
                      ? "Which plan are you canceling?"
                      : "どのプランを解約しますか？"}
                  </p>
                  <div className="flex flex-col gap-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="cancel-plan"
                        value="pro"
                        checked={selectedPlan === "pro"}
                        onChange={() => setSelectedPlan("pro")}
                      />
                      Pro
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="cancel-plan"
                        value="premium"
                        checked={selectedPlan === "premium"}
                        onChange={() => setSelectedPlan("premium")}
                      />
                      Premium
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="cancel-plan"
                        value="other"
                        checked={selectedPlan === "other"}
                        onChange={() => setSelectedPlan("other")}
                      />
                      {lang === "en" ? "Other / Not sure" : "その他・分からない"}
                    </label>
                  </div>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">
                    {lang === "en"
                      ? "How long have you used FouFou?"
                      : "どのくらいの期間FouFouを使いましたか？"}
                  </p>
                  <select
                    className="input-soft w-full text-sm"
                    value={usagePeriod}
                    onChange={(event) => setUsagePeriod(event.target.value)}
                  >
                    <option value="">{lang === "en" ? "Select" : "選択してください"}</option>
                    <option value="within_1_week">{lang === "en" ? "Within 1 week" : "1週間以内"}</option>
                    <option value="under_1_month">{lang === "en" ? "Under 1 month" : "1か月未満"}</option>
                    <option value="1_3_months">{lang === "en" ? "1–3 months" : "1〜3か月"}</option>
                    <option value="3_6_months">{lang === "en" ? "3–6 months" : "3〜6か月"}</option>
                    <option value="over_6_months">{lang === "en" ? "Over 6 months" : "6か月以上"}</option>
                  </select>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">
                    {lang === "en"
                      ? "What made you decide to cancel?"
                      : "解約するにあたっての理由を教えてください"}
                  </p>
                  <textarea
                    className="input-soft w-full text-sm"
                    rows={4}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder={
                      lang === "en"
                        ? "Share your reason (optional)"
                        : "任意で入力してください"
                    }
                  />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">
                    {lang === "en"
                      ? "Are you sure you want to cancel?"
                      : "本当に解約しますか？"}
                  </p>
                  <p className="text-xs text-muted">
                    {lang === "en"
                      ? "You can return to manage your plan anytime."
                      : "いつでも再開できます。"}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                className="btn-outline h-10 px-4 text-xs"
                onClick={() => {
                  if (step === 0) {
                    setShowSurvey(false);
                  } else {
                    setStep((prev) => Math.max(0, prev - 1));
                  }
                }}
              >
                {lang === "en" ? "Back" : "戻る"}
              </button>
              <button
                className="btn-primary h-10 px-5 text-xs"
                disabled={pending || (step === 1 && !usagePeriod)}
                onClick={async () => {
                  if (step < 3) {
                    setStep((prev) => prev + 1);
                    return;
                  }
                  setPending(true);
                  try {
                    await fetchWithAuth("/api/billing/cancel-feedback", {
                      method: "POST",
                      body: JSON.stringify({
                        plan: selectedPlan,
                        usagePeriod,
                        reason
                      })
                    });
                    const portal = await fetchWithAuth("/api/billing/portal", {
                      method: "POST"
                    });
                    if (portal?.url) {
                      window.location.href = portal.url;
                    } else {
                      setNotice(
                        lang === "en"
                          ? "Billing portal is unavailable right now."
                          : "課金管理を開けませんでした。"
                      );
                    }
                  } finally {
                    setPending(false);
                    setShowSurvey(false);
                  }
                }}
              >
                {step === 3
                  ? lang === "en"
                    ? "Proceed to cancel"
                    : "解約ページへ進む"
                  : lang === "en"
                    ? "Next"
                    : "次へ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
