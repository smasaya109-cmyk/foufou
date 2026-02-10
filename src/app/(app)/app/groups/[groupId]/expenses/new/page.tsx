"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GroupHeader from "@/components/group/GroupHeader";
import ExpenseForm, { MemberOption } from "@/components/expense/ExpenseForm";
import { fetchWithAuth } from "@/lib/client-api";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export default function NewExpensePage({ params }: { params: { groupId: string } }) {
  const router = useRouter();
  const [groupName, setGroupName] = useState("—");
  const [premiumLabel, setPremiumLabel] = useState("Free");
  const [members, setMembers] = useState<MemberOption[]>([]);
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
  const [canUsePro, setCanUsePro] = useState(false);
  const [ownerId, setOwnerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const lang = useLang();
  const copy = getCopy(lang);

  const categories = [
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
    let mounted = true;
    fetchWithAuth(`/api/groups/${params.groupId}`)
      .then((data) => {
        if (!mounted) return;
        const group = data.group;
        setGroupName(group?.title ?? "—");
        setCurrency(group?.currency ?? "JPY");
        setPremiumLabel(data?.entitlements?.label ?? "Free");
        setOwnerId(group?.ownerUserId ?? "");
        setCanUsePro(Boolean(data?.entitlements?.canUsePremium));
        const memberOptions: MemberOption[] = (group?.members ?? []).map((m: any) => ({
          id: m.userId,
          label: m.name ?? m.userId
        }));
        setMembers(memberOptions);
        setSelectedMemberIds(memberOptions.map((m) => m.id));
        if (memberOptions.length && !payerUserId) {
          setPayerUserId(memberOptions[0].id);
        }
        if (memberOptions.length) {
          const baseRatio = Math.floor(100 / memberOptions.length);
          const nextRatios: Record<string, number> = {};
          memberOptions.forEach((m: any, index: number) => {
            nextRatios[m.id] =
              baseRatio + (index === 0 ? 100 - baseRatio * memberOptions.length : 0);
          });
          setRatioMap((prev) => (Object.keys(prev).length ? prev : nextRatios));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [params.groupId, payerUserId]);

  const splitPayload = useMemo(() => {
    const amountInt = Number(amount);
    const targets = members.filter((m) => selectedMemberIds.includes(m.id));
    if (!amountInt || !targets.length) return [];
    if (splitLabel === "ratio") {
      const totalRatio = targets.reduce((sum, m) => sum + (ratioMap[m.id] ?? 0), 0);
      if (!totalRatio) return [];
      const splits = targets.map((member) => ({
        userId: member.id,
        shareAmount: Math.floor((amountInt * (ratioMap[member.id] ?? 0)) / totalRatio)
      }));
      const remainder = amountInt - splits.reduce((sum, s) => sum + s.shareAmount, 0);
      if (splits.length) splits[0].shareAmount += remainder;
      return splits;
    }
    const base = Math.floor(amountInt / targets.length);
    const remainder = amountInt - base * targets.length;
    return targets.map((member, index) => ({
      userId: member.id,
      shareAmount: base + (index === 0 ? remainder : 0)
    }));
  }, [amount, members, selectedMemberIds, splitLabel, ratioMap]);

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

  async function onSubmit() {
    setError(null);
    setPending(true);
    try {
      const amountInt = Number(amount);
      if (!amountInt || amountInt <= 0) {
        setError(copy.expenses.amountError);
        return;
      }
      if (!payerUserId) {
        setError(copy.expenses.payerError);
        return;
      }

      const payload = {
        payerUserId,
        amount: amountInt,
        currency,
        date: date ? new Date(`${date}T00:00:00Z`).toISOString() : new Date().toISOString(),
        category,
        memo: title,
        splitType: splitLabel,
        splits: applyRounding(splitPayload, amountInt),
        splitMeta: {
          ratios: splitLabel === "ratio" ? ratioMap : undefined,
          subgroup: splitLabel === "subgroup" ? selectedMemberIds : undefined,
          rounding:
            roundingUnit === "none"
              ? undefined
              : { unit: roundingUnit, mode: roundingMode, target: roundingTarget }
        }
      };

      await fetchWithAuth(`/api/groups/${params.groupId}/expenses`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      router.push(`/app/groups/${params.groupId}?tab=expenses`);
    } catch (err: any) {
      setError(copy.expenses.saveFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <GroupHeader title={groupName} premiumLabel={premiumLabel} />

      <div className="card p-6">
        <h2 className="text-2xl font-semibold">{copy.expenses.add}</h2>
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
          setRatio={(id, value) => setRatioMap((prev) => ({ ...prev, [id]: value }))}
          roundingUnit={roundingUnit}
          setRoundingUnit={setRoundingUnit}
          roundingMode={roundingMode}
          setRoundingMode={setRoundingMode}
          roundingTarget={roundingTarget}
          setRoundingTarget={setRoundingTarget}
          category={category}
          setCategory={setCategory}
          categories={categories}
          members={members}
          selectedMemberIds={selectedMemberIds}
          toggleMember={(id) =>
            setSelectedMemberIds((prev) =>
              prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
            )
          }
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600">
          {error} {copy.common.supportSuffix}
        </p>
      ) : null}

      <div className="flex gap-3">
        <button
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-white"
          onClick={onSubmit}
          disabled={pending}
        >
          {pending ? copy.common.saving : copy.common.save}
        </button>
        <button className="rounded-full border border-[var(--stroke)] px-4 py-2" onClick={() => router.back()}>
          {copy.common.cancel}
        </button>
      </div>
    </div>
  );
}
