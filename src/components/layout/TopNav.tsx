import Link from "next/link";
import { cookies } from "next/headers";
import PremiumBadge from "@/components/group/PremiumBadge";
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
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
            <img src="/foufou_mascot.png" alt="Foufou" className="h-8 w-8" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">FouFou</span>
          </div>
        </Link>
        <div className="hidden flex-1 items-center justify-center gap-4 md:flex">
          {currentGroupName ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">{copy.top.currentTrip}</span>
              <span className="font-semibold">{currentGroupName}</span>
            </div>
          ) : <span className="text-sm text-muted">{copy.top.travelHub}</span>}
          {premiumLabel ? <PremiumBadge label={premiumLabel} /> : null}
        </div>
        <div className="h-8 w-8 md:hidden" aria-hidden />
      </div>
    </div>
  );
}
