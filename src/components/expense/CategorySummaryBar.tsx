"use client";

import { useLang } from "@/hooks/useLang";

export default function CategorySummaryBar() {
  const lang = useLang();
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">
        {lang === "en" ? "Summary" : "Summary"}
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <span className="pill bg-[var(--bg-veil)] text-neutral-700">
          {lang === "en" ? "Transport 24%" : "交通 24%"}
        </span>
        <span className="pill bg-[var(--bg-veil)] text-neutral-700">
          {lang === "en" ? "Stay 46%" : "宿泊 46%"}
        </span>
        <span className="pill bg-[var(--bg-veil)] text-neutral-700">
          {lang === "en" ? "Food 30%" : "食事 30%"}
        </span>
      </div>
    </div>
  );
}
