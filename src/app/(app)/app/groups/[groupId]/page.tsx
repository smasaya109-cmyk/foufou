"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Spinner from "@/components/common/Spinner";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import GroupHeader from "@/components/group/GroupHeader";
import GroupTabs from "@/components/group/GroupTabs";
import ExpenseList, { ExpenseItem } from "@/components/expense/ExpenseList";
import SettlementView from "@/components/settlement/SettlementView";
import InsightsDashboard from "@/components/insights/InsightsDashboard";
import PaywallBanner from "@/components/common/PaywallBanner";
import Alert from "@/components/common/Alert";
import ExpenseForm, { MemberOption, CategoryOption } from "@/components/expense/ExpenseForm";
import PhotoGallery from "@/components/photos/PhotoGallery";
import { fetchWithAuth } from "@/lib/client-api";
import { swrFetcher } from "@/lib/swr";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";
import { clientAuth } from "@/lib/firebase-client";

export default function GroupPage({
  params,
  searchParams
}: {
  params: { groupId: string };
  searchParams: { tab?: string };
}) {
  const clientParams = useSearchParams();
  const tab = clientParams.get("tab") ?? searchParams.tab ?? "expenses";
  const [groupName, setGroupName] = useState("—");
  const [groupIcon, setGroupIcon] = useState<string | null>(null);
  const [period, setPeriod] = useState<string | undefined>(undefined);
  const [settlement, setSettlement] = useState<any>(null);
  const [memberMap, setMemberMap] = useState<Record<string, string>>({});
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const lang = useLang();
  const copy = getCopy(lang);

  const [showAdd, setShowAdd] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [activeExpense, setActiveExpense] = useState<ExpenseItem | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("JPY");
  const [payerUserId, setPayerUserId] = useState("");
  const [date, setDate] = useState("");
  const [splitLabel, setSplitLabel] = useState("equal");
  const [category, setCategory] = useState("food");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [ratioMap, setRatioMap] = useState<Record<string, number>>({});
  const [roundingUnit, setRoundingUnit] = useState<"none" | "10" | "100">("none");
  const [roundingMode, setRoundingMode] = useState<"round" | "ceil" | "floor">("round");
  const [roundingTarget, setRoundingTarget] = useState<"payer" | "owner">("payer");
  const [ownerId, setOwnerId] = useState("");
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exportPending, setExportPending] = useState(false);

  const groupKey = `/api/groups/${params.groupId}?include=expenses`;
  const { data: groupData, mutate: mutateGroup } = useSWR(groupKey, swrFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
    dedupingInterval: 15000
  });

  useEffect(() => {
    if (!showAdd) {
      document.body.style.overflow = "";
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showAdd]);

  const categories: CategoryOption[] = [
    { key: "accommodation", label: lang === "en" ? "Accommodation" : "宿泊", emoji: "🛏️" },
    { key: "entertainment", label: lang === "en" ? "Entertainment" : "エンタメ", emoji: "🎤" },
    { key: "groceries", label: lang === "en" ? "Groceries" : "食材・買い物", emoji: "🛒" },
    { key: "healthcare", label: lang === "en" ? "Healthcare" : "医療", emoji: "🦷" },
    { key: "insurance", label: lang === "en" ? "Insurance" : "保険", emoji: "🧯" },
    { key: "rent", label: lang === "en" ? "Rent & Charges" : "宿代・チャージ", emoji: "🏠" },
    { key: "food", label: lang === "en" ? "Food & Drinks" : "飲食", emoji: "🍔" },
    { key: "shopping", label: lang === "en" ? "Shopping" : "ショッピング", emoji: "🛍️" },
    { key: "transport", label: lang === "en" ? "Transport" : "交通", emoji: "🚖" }
  ];

  useEffect(() => {
    const group = groupData?.group;
    if (!group) return;
    setGroupName(group.title ?? "—");
    setGroupIcon(group.icon ?? "🧳");
    setCurrency(group.currency ?? "JPY");
    setOwnerId(group.ownerUserId ?? "");
    if (group.startDate && group.endDate) {
      setPeriod(`${group.startDate} - ${group.endDate}`);
    } else {
      setPeriod(undefined);
    }
    const map: Record<string, string> = {};
    const options: MemberOption[] = [];
    (group.members ?? []).forEach((m: any) => {
      map[m.userId] = m.name ?? m.userId ?? "—";
      options.push({ id: m.userId, label: m.name ?? m.userId });
    });
    setMemberMap(map);
    setMemberOptions(options);
    setPayerUserId((prev) =>
      prev && options.some((m) => m.id === prev) ? prev : options[0]?.id ?? ""
    );
    setSelectedMemberIds((prev) => {
      const ids = options.map((m) => m.id);
      const kept = prev.filter((id) => ids.includes(id));
      return kept.length ? kept : ids;
    });
    setRatioMap((prev) => (Object.keys(prev).length ? prev : defaultRatios(options)));
  }, [groupData]);

  function defaultRatios(options: MemberOption[]) {
    const nextRatios: Record<string, number> = {};
    if (!options.length) return nextRatios;
    const baseRatio = Math.floor(100 / options.length);
    options.forEach((m, index) => {
      nextRatios[m.id] = baseRatio + (index === 0 ? 100 - baseRatio * options.length : 0);
    });
    return nextRatios;
  }

  // 3) Always start from a clean form so rounding/ratio/split settings never leak between expenses.
  function resetForm() {
    setActiveExpense(null);
    setTitle("");
    setAmount("");
    setDate("");
    setCategory("food");
    setSplitLabel("equal");
    setSelectedMemberIds(memberOptions.map((m) => m.id));
    setRatioMap(defaultRatios(memberOptions));
    setRoundingUnit("none");
    setRoundingMode("round");
    setRoundingTarget("payer");
    setSaveError(null);
  }

  function openAdd() {
    resetForm();
    setShowAdd(true);
  }

  // 4) Single source of truth for the split math (used for saving and for the live preview).
  //    "equal" always splits across every member; only select/ratio/subgroup use the checkboxes.
  function computeSplits(amountInt: number) {
    const targets =
      splitLabel === "equal"
        ? memberOptions
        : memberOptions.filter((m) => selectedMemberIds.includes(m.id));
    if (!targets.length) return null;
    let splits: Array<{ userId: string; shareAmount: number }> = [];
    if (splitLabel === "ratio") {
      const totalRatio = targets.reduce((sum, m) => sum + (ratioMap[m.id] ?? 0), 0);
      if (!totalRatio) return null;
      splits = targets.map((m) => ({
        userId: m.id,
        shareAmount: Math.floor((amountInt * (ratioMap[m.id] ?? 0)) / totalRatio)
      }));
      const remainder = amountInt - splits.reduce((sum, s) => sum + s.shareAmount, 0);
      splits[0].shareAmount += remainder;
    } else {
      const base = Math.floor(amountInt / targets.length);
      const remainder = amountInt - base * targets.length;
      splits = targets.map((m, index) => ({
        userId: m.id,
        shareAmount: base + (index === 0 ? remainder : 0)
      }));
    }
    return applyRounding(splits, amountInt);
  }

  const previewShares = (() => {
    const result: Record<string, number> = {};
    const amountInt = Math.round(Number(amount));
    if (!amountInt || amountInt <= 0) return result;
    (computeSplits(amountInt) ?? []).forEach((s) => {
      result[s.userId] = s.shareAmount;
    });
    return result;
  })();

  const entitlements = groupData?.entitlements;
  const premiumLabel = entitlements?.label ?? "Free";
  const canUsePro = Boolean(entitlements?.canUsePremium);
  const canUsePhotos = Boolean(entitlements?.canUsePhotos);

  const computeSettlement = useCallback(async () => {
    const data = await fetchWithAuth(`/api/groups/${params.groupId}/settlements/compute`, {
      method: "POST"
    });
    setSettlement({
      payloadJson: { balances: data.balances, transfers: data.transfers }
    });
  }, [params.groupId]);

  // Always recompute from the current expenses when the tab opens. The stored "latest"
  // settlement can be stale (e.g. computed before an expense was written), so it is only a fallback.
  const loadSettlementLatest = useCallback(async () => {
    try {
      await computeSettlement();
    } catch {
      const data = await fetchWithAuth(`/api/groups/${params.groupId}/settlements/latest`);
      if (data?.settlement) {
        setSettlement(data.settlement);
      }
    }
  }, [params.groupId, computeSettlement]);

  useEffect(() => {
    if (tab !== "settlement") return;
    if (settlement) return;
    loadSettlementLatest().catch(() => {});
  }, [tab, settlement, loadSettlementLatest]);

  const transferItems = useMemo(() => {
    const transfers = settlement?.payloadJson?.transfers ?? [];
    return transfers.map((t: any) => ({
      from: memberMap[t.fromUserId] ?? t.fromUserId,
      to: memberMap[t.toUserId] ?? t.toUserId,
      amount: t.amount
    }));
  }, [settlement, memberMap]);

  const netItems = useMemo(() => {
    const balances = settlement?.payloadJson?.balances ?? [];
    return balances.map((b: any) => ({
      name: memberMap[b.userId] ?? b.userId,
      paid: b.paid ?? 0,
      net: b.net ?? 0
    }));
  }, [settlement, memberMap]);

  const rawExpenses = useMemo(
    () => (groupData?.expenses ?? []) as any[],
    [groupData?.expenses]
  );
  const emojiMap = useMemo(
    () => ({
      accommodation: "🏨",
      entertainment: "🎤",
      groceries: "🛒",
      healthcare: "🦷",
      insurance: "🧯",
      rent: "🏠",
      food: "🍔",
      shopping: "🛍️",
      transport: "🚃",
      general: "✦"
    }),
    []
  );
  const labelMap = useMemo(
    () => ({
      accommodation: lang === "en" ? "Accommodation" : "宿泊",
      entertainment: lang === "en" ? "Entertainment" : "エンタメ",
      groceries: lang === "en" ? "Groceries" : "食材・買い物",
      healthcare: lang === "en" ? "Healthcare" : "医療",
      insurance: lang === "en" ? "Insurance" : "保険",
      rent: lang === "en" ? "Rent & Charges" : "宿代・チャージ",
      food: lang === "en" ? "Food & Drinks" : "飲食",
      shopping: lang === "en" ? "Shopping" : "ショッピング",
      transport: lang === "en" ? "Transport" : "交通",
      general: lang === "en" ? "General" : "一般"
    }),
    [lang]
  );

  const expenses = useMemo<ExpenseItem[]>(
    () =>
      rawExpenses.map((exp: any) => {
        const categoryKey = String(exp.category ?? "general") as keyof typeof labelMap;
        return {
          id: exp.id,
          category: labelMap[categoryKey] ?? exp.category ?? "-",
          categoryKey: exp.category,
          categoryEmoji: emojiMap[categoryKey] ?? "✦",
          memo: exp.memo,
          amount: exp.amount ?? 0,
          payer: memberMap[exp.payerUserId] ?? exp.payerUserId ?? "-",
          date: exp.date,
          payerUserId: exp.payerUserId,
          currency: exp.currency,
          splitType: exp.splitType,
          splits: exp.splits,
          splitMeta: exp.splitMeta
        };
      }),
    [rawExpenses, memberMap, labelMap, emojiMap]
  );

  async function downloadCsv() {
    setExportPending(true);
    try {
      const token = await clientAuth.currentUser?.getIdToken();
      if (!token) throw new Error("AUTH_REQUIRED");
      const res = await fetch(`/api/groups/${params.groupId}/exports/csv`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error("REQUEST_FAILED");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `foufou-expenses-${params.groupId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExportPending(false);
    }
  }

  async function duplicateExpense() {
    if (!activeExpense) return;
    setSavePending(true);
    try {
      await fetchWithAuth(`/api/expenses/${activeExpense.id}/duplicate`, { method: "POST" });
      await mutateGroup();
      setActionOpen(false);
      computeSettlement().catch(() => {});
    } finally {
      setSavePending(false);
    }
  }

  async function saveExpense() {
    setSaveError(null);
    setSavePending(true);
    try {
      const amountInt = Math.round(Number(amount));
      if (!amountInt || amountInt <= 0) {
        setSaveError(copy.expenses.amountError);
        return;
      }
      if (!payerUserId) {
        setSaveError(copy.expenses.payerError);
        return;
      }
      const splits = computeSplits(amountInt);
      if (!splits) {
        setSaveError(copy.expenses.splitTargetError);
        return;
      }
      const isoDate = date ? new Date(`${date}T00:00:00Z`).toISOString() : new Date().toISOString();
      const payload = {
        payerUserId,
        amount: amountInt,
        currency,
        date: isoDate,
        category,
        memo: title,
        splitType: splitLabel,
        splits,
        splitMeta: {
          ratios: splitLabel === "ratio" ? ratioMap : undefined,
          subgroup: splitLabel === "subgroup" ? splits.map((s) => s.userId) : undefined,
          rounding:
            roundingUnit === "none"
              ? undefined
              : { unit: roundingUnit, mode: roundingMode, target: roundingTarget }
        }
      };
      const optimisticExpense = {
        id: activeExpense?.id ?? `tmp_${Date.now()}`,
        ...payload
      };
      const optimisticData = activeExpense?.id
        ? { expenses: rawExpenses.map((exp) => (exp.id === activeExpense.id ? optimisticExpense : exp)) }
        : { expenses: [optimisticExpense, ...rawExpenses] };
      await mutateGroup(
        async (current: { expenses?: any[] } | undefined) => {
          const currentExpenses = current?.expenses ?? [];
          if (activeExpense?.id) {
            await fetchWithAuth(`/api/expenses/${activeExpense.id}`, {
              method: "PATCH",
              body: JSON.stringify(payload)
            });
            return {
              ...current,
              expenses: currentExpenses.map((exp: any) =>
                exp.id === activeExpense.id ? { ...payload, id: activeExpense.id } : exp
              )
            };
          }
          const res = await fetchWithAuth(`/api/groups/${params.groupId}/expenses`, {
            method: "POST",
            body: JSON.stringify(payload)
          });
          return {
            ...current,
            expenses: [{ ...payload, id: res.id }, ...currentExpenses]
          };
        },
        { optimisticData: { ...groupData, ...optimisticData }, rollbackOnError: true, populateCache: true, revalidate: false }
      );
      setShowAdd(false);
      resetForm();
      // Recompute from the persisted data (must run after the write, not concurrently with it).
      computeSettlement().catch(() => {});
    } catch (err: any) {
      setSaveError(err?.message ?? copy.expenses.saveFailed);
    } finally {
      setSavePending(false);
    }
  }

  async function deleteExpense() {
    if (!activeExpense?.id) return;
    setSaveError(null);
    setSavePending(true);
    try {
      const optimisticData = {
        expenses: rawExpenses.filter((exp: any) => exp.id !== activeExpense.id)
      };
      await mutateGroup(
        async (current: { expenses?: any[] } | undefined) => {
          const currentExpenses = current?.expenses ?? [];
          await fetchWithAuth(`/api/expenses/${activeExpense.id}`, { method: "DELETE" });
          return {
            ...current,
            expenses: currentExpenses.filter((exp: any) => exp.id !== activeExpense.id)
          };
        },
        { optimisticData: { ...groupData, ...optimisticData }, rollbackOnError: true, populateCache: true, revalidate: false }
      );
      setActionOpen(false);
      setActiveExpense(null);
      computeSettlement().catch(() => {});
    } catch (err: any) {
      setSaveError(err?.message ?? copy.expenses.deleteFailed);
    } finally {
      setSavePending(false);
    }
  }

  function openEdit(expense: ExpenseItem) {
    setActiveExpense(expense);
    setActionOpen(false);
    setShowAdd(true);
    setTitle(expense.memo ?? "");
    setAmount(String(expense.amount ?? ""));
    setCurrency(expense.currency ?? "JPY");
    setPayerUserId(expense.payerUserId ?? "");
    setCategory(expense.categoryKey ?? "food");
    setSplitLabel(expense.splitType ?? "equal");
    setSaveError(null);
    const ratios = (expense as any)?.splitMeta?.ratios as Record<string, number> | undefined;
    setRatioMap(ratios && Object.keys(ratios).length ? ratios : defaultRatios(memberOptions));
    const rounding = (expense as any)?.splitMeta?.rounding;
    setRoundingUnit(rounding?.unit ?? "none");
    setRoundingMode(rounding?.mode ?? "round");
    setRoundingTarget(rounding?.target ?? "payer");
    const expDate = expense.date ? new Date(expense.date) : null;
    if (expDate && !Number.isNaN(expDate.getTime())) {
      setDate(expDate.toISOString().slice(0, 10));
    } else {
      setDate("");
    }
    const ids = expense.splits?.map((s) => s.userId) ?? [];
    setSelectedMemberIds(ids.length ? ids : memberOptions.map((m) => m.id));
  }

  function applyRounding(
    splits: Array<{ userId: string; shareAmount: number }>,
    amountInt: number
  ) {
    if (roundingUnit === "none") return splits;
    const unit = Number(roundingUnit);
    if (!unit || unit <= 1) return splits;
    const roundFn =
      roundingMode === "ceil"
        ? Math.ceil
        : roundingMode === "floor"
          ? Math.floor
          : Math.round;
    const rounded = splits.map((s) => ({
      ...s,
      shareAmount: roundFn(s.shareAmount / unit) * unit
    }));
    const diff = amountInt - rounded.reduce((sum, s) => sum + s.shareAmount, 0);
    if (!diff) return rounded;
    const targetId = roundingTarget === "owner" && ownerId ? ownerId : payerUserId;
    const idx = rounded.findIndex((s) => s.userId === targetId);
    if (idx >= 0) {
      rounded[idx].shareAmount += diff;
      return rounded;
    }
    rounded[0].shareAmount += diff;
    return rounded;
  }

  return (
    <div className="space-y-8">
      <GroupHeader title={groupName} icon={groupIcon} period={period} premiumLabel={premiumLabel} />

      <GroupTabs groupId={params.groupId} active={tab} />

      {tab === "expenses" && (
        <div className="space-y-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted">{copy.expenses.listTitle}</div>
            <div className="flex items-center gap-2">
              {canUsePro ? (
                <button
                  className="btn-outline hidden items-center gap-2 md:flex"
                  onClick={downloadCsv}
                  disabled={exportPending}
                >
                  {exportPending ? copy.common.processing : copy.expenses.exportCsv}
                </button>
              ) : null}
              <button
                className="btn-primary hidden items-center gap-2 md:flex"
                onClick={openAdd}
              >
                <span className="text-lg leading-none">＋</span>
                {copy.expenses.add}
              </button>
            </div>
          </div>
          {!groupData ? (
            <div className="flex items-center gap-3 text-sm text-muted">
              <Spinner size={20} />
              <span>{copy.common.loading}</span>
            </div>
          ) : (
            <ExpenseList
              items={expenses}
              lang={lang}
              onSelect={(item) => {
                setActiveExpense(item);
                setActionOpen(true);
              }}
            />
          )}
          <button
            className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-2xl text-white shadow-lg md:hidden"
            onClick={openAdd}
            aria-label={copy.expenses.add}
          >
            ＋
          </button>
        </div>
      )}

      {tab === "settlement" && (
        <div className="space-y-7">
          <SettlementView transfers={transferItems} nets={netItems} />
        </div>
      )}

      {tab === "insights" && (
        <div className="space-y-5">
          {canUsePro ? (
            <InsightsDashboard expenses={expenses} currency={currency} lang={lang} />
          ) : (
            <PaywallBanner
              title={lang === "en" ? "Unlock with Pro" : "Pro以上で解放"}
              description={
                lang === "en"
                  ? "Insights are available on Pro/Premium."
                  : "分析タブはPro / Premiumで利用できます。"
              }
            />
          )}
        </div>
      )}

      {tab === "photos" && (
        <div className="space-y-5">
          {canUsePhotos ? (
            <PhotoGallery groupId={params.groupId} />
          ) : (
            <PaywallBanner
              title={lang === "en" ? "Unlock with Premium" : "Premiumで解放"}
              description={
                lang === "en"
                  ? "Photo sharing is available on Premium."
                  : "写真共有はPremiumで利用できます。"
              }
            />
          )}
        </div>
      )}

      {showAdd ? (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div className="fixed inset-0 flex items-start justify-center px-4 pb-24 pt-6 md:items-center md:pb-10">
            <div className="w-full max-w-2xl">
              <div className="card max-h-[85vh] w-full overflow-y-auto overflow-x-hidden rounded-3xl bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {activeExpense ? copy.expenses.edit : copy.expenses.add}
                  </h2>
                  <button className="text-sm text-muted" onClick={() => setShowAdd(false)}>
                    {copy.common.close}
                  </button>
                </div>
                <div className="mt-4">
                  <ExpenseForm
                    title={title}
                    setTitle={setTitle}
                    amount={amount}
                    setAmount={setAmount}
                    currency={currency}
                    setCurrency={setCurrency}
                    payerUserId={payerUserId}
                    setPayerUserId={setPayerUserId}
                    date={date}
                    setDate={setDate}
                    splitLabel={splitLabel}
                    setSplitLabel={setSplitLabel}
                    canUsePro={canUsePro}
                    ratioMap={ratioMap}
                    setRatio={(id, value) =>
                      setRatioMap((prev) => ({ ...prev, [id]: value }))
                    }
                    roundingUnit={roundingUnit}
                    setRoundingUnit={setRoundingUnit}
                    roundingMode={roundingMode}
                    setRoundingMode={setRoundingMode}
                    roundingTarget={roundingTarget}
                    setRoundingTarget={setRoundingTarget}
                    category={category}
                    setCategory={setCategory}
                    categories={categories}
                    members={memberOptions}
                    previewShares={previewShares}
                    selectedMemberIds={selectedMemberIds}
                    toggleMember={(id) =>
                      setSelectedMemberIds((prev) =>
                        prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
                      )
                    }
                  />
                </div>
                {saveError ? <div className="mt-3"><Alert message={saveError} /></div> : null}
                <div className="mt-5 flex gap-3">
                  <button
                    className="btn-primary"
                    onClick={saveExpense}
                    disabled={savePending}
                  >
                    {savePending ? copy.common.saving : copy.common.save}
                  </button>
                  <button
                    className="btn-outline"
                    onClick={() => setShowAdd(false)}
                  >
                    {copy.common.cancel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {actionOpen && activeExpense ? (
        <div className="fixed inset-0 z-50 bg-black/30">
          <div className="fixed inset-0 flex items-end justify-center px-4 pb-10 md:items-center">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
              <button
                className="flex w-full items-center justify-between border-b border-[var(--stroke)] px-5 py-4 text-left"
                onClick={() => openEdit(activeExpense)}
              >
                <span>{copy.common.edit}</span>
                <span>✎</span>
              </button>
              {canUsePro ? (
                <button
                  className="flex w-full items-center justify-between border-b border-[var(--stroke)] px-5 py-4 text-left"
                  onClick={duplicateExpense}
                  disabled={savePending}
                >
                  <span>{copy.expenses.duplicate}</span>
                  <span>⧉</span>
                </button>
              ) : null}
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left text-red-600"
                onClick={deleteExpense}
                disabled={savePending}
              >
                <span>{copy.common.delete}</span>
                <span>🗑</span>
              </button>
              <button
                className="w-full border-t border-[var(--stroke)] px-5 py-4 text-sm text-muted"
                onClick={() => setActionOpen(false)}
              >
                {copy.common.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
