"use client";

import Link from "next/link";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export default function ProCheckoutButton() {
  const lang = useLang();
  const copy = getCopy(lang);
  return (
    <Link
      href="/app/subscription"
      className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-white"
    >
      {copy.billing.startPro}
    </Link>
  );
}
