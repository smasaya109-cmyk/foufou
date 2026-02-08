import Link from "next/link";
import { getCopy } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

export default function GroupTabs({
  groupId,
  active
}: {
  groupId: string;
  active: string;
}) {
  const lang = useLang();
  const copy = getCopy(lang);
  const tabs = [
    { id: "expenses", label: copy.tabs.expenses },
    { id: "settlement", label: copy.tabs.settlement },
    { id: "members", label: copy.tabs.members },
    { id: "insights", label: copy.tabs.insights, badge: "Pro" },
    { id: "photos", label: copy.tabs.photos, badge: "Premium" },
    { id: "settings", label: copy.tabs.settings }
  ];
  return (
    <div className="w-full overflow-x-auto py-1 touch-pan-x">
      <div className="flex min-w-max flex-nowrap gap-2 pr-2">
      {tabs.map((tab) => {
        const href =
          tab.id === "members"
            ? `/app/groups/${groupId}/members`
            : tab.id === "settings"
              ? `/app/groups/${groupId}/settings`
              : `/app/groups/${groupId}?tab=${tab.id}`;
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={href}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition touch-manipulation active:scale-95 ${
              isActive
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--stroke)] bg-white text-neutral-700"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.badge ? (
                <span className="inline-flex h-5 items-center rounded-full bg-[var(--accent-soft)] px-2 text-[10px] text-[var(--accent-strong)]">
                  {tab.badge}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
      </div>
    </div>
  );
}
