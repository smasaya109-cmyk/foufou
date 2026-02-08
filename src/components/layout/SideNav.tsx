"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon from "@/components/layout/NavIcon";
import { getCopy } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

export default function SideNav() {
  const pathname = usePathname();
  const lang = useLang();
  const copy = getCopy(lang);
  const navItems: Array<{ href: string; label: string; icon: "home" | "pricing" | "guide" | "profile" }> = [
    { href: "/app", label: copy.nav.home, icon: "home" },
    { href: "/app/subscription", label: copy.nav.upgrade, icon: "pricing" },
    { href: "/app/description", label: copy.nav.guide, icon: "guide" },
    { href: "/app/profile", label: copy.nav.account, icon: "profile" }
  ];
  return (
    <aside className="sticky top-20 hidden h-fit w-48 flex-shrink-0 flex-col gap-3 md:flex">
      <div className="card p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{copy.nav.navigate}</p>
        <nav className="mt-4 flex flex-col gap-2 text-sm">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                  active
                  ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                  : "text-neutral-800 hover:bg-[var(--bg-soft)]"
                }`}
              >
              <NavIcon name={item.icon} className="text-[var(--accent-strong)]" />
              {item.label}
            </Link>
          )})}
        </nav>
      </div>
    </aside>
  );
}
