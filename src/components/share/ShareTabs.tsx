"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { getCopy, getLocale } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

export type ShareExpense = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  date: string;
  payerName: string;
};

export type ShareTransfer = {
  fromName: string;
  toName: string;
  amount: number;
  currency: string;
};

export type SharePhoto = {
  id: string;
  url: string;
  name: string;
};

function formatAmount(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount}`;
  }
}

export default function ShareTabs({
  expenses,
  transfers,
  photos = []
}: {
  expenses: ShareExpense[];
  transfers: ShareTransfer[];
  photos?: SharePhoto[];
}) {
  const [tab, setTab] = useState<"expenses" | "settlement" | "photos">("expenses");
  const lang = useLang();
  const copy = getCopy(lang);
  const locale = getLocale(lang);

  const grouped = useMemo(() => {
    const map = new Map<string, ShareExpense[]>();
    expenses.forEach((expense) => {
      const label = expense.date
        ? new Date(expense.date).toLocaleDateString(locale)
        : copy.common.noDate;
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(expense);
    });
    return Array.from(map.entries());
  }, [expenses, locale, copy.common.noDate]);

  return (
    <section className="card p-5">
      <div className="flex flex-wrap gap-2">
        <button
          className={
            tab === "expenses"
              ? "btn-primary text-xs"
              : "btn-outline text-xs"
          }
          onClick={() => setTab("expenses")}
        >
          {copy.share.expensesTab}
        </button>
        <button
          className={
            tab === "settlement"
              ? "btn-primary text-xs"
              : "btn-outline text-xs"
          }
          onClick={() => setTab("settlement")}
        >
          {copy.share.settlementTab}
        </button>
        {photos.length ? (
          <button
            className={
              tab === "photos"
                ? "btn-primary text-xs"
                : "btn-outline text-xs"
            }
            onClick={() => setTab("photos")}
          >
            {copy.share.photosTab}
          </button>
        ) : null}
      </div>

      {tab === "expenses" ? (
        <div className="mt-4 space-y-4">
          {grouped.length ? (
            grouped.map(([label, items]) => (
              <div key={label} className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
                {items.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold">{expense.title}</p>
                      <p className="text-xs text-muted">
                        {expense.payerName} {copy.share.paidBy}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatAmount(expense.amount, expense.currency, locale)}
                    </p>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">{copy.share.noExpenses}</p>
          )}
        </div>
      ) : tab === "settlement" ? (
        <div className="mt-4 space-y-2">
          {transfers.length ? (
            transfers.map((transfer, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3"
              >
                <p className="text-sm">
                  {transfer.fromName} → {transfer.toName}
                </p>
                <p className="text-sm font-semibold">
                  {formatAmount(transfer.amount, transfer.currency, locale)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">{copy.share.noSettlementShort}</p>
          )}
          <p className="text-xs text-muted">
            {copy.share.loginToEdit}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {photos.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-2xl border border-[var(--stroke)] bg-white">
                  <Image
                    src={photo.url}
                    alt={photo.name || "photo"}
                    width={640}
                    height={360}
                    className="h-40 w-full object-cover"
                    unoptimized
                  />
                  <div className="flex items-center justify-between px-3 py-2 text-xs text-muted">
                    <span>{photo.name || (lang === "en" ? "Photo" : "写真")}</span>
                    <a
                      href={photo.url}
                      download
                      className="rounded-full border border-[var(--stroke)] px-2 py-1 text-[11px]"
                    >
                      {lang === "en" ? "Download" : "ダウンロード"}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">{copy.share.noPhotos}</p>
          )}
        </div>
      )}
    </section>
  );
}
