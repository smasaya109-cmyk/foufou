"use client";

import { useState } from "react";
import { getCopy } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

export type MemberOption = { id: string; label: string };
export type CategoryOption = { key: string; label: string; emoji: string };

export default function ExpenseForm({
  title,
  setTitle,
  amount,
  setAmount,
  currency,
  setCurrency,
  payerUserId,
  setPayerUserId,
  date,
  setDate,
  splitLabel,
  setSplitLabel,
  canUsePro,
  ratioMap,
  setRatio,
  roundingUnit,
  setRoundingUnit,
  roundingMode,
  setRoundingMode,
  roundingTarget,
  setRoundingTarget,
  category,
  setCategory,
  categories,
  members,
  selectedMemberIds,
  toggleMember
}: {
  title: string;
  setTitle: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  payerUserId: string;
  setPayerUserId: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  splitLabel: string;
  setSplitLabel: (value: string) => void;
  canUsePro: boolean;
  ratioMap: Record<string, number>;
  setRatio: (id: string, value: number) => void;
  roundingUnit: "none" | "10" | "100";
  setRoundingUnit: (value: "none" | "10" | "100") => void;
  roundingMode: "round" | "ceil" | "floor";
  setRoundingMode: (value: "round" | "ceil" | "floor") => void;
  roundingTarget: "payer" | "owner";
  setRoundingTarget: (value: "payer" | "owner") => void;
  category: string;
  setCategory: (value: string) => void;
  categories: CategoryOption[];
  members: MemberOption[];
  selectedMemberIds: string[];
  toggleMember: (id: string) => void;
}) {
  const lang = useLang();
  const copy = getCopy(lang);
  const selectedCategory = categories.find((c) => c.key === category) ?? categories[0];
  const [categoryOpen, setCategoryOpen] = useState(false);
  const currencyLabel = currency === "JPY" ? "¥" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold">{copy.expenses.title}</label>
        <div className="flex items-center gap-3">
          <input
            className="input-soft flex-1"
            placeholder={copy.expenses.titlePlaceholder}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className="relative">
            <button
              type="button"
              className="flex h-12 items-center justify-center rounded-xl border border-[var(--stroke)] bg-white px-4 text-lg"
              onClick={() => setCategoryOpen((prev) => !prev)}
              aria-label={copy.expenses.categorySelect}
            >
              {selectedCategory.emoji}
            </button>
            {categoryOpen ? (
              <div className="absolute right-0 top-14 z-20 w-56 overflow-hidden rounded-2xl border border-[var(--stroke)] bg-white shadow-xl">
                {categories.map((option) => (
                  <button
                    type="button"
                    key={option.key}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-[var(--bg-soft)]"
                    onClick={() => {
                      setCategory(option.key);
                      setCategoryOpen(false);
                    }}
                  >
                    <span className="text-lg">{option.emoji}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">{copy.expenses.amount}</label>
        <div className="flex items-center gap-3">
            <input
              className="input-soft flex-1 text-lg"
              placeholder="0"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          <div className="flex h-12 w-20 items-center justify-center rounded-xl border border-[var(--stroke)] bg-white">
            {currency === "JPY" ? "¥" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold">{copy.expenses.payer}</label>
          <select
            className="input-soft w-full"
            value={payerUserId}
            onChange={(event) => setPayerUserId(event.target.value)}
          >
            <option value="">{copy.expenses.payerSelect}</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">{copy.expenses.date}</label>
          <input
            className="input-soft w-full"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">{copy.expenses.split}</label>
          <select
            className="rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm"
            value={splitLabel}
            onChange={(event) => setSplitLabel(event.target.value)}
          >
            <option value="equal">{copy.expenses.splitEqual}</option>
            <option value="select">{copy.expenses.splitSelect}</option>
            {canUsePro ? (
              <>
                <option value="ratio">{copy.expenses.splitRatio}</option>
                <option value="subgroup">{copy.expenses.splitSubgroup}</option>
              </>
            ) : null}
          </select>
        </div>
        <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--bg-soft)] p-3">
          {members.map((member) => {
            const checked = selectedMemberIds.includes(member.id);
            return (
              <label
                key={member.id}
                className="flex items-center justify-between border-b border-[var(--stroke)] py-3 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleMember(member.id)}
                    className="h-5 w-5 accent-[var(--accent)]"
                  />
                  <span>{member.label}</span>
                </div>
                {splitLabel === "ratio" ? (
                  <input
                    type="number"
                    min={0}
                    className="w-20 rounded-lg border border-[var(--stroke)] bg-white px-2 py-1 text-xs"
                    value={ratioMap[member.id] ?? 0}
                    onChange={(event) => setRatio(member.id, Number(event.target.value))}
                  />
                ) : (
                  <span className="text-sm text-muted">0 {currencyLabel}</span>
                )}
              </label>
            );
          })}
        </div>
        {canUsePro ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs text-muted">{copy.expenses.roundingUnit}</label>
              <select
                className="rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm"
                value={roundingUnit}
                onChange={(event) => setRoundingUnit(event.target.value as "none" | "10" | "100")}
              >
                <option value="none">{copy.expenses.roundingNone}</option>
                <option value="10">{copy.expenses.rounding10}</option>
                <option value="100">{copy.expenses.rounding100}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted">{copy.expenses.roundingMode}</label>
              <select
                className="rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm"
                value={roundingMode}
                onChange={(event) => setRoundingMode(event.target.value as "round" | "ceil" | "floor")}
              >
                <option value="round">{copy.expenses.roundingRound}</option>
                <option value="ceil">{copy.expenses.roundingUp}</option>
                <option value="floor">{copy.expenses.roundingDown}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted">{copy.expenses.roundingTarget}</label>
              <select
                className="rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm"
                value={roundingTarget}
                onChange={(event) => setRoundingTarget(event.target.value as "payer" | "owner")}
              >
                <option value="payer">{copy.expenses.roundingPayer}</option>
                <option value="owner">{copy.expenses.roundingOwner}</option>
              </select>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
