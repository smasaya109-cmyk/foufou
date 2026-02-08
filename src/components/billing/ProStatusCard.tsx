"use client";

import { useLang } from "@/hooks/useLang";

export default function ProStatusCard() {
  const lang = useLang();
  return (
    <div className="card p-4">
      <p className="font-semibold">{lang === "en" ? "Pro status" : "現在のPro状態"}</p>
      <p className="text-sm text-muted">Free</p>
    </div>
  );
}
