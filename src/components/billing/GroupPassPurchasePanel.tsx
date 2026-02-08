import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export default function GroupPassPurchasePanel({ groupId }: { groupId?: string }) {
  const [pending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lang = useLang();
  const copy = getCopy(lang);
  const paymentsDisabled = true;
  return (
    <div className="card p-4">
      <p className="font-semibold">{lang === "en" ? "Group pass" : "グループパス購入"}</p>
      <p className="mt-2 text-sm text-muted">
        {lang === "en"
          ? "A group pass purchased here applies to the current group."
          : "このページで購入したグループパスは、開いているグループに付与されます。"}
      </p>
      <button
        className="btn-outline mt-3 text-sm opacity-60"
        disabled
        onClick={async () => {
          setError(null);
          if (!paymentsDisabled || !groupId) return;
        }}
      >
        {copy.common.preparing}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
