"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { clientAuth } from "@/lib/firebase-client";
import { fetchWithAuth } from "@/lib/client-api";
import Alert from "@/components/common/Alert";
import { getCopy, getLocale } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

type ShareDetailsData = {
  group: {
    title: string;
    currency: string;
  };
  members: Array<{ userId: string; name: string | null }>;
  transfers: Array<{ fromName: string; toName: string; amount: number }>;
};

function formatAmount(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency
    }).format(amount);
  } catch {
    return `${amount}`;
  }
}

export default function ShareDetails({ token }: { token: string }) {
  const [status, setStatus] = useState<"loading" | "loggedOut" | "ready" | "error">(
    "loading"
  );
  const [data, setData] = useState<ShareDetailsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lang = useLang();
  const copy = getCopy(lang);
  const locale = getLocale(lang);

  useEffect(() => {
    const unsub = clientAuth.onAuthStateChanged(async (user) => {
      if (!user) {
        setStatus("loggedOut");
        return;
      }
      try {
        const res = await fetchWithAuth(`/api/share/${token}/details`);
        setData(res);
        setStatus("ready");
      } catch (err: any) {
        setError(err?.message ?? "REQUEST_FAILED");
        setStatus("error");
      }
    });

    return () => unsub();
  }, [token]);

  if (status === "loading") {
    return (
      <section className="rounded-2xl border border-[var(--stroke)] bg-white p-6">
        <div className="flex items-center gap-3 text-sm text-[var(--ink-muted)]">
          <Image src="/loading.gif" alt="" width={24} height={24} unoptimized />
          <span>{copy.share.checking}</span>
        </div>
      </section>
    );
  }

  if (status === "loggedOut") {
    return (
      <section className="rounded-2xl border border-[var(--stroke)] bg-white p-6">
        <h2 className="text-lg font-semibold">{copy.share.loginRequiredTitle}</h2>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          {copy.share.loginRequiredBody}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="btn-primary px-4 py-2 text-sm" href={`/login?next=/share/${token}`}>
            {copy.share.loginToView}
          </Link>
          <Link className="btn-outline px-4 py-2 text-sm" href={`/signup?next=/share/${token}`}>
            {copy.share.signup}
          </Link>
        </div>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="rounded-2xl border border-[var(--stroke)] bg-white p-6">
        <Alert message={error ?? copy.shareErrors.loadFailed} />
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="rounded-2xl border border-[var(--stroke)] bg-white p-6">
      <h2 className="text-lg font-semibold">{copy.share.detailsTitle}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {data.members.map((member) => (
          <span key={member.userId} className="rounded-full bg-[var(--bg-soft)] px-3 py-1 text-xs">
            {member.name ?? copy.share.memberFallback}
          </span>
        ))}
      </div>
      {data.transfers.length ? (
        <ul className="mt-4 space-y-2 text-sm text-[var(--ink)]">
          {data.transfers.map((transfer, index) => (
            <li key={index} className="flex items-center justify-between rounded-xl bg-[var(--bg-soft)] px-4 py-2">
              <span>
                {transfer.fromName} → {transfer.toName}
              </span>
              <span className="font-semibold">{formatAmount(transfer.amount, data.group.currency, locale)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[var(--ink-muted)]">{copy.share.noSettlement}</p>
      )}
    </section>
  );
}
