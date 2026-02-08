"use client";

import { useLang } from "@/hooks/useLang";

export default function GroupCard({
  title,
  icon,
  period,
  members,
  premium,
  showRestore,
  onRestore
}: {
  title: string;
  icon?: string | null;
  period?: string;
  members: number;
  premium: string;
  showRestore?: boolean;
  onRestore?: () => void;
}) {
  const lang = useLang();
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[var(--stroke)] bg-white text-xl">
            {icon ?? "🧳"}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {period ? <p className="text-sm text-muted">{period}</p> : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="pill bg-[#F1F3F5] text-neutral-700">{premium}</span>
          {showRestore ? (
            <button
              type="button"
              className="btn-outline px-3 py-1 text-xs"
              onClick={(event) => {
                event.stopPropagation();
                onRestore?.();
              }}
            >
              {lang === "en" ? "Restore" : "復元"}
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">
        {lang === "en" ? `${members} members` : `メンバー ${members}名`}
      </p>
    </div>
  );
}
