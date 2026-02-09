import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";
import { fetchWithAuth } from "@/lib/client-api";

export default function GroupPassPurchasePanel({ groupId }: { groupId?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lang = useLang();
  const copy = getCopy(lang);
  const paymentsDisabled = false;
  return (
    <div className="card p-4">
      <p className="font-semibold">{lang === "en" ? "Group pass" : "グループパス購入"}</p>
      <p className="mt-2 text-sm text-muted">
        {lang === "en"
          ? "A group pass purchased here applies to the current group."
          : "このページで購入したグループパスは、開いているグループに付与されます。"}
      </p>
      <button
        className="btn-outline mt-3 text-sm"
        disabled={pending || paymentsDisabled || !groupId}
        onClick={async () => {
          setError(null);
          if (paymentsDisabled || !groupId) return;
          setPending(true);
          try {
            const data = await fetchWithAuth("/api/billing/group-pass/checkout", {
              method: "POST",
              body: JSON.stringify({ groupId })
            });
            if (data?.url) {
              window.location.href = data.url;
            }
          } catch (err: any) {
            setError(err?.message ?? copy.common.errorGeneric);
          } finally {
            setPending(false);
          }
        }}
      >
        {pending
          ? copy.common.processing
          : lang === "en"
            ? "Buy group pass"
            : "グループパスを購入"}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
