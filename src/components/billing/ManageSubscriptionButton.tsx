"use client";

import { useState } from "react";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";
import { fetchWithAuth } from "@/lib/client-api";

export default function ManageSubscriptionButton() {
  const lang = useLang();
  const copy = getCopy(lang);
  const [pending, setPending] = useState(false);
  return (
    <button
      className="rounded-full border border-[var(--stroke)] bg-white px-4 py-2 text-sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const data = await fetchWithAuth("/api/billing/portal", { method: "POST" });
          if (data?.url) {
            window.location.href = data.url;
          }
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? copy.common.processing : copy.common.manageBilling}
    </button>
  );
}
