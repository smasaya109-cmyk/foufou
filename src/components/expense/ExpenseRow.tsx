"use client";

import { getCopy } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

export default function ExpenseRow({
  item,
  onClick
}: {
  item: {
    id: string;
    category: string;
    categoryEmoji?: string;
    memo?: string | null;
    amount: number;
    payer?: string;
    currency?: string;
  };
  onClick?: () => void;
}) {
  const lang = useLang();
  const copy = getCopy(lang);
  const emoji = item.categoryEmoji ?? "✦";
  const symbol =
    item.currency === "USD" ? "$" : item.currency === "EUR" ? "€" : item.currency === "JPY" ? "¥" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left soft-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl">
          {emoji}
        </div>
        <div>
          <p className="font-semibold">{item.category}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">
          {symbol}
          {item.amount.toLocaleString()}
        </p>
        <p className="text-xs text-muted">
          {lang === "en"
            ? `Paid by ${item.payer ?? "—"}`
            : `${item.payer ?? "—"} が支払い`}
        </p>
      </div>
    </button>
  );
}
