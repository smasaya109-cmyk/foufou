"use client";

import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export default function ManageSubscriptionButton() {
  const lang = useLang();
  const copy = getCopy(lang);
  return (
    <button
      className="rounded-full border border-[var(--stroke)] bg-white px-4 py-2 text-sm opacity-60"
      disabled
    >
      {copy.common.preparing}
    </button>
  );
}
