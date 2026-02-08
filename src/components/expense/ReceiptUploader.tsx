"use client";

import { useLang } from "@/hooks/useLang";

export default function ReceiptUploader() {
  const lang = useLang();
  return (
    <div className="rounded-2xl border border-dashed border-[var(--stroke)] bg-white p-4">
      <p className="font-semibold">{lang === "en" ? "Receipt (Pro)" : "レシート（Pro/パス）"}</p>
      <p className="text-sm text-muted">
        {lang === "en" ? "Upload image → OCR" : "画像アップロード → OCR"}
      </p>
    </div>
  );
}
