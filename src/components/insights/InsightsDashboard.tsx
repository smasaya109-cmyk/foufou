"use client";

import { useMemo, useState } from "react";
import type { ExpenseItem } from "@/components/expense/ExpenseList";
import { getLocale, type Lang } from "@/lib/i18n";

type CategoryRow = {
  key: string;
  label: string;
  emoji: string;
  amount: number;
  ratio: number;
};

type DailyRow = {
  key: string;
  label: string;
  amount: number;
};

type PieStopState = {
  stops: string[];
  acc: number;
};

type PieLabel = {
  key: string;
  label: string;
  emoji: string;
  ratio: number;
  angle: number;
  color: string;
};

function formatAmount(lang: Lang, currency: string, value: number) {
  const locale = getLocale(lang);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "JPY" ? 0 : 2
    }).format(value);
  } catch {
    return `${value.toLocaleString(locale)} ${currency}`;
  }
}

export default function InsightsDashboard({
  expenses,
  currency,
  lang
}: {
  expenses: ExpenseItem[];
  currency: string;
  lang: Lang;
}) {
  const [range, setRange] = useState<"all" | "7" | "30">("all");
  const filteredExpenses = useMemo(() => {
    if (range === "all") return expenses;
    const days = range === "7" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (days - 1));
    return expenses.filter((exp) => {
      if (!exp.date) return false;
      const dateValue = new Date(exp.date);
      if (Number.isNaN(dateValue.getTime())) return false;
      return dateValue >= cutoff;
    });
  }, [expenses, range]);
  const [categoryView, setCategoryView] = useState<"bar" | "pie">("bar");
  const total = useMemo(
    () => filteredExpenses.reduce((sum, exp) => sum + (exp.amount ?? 0), 0),
    [filteredExpenses]
  );

  const categoryRows = useMemo<CategoryRow[]>(() => {
    if (!total) return [];
    const map = new Map<string, CategoryRow>();
    filteredExpenses.forEach((exp) => {
      const key = exp.categoryKey ?? exp.category ?? "general";
      const label = exp.category ?? (lang === "en" ? "General" : "一般");
      const emoji = exp.categoryEmoji ?? "✦";
      const row = map.get(key) ?? { key, label, emoji, amount: 0, ratio: 0 };
      row.amount += exp.amount ?? 0;
      map.set(key, row);
    });
    const rows = Array.from(map.values()).map((row) => ({
      ...row,
      ratio: row.amount / total
    }));
    rows.sort((a, b) => b.amount - a.amount);
    return rows;
  }, [filteredExpenses, lang, total]);

  const dailyRows = useMemo<DailyRow[]>(() => {
    const map = new Map<string, DailyRow>();
    filteredExpenses.forEach((exp) => {
      const dateValue = exp.date ? new Date(exp.date) : null;
      const key =
        dateValue && !Number.isNaN(dateValue.getTime())
          ? dateValue.toISOString().slice(0, 10)
          : "no-date";
      const label =
        key === "no-date"
          ? lang === "en"
            ? "No date"
            : "日付未設定"
          : dateValue!.toLocaleDateString(getLocale(lang), {
              year: "numeric",
              month: "short",
              day: "numeric"
            });
      const row = map.get(key) ?? { key, label, amount: 0 };
      row.amount += exp.amount ?? 0;
      map.set(key, row);
    });
    const rows = Array.from(map.values());
    rows.sort((a, b) => (a.key < b.key ? 1 : -1));
    return rows;
  }, [filteredExpenses, lang]);

  const payerRows = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach((exp) => {
      const key = exp.payer ?? (lang === "en" ? "Unknown" : "不明");
      map.set(key, (map.get(key) ?? 0) + (exp.amount ?? 0));
    });
    const rows = Array.from(map.entries()).map(([name, amount]) => ({ name, amount }));
    rows.sort((a, b) => b.amount - a.amount);
    return rows;
  }, [filteredExpenses, lang]);
  const maxPayer = payerRows[0]?.amount ?? 1;

  const maxCategory = categoryRows[0]?.amount ?? 1;
  const maxDaily = dailyRows[0]?.amount ?? 1;
  const palette = [
    "#5DB3E6",
    "#7EC6EE",
    "#A2D8F5",
    "#F6C177",
    "#F4A261",
    "#E76F51",
    "#A3D9A5",
    "#84C5A4"
  ];
  const pieStops: PieStopState = categoryRows.reduce(
    (state, row, index) => {
      const nextAcc = state.acc + row.ratio * 100;
      const color = palette[index % palette.length];
      state.stops.push(`${color} ${state.acc.toFixed(2)}% ${nextAcc.toFixed(2)}%`);
      state.acc = nextAcc;
      return state;
    },
    { stops: [] as string[], acc: 0 }
  );
  const pieLabels: PieLabel[] = categoryRows.reduce((rows: PieLabel[], row, index) => {
    const prev = rows[rows.length - 1];
    const start = prev ? prev.angle + prev.ratio * 360 : 0;
    const mid = start + row.ratio * 180;
    rows.push({
      key: row.key,
      label: row.label,
      emoji: row.emoji,
      ratio: row.ratio,
      angle: mid,
      color: palette[index % palette.length]
    });
    return rows;
  }, []);

  const pieLayout = useMemo(() => {
    const size = 288;
    const center = size / 2;
    const labelRadius = 140;
    const minGap = 22;
    const leftX = 36;
    const rightX = 252;
    const bottom = size - 16;
    const top = 16;

    const items = pieLabels.map((row) => {
      const radians = (row.angle * Math.PI) / 180;
      const side = Math.cos(radians) >= 0 ? "right" : "left";
      const y = center + labelRadius * Math.sin(radians);
      return { ...row, radians, side, y };
    });

    function distribute(list: typeof items) {
      const sorted = [...list].sort((a, b) => a.y - b.y);
      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i].y - sorted[i - 1].y < minGap) {
          sorted[i].y = sorted[i - 1].y + minGap;
        }
      }
      for (let i = sorted.length - 2; i >= 0; i -= 1) {
        if (sorted[i + 1].y > bottom) {
          sorted[i + 1].y = bottom;
        }
        if (sorted[i].y > sorted[i + 1].y - minGap) {
          sorted[i].y = sorted[i + 1].y - minGap;
        }
      }
      sorted.forEach((item) => {
        item.y = Math.max(top, Math.min(bottom, item.y));
      });
      return sorted;
    }

    const left = distribute(items.filter((i) => i.side === "left"));
    const right = distribute(items.filter((i) => i.side === "right"));

    return [...left, ...right].map((item) => {
      const x = item.side === "left" ? leftX : rightX;
      const align = item.side === "left" ? "right" : "left";
      return { ...item, x, align };
    });
  }, [pieLabels]);
  const pieGradient = pieStops.stops.length
    ? `conic-gradient(${pieStops.stops.join(", ")})`
    : "conic-gradient(#E8EEF5 0% 100%)";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {lang === "en" ? "Insights" : "分析"}
          </p>
          <h2 className="text-2xl font-semibold text-[var(--ink-strong)]">
            {lang === "en" ? "Overview" : "概要"}
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[var(--stroke)] bg-white p-1 text-xs">
          <button
            type="button"
            className={`rounded-full px-3 py-1 ${
              range === "all" ? "bg-[var(--accent)] text-white" : "text-muted"
            }`}
            onClick={() => setRange("all")}
          >
            {lang === "en" ? "All" : "全期間"}
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 ${
              range === "7" ? "bg-[var(--accent)] text-white" : "text-muted"
            }`}
            onClick={() => setRange("7")}
          >
            {lang === "en" ? "7 days" : "7日"}
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1 ${
              range === "30" ? "bg-[var(--accent)] text-white" : "text-muted"
            }`}
            onClick={() => setRange("30")}
          >
            {lang === "en" ? "30 days" : "30日"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {lang === "en" ? "Total" : "合計"}
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--ink-strong)]">
            {formatAmount(lang, currency, total)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {lang === "en" ? "Entries" : "支払い件数"}
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--ink-strong)]">
            {expenses.length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {lang === "en" ? "Avg / entry" : "1件あたり"}
          </p>
          <p className="mt-2 text-2xl font-semibold text-[var(--ink-strong)]">
            {formatAmount(lang, currency, expenses.length ? Math.round(total / expenses.length) : 0)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{lang === "en" ? "By category" : "カテゴリ別"}</p>
              <p className="text-xs text-muted">
                {lang === "en" ? "Share of total" : "合計に対する割合"}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[var(--stroke)] bg-white p-1 text-xs">
              <button
                type="button"
                className={`rounded-full px-3 py-1 ${
                  categoryView === "bar" ? "bg-[var(--accent)] text-white" : "text-muted"
                }`}
                onClick={() => setCategoryView("bar")}
              >
                {lang === "en" ? "Bars" : "バー"}
              </button>
              <button
                type="button"
                className={`rounded-full px-3 py-1 ${
                  categoryView === "pie" ? "bg-[var(--accent)] text-white" : "text-muted"
                }`}
                onClick={() => setCategoryView("pie")}
              >
                {lang === "en" ? "Pie" : "円"}
              </button>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {categoryRows.length ? (
              categoryView === "bar" ? (
                categoryRows.map((row) => (
                  <div key={row.key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{row.emoji}</span>
                        <span className="font-medium">{row.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">
                          {Math.round(row.ratio * 100)}%
                        </span>
                        <span className="text-sm font-semibold">
                          {formatAmount(lang, currency, row.amount)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--bg-soft)]">
                      <div
                        className="h-2 rounded-full bg-[var(--accent)]"
                        style={{ width: `${Math.max(6, (row.amount / maxCategory) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center">
                    <div
                      className="h-48 w-48 rounded-full border border-[var(--stroke)] bg-white"
                      style={{ backgroundImage: pieGradient }}
                    />
                  </div>
                  <div className="space-y-3">
                    {categoryRows.map((row, index) => (
                      <div key={row.key} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: palette[index % palette.length] }}
                          />
                          <span className="text-sm">{row.emoji}</span>
                          <span className="font-medium">{row.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted">
                            {Math.round(row.ratio * 100)}%
                          </span>
                          <span className="text-sm font-semibold">
                            {formatAmount(lang, currency, row.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <p className="text-sm text-muted">{lang === "en" ? "No data yet." : "まだデータがありません。"}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{lang === "en" ? "Daily totals" : "日別合計"}</p>
              <p className="text-xs text-muted">{lang === "en" ? "Latest first" : "新しい日付順"}</p>
            </div>
            <div className="mt-4 space-y-3">
              {dailyRows.length ? (
                dailyRows.map((row) => (
                  <div key={row.key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">{row.label}</span>
                      <span className="font-semibold">
                        {formatAmount(lang, currency, row.amount)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--bg-soft)]">
                      <div
                        className="h-2 rounded-full bg-[var(--accent)]"
                        style={{ width: `${Math.max(6, (row.amount / maxDaily) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">{lang === "en" ? "No data yet." : "まだデータがありません。"}</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{lang === "en" ? "By payer" : "支払者別"}</p>
              <p className="text-xs text-muted">{lang === "en" ? "Total paid" : "立替合計"}</p>
            </div>
            <div className="mt-4 space-y-3">
              {payerRows.length ? (
                payerRows.map((row) => (
                  <div key={row.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">{row.name}</span>
                      <span className="font-semibold">
                        {formatAmount(lang, currency, row.amount)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--bg-soft)]">
                      <div
                        className="h-2 rounded-full bg-[var(--accent)]"
                        style={{ width: `${Math.max(6, (row.amount / maxPayer) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">{lang === "en" ? "No data yet." : "まだデータがありません。"}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
