import ExpenseRow from "@/components/expense/ExpenseRow";

export type ExpenseItem = {
  id: string;
  category: string;
  categoryKey?: string;
  categoryEmoji?: string;
  memo?: string | null;
  amount: number;
  payer?: string;
  date?: string | null;
  payerUserId?: string;
  currency?: string;
  splitType?: string;
  splits?: Array<{ userId: string; shareAmount: number }>;
  splitMeta?: {
    ratios?: Record<string, number>;
    subgroup?: string[];
    rounding?: { unit?: string; mode?: string; target?: string };
  };
};

import { getCopy, getLocale, type Lang } from "@/lib/i18n";

export default function ExpenseList({
  items,
  onSelect,
  lang = "ja"
}: {
  items: ExpenseItem[];
  onSelect?: (item: ExpenseItem) => void;
  lang?: Lang;
}) {
  const copy = getCopy(lang);
  if (!items.length) {
    return <p className="text-sm text-muted">{copy.common.noExpenses}</p>;
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  function dateKey(dateValue?: string | null) {
    if (!dateValue) return "no-date";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "no-date";
    return `${parsed.getFullYear()}-${parsed.getMonth() + 1}-${parsed.getDate()}`;
  }

  function dateLabel(dateValue?: string | null) {
    if (!dateValue) return copy.common.noDate;
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return copy.common.noDate;
    const key = dateKey(dateValue);
    if (key === todayKey) return copy.common.today;
    return parsed.toLocaleDateString(getLocale(lang), {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  return (
    <div className="space-y-6">
      {items.map((item, index) => {
        const currentKey = dateKey(item.date);
        const prevKey = index > 0 ? dateKey(items[index - 1]?.date) : null;
        const showHeader = index === 0 || currentKey !== prevKey;
        return (
          <div key={item.id} className="space-y-3">
            {showHeader ? (
              <p className="text-sm font-semibold text-[#222222]">{dateLabel(item.date)}</p>
            ) : null}
            <ExpenseRow item={item} onClick={onSelect ? () => onSelect(item) : undefined} />
          </div>
        );
      })}
    </div>
  );
}
