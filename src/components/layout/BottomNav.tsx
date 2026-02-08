"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon from "@/components/layout/NavIcon";
import { getCopy } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

export default function BottomNav() {
  const pathname = usePathname();
  const lang = useLang();
  const copy = getCopy(lang);
  return (
    <div className="fixed bottom-4 left-0 right-0 z-30 mx-auto flex w-full max-w-md items-center justify-between rounded-full border-2 border-[var(--stroke)] bg-white px-6 py-3 text-sm shadow-lg md:hidden">
      <Link
        href="/app"
        className={`flex flex-col items-center gap-1 ${
          pathname === "/app" ? "text-[var(--accent)]" : "text-muted"
        }`}
      >
        <NavIcon name="home" />
        <span className="text-[11px]">{copy.nav.home}</span>
      </Link>
      <Link
        href="/app/subscription"
        className={`flex flex-col items-center gap-1 ${
          pathname === "/app/subscription" ? "text-[var(--accent)]" : "text-muted"
        }`}
      >
        <NavIcon name="pricing" />
        <span className="text-[11px]">{copy.nav.upgrade}</span>
      </Link>
      <Link
        href="/app/description"
        className={`flex flex-col items-center gap-1 ${
          pathname === "/app/description" ? "text-[var(--accent)]" : "text-muted"
        }`}
      >
        <NavIcon name="guide" />
        <span className="text-[11px]">{copy.nav.guide}</span>
      </Link>
      <Link
        href="/app/profile"
        className={`flex flex-col items-center gap-1 ${
          pathname === "/app/profile" ? "text-[var(--accent)]" : "text-muted"
        }`}
      >
        <NavIcon name="profile" />
        <span className="text-[11px]">{copy.nav.account}</span>
      </Link>
    </div>
  );
}
