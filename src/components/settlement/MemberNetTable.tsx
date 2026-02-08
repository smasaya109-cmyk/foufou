"use client";

import { getCopy } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

export type NetItem = { name: string; paid: number; net: number };

export default function MemberNetTable({ items }: { items: NetItem[] }) {
  const lang = useLang();
  const copy = getCopy(lang);
  return (
    <div className="card p-4">
      <p className="font-semibold">{copy.settlement.titleMembers}</p>
      <div className="mt-3 grid grid-cols-3 text-xs text-muted">
        <span>{copy.settlement.member}</span>
        <span>{copy.settlement.paid}</span>
        <span>{copy.settlement.net}</span>
      </div>
      {items.length ? (
        items.map((item) => (
          <div key={item.name} className="mt-2 grid grid-cols-3 text-sm">
            <span>{item.name}</span>
            <span>{item.paid.toLocaleString()}</span>
            <span className={item.net >= 0 ? "text-[var(--positive)]" : "text-red-500"}>
              {item.net >= 0 ? "+" : ""}
              {item.net.toLocaleString()}
            </span>
          </div>
        ))
      ) : (
        <p className="mt-3 text-sm text-muted">{copy.settlement.noData}</p>
      )}
    </div>
  );
}
