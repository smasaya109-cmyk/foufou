import { useMemo, useState } from "react";
import { getCopy, getLocale } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

export type MemberItem = { id: string; name: string; joinedAt: string };

export default function MemberTable({
  items,
  onRename
}: {
  items: MemberItem[];
  onRename?: (id: string, name: string) => void;
}) {
  const lang = useLang();
  const copy = getCopy(lang);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const rows = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        displayName: nameOverrides[item.id] ?? item.name,
        displayDate: item.joinedAt
          ? new Date(item.joinedAt).toLocaleDateString(getLocale(lang))
          : "-"
      })),
    [items, nameOverrides, lang]
  );
  return (
    <div className="card p-5">
      <p className="font-semibold">{lang === "en" ? "Members" : "メンバー一覧"}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>{copy.common.name}</span>
        <span>{copy.common.addedDate}</span>
      </div>
      {rows.length ? (
        rows.map((item) => (
          <div
            key={item.id}
            className="mt-3 flex items-center justify-between gap-3"
          >
            {onRename ? (
              <div className="flex min-w-0 items-center gap-2">
                {editingId === item.id ? (
                  <>
                    <div className="flex w-full min-w-0 items-center gap-2">
                      <input
                        className="input-soft min-w-0 flex-1 text-sm font-semibold"
                        value={drafts[item.id] ?? item.displayName}
                        onChange={(event) =>
                          setDrafts((prev) => ({ ...prev, [item.id]: event.target.value }))
                        }
                      />
                      <div className="flex flex-none items-center gap-2">
                        <button
                          className="btn-primary flex h-7 w-7 items-center justify-center p-0 text-[12px]"
                          aria-label={copy.common.save}
                          onClick={() => {
                            const next = (drafts[item.id] ?? item.displayName).trim();
                            setNameOverrides((prev) => ({ ...prev, [item.id]: next }));
                            onRename(item.id, next);
                            setEditingId(null);
                          }}
                        >
                          ✓
                        </button>
                        <button
                          className="btn-outline flex h-7 w-7 items-center justify-center p-0 text-[12px]"
                          aria-label={copy.common.cancel}
                          onClick={() => setEditingId(null)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="truncate text-base font-semibold text-[var(--ink-strong)]">
                      {item.displayName}
                    </span>
                    <button
                      className="rounded-full border-2 border-[var(--stroke)] px-2 py-1 text-[11px]"
                      onClick={() => {
                        setDrafts((prev) => ({ ...prev, [item.id]: item.displayName }));
                        setEditingId(item.id);
                      }}
                      aria-label={copy.common.edit}
                    >
                      ✏️
                    </button>
                  </>
                )}
              </div>
            ) : (
              <span className="truncate">{item.name}</span>
            )}
            <span className="text-xs text-muted">{item.displayDate}</span>
          </div>
        ))
      ) : (
        <p className="mt-3 text-sm text-muted">{copy.common.membersEmpty}</p>
      )}
    </div>
  );
}
