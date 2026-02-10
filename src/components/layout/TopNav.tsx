import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import PlanBadge from "@/components/layout/PlanBadge";
import { LANG_KEY, LEGACY_LANG_KEY, getCopy, normalizeLang } from "@/lib/i18n";

export default function TopNav({
  currentGroupName,
  premiumLabel
}: {
  currentGroupName?: string;
  premiumLabel?: string;
}) {
  const cookieStore = cookies();
  const lang = normalizeLang(
    cookieStore.get(LANG_KEY)?.value ?? cookieStore.get(LEGACY_LANG_KEY)?.value
  );
  const copy = getCopy(lang);
  return (
    <div className="sticky top-0 z-30 border-b border-[var(--stroke)] bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-4 md:px-6">
        <div className="hidden md:flex flex-1 items-center gap-3">
          {currentGroupName ? (
            <>
              <span className="text-sm text-muted">{copy.top.currentTrip}</span>
              <span className="font-semibold">{currentGroupName}</span>
            </>
          ) : null}
        </div>
        <div className="flex flex-1 justify-start md:justify-center">
          <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Image src="/foufou_mascot.webp" alt="Foufou" width={32} height={32} priority />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">FouFou</span>
            <PlanBadge />
          </div>
          </Link>
        </div>
        <div className="flex flex-1 justify-end">
          <div className="h-8 w-8 md:hidden" aria-hidden />
        </div>
      </div>
    </div>
  );
}
