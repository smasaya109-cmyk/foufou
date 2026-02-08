"use client";

import { useLang } from "@/hooks/useLang";

export default function GroupPassCard() {
  const lang = useLang();
  return (
    <div className="soft-section p-4">
      <p className="font-semibold">{lang === "en" ? "Group pass" : "グループパス"}</p>
      <p className="text-sm text-muted">
        {lang === "en" ? "Unlock Pro features for everyone in this group." : "全員のPro機能を解放します。"}
      </p>
    </div>
  );
}
