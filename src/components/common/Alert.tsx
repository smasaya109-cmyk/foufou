"use client";

import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export default function Alert({
  type = "error",
  message
}: {
  type?: "error" | "success" | "info";
  message: string;
}) {
  const lang = useLang();
  const copy = getCopy(lang);
  const supportSuffix = copy.common.supportSuffix;
  const finalMessage =
    type === "error" && supportSuffix && !message.includes(supportSuffix)
      ? `${message} ${supportSuffix}`
      : message;
  const styles =
    type === "success"
      ? "border-2 border-emerald-200 bg-emerald-50 text-emerald-700"
      : type === "info"
        ? "border-2 border-[var(--stroke)] bg-[var(--bg-soft)] text-[var(--ink-muted)]"
        : "border-2 border-red-200 bg-red-50 text-red-700";

  return (
    <div className={`rounded-2xl px-4 py-2 text-sm ${styles}`}>
      {finalMessage}
    </div>
  );
}
