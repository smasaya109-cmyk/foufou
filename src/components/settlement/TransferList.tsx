"use client";

import { getCopy } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

export type TransferItem = { from: string; to: string; amount: number };

export default function TransferList({ items }: { items: TransferItem[] }) {
  const lang = useLang();
  const copy = getCopy(lang);
  return (
    <div className="card p-4">
      <p className="font-semibold">{copy.settlement.titleTransfers}</p>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm text-muted">
          {items.map((item, index) => (
            <li key={`${item.from}-${item.to}-${index}`}>
              {item.from} → {item.to} : {item.amount.toLocaleString()}
              {lang === "en" ? "¥" : "円"}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">{copy.settlement.noTransfers}</p>
      )}
    </div>
  );
}
