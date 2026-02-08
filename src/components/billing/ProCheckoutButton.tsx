"use client";

import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export default function ProCheckoutButton() {
  const lang = useLang();
  const copy = getCopy(lang);
  return (
    <button
      className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-white opacity-60"
      disabled
    >
      {copy.common.preparing}
    </button>
  );
}
