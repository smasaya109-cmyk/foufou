"use client";

import { useLang } from "@/hooks/useLang";

export default function OcrSuggestionPanel() {
  const lang = useLang();
  return (
    <div className="soft-section p-4">
      <p className="font-semibold">{lang === "en" ? "OCR suggestions" : "OCR提案"}</p>
      <p className="text-sm text-muted">
        {lang === "en" ? "Show amount/vendor candidates" : "金額・店名の候補を表示"}
      </p>
    </div>
  );
}
