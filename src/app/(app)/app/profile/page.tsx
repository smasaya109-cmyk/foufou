"use client";

import ProfilePanel from "@/components/profile/ProfilePanel";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export default function ProfilePage() {
  const lang = useLang();
  const copy = getCopy(lang);
  return (
    <div className="space-y-8">
      <div className="card p-7">
        <h1 className="section-title text-3xl">{copy.nav.account}</h1>
        <p className="text-sm text-muted">
          {lang === "en" ? "Manage your account settings." : "アカウント設定を管理します。"}
        </p>
      </div>
      <ProfilePanel />
    </div>
  );
}
