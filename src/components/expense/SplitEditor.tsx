"use client";

import { useLang } from "@/hooks/useLang";

export default function SplitEditor() {
  const lang = useLang();
  return (
    <div className="card p-4">
      <p className="font-semibold">{lang === "en" ? "Split" : "分け方"}</p>
      <p className="text-sm text-muted">Free: equal / select</p>
    </div>
  );
}
