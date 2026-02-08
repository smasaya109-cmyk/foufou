"use client";

import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export default function DangerZone({
  onArchive,
  onDelete,
  pending,
  error,
  archiveDisabled
}: {
  onArchive: () => void;
  onDelete: () => void;
  pending?: boolean;
  error?: string | null;
  archiveDisabled?: boolean;
}) {
  const lang = useLang();
  const copy = getCopy(lang);
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
      <p className="font-semibold text-red-700">
        {lang === "en" ? "Danger Zone" : "Danger Zone"}
      </p>
      <p className="text-sm text-red-600">{copy.group.dangerNote}</p>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      <button
        className={`mt-3 w-full rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-600 ${
          archiveDisabled ? "opacity-60" : ""
        }`}
        onClick={onArchive}
        disabled={pending || archiveDisabled}
      >
        {copy.group.archivePro}
      </button>
      {archiveDisabled ? (
        <p className="mt-2 text-xs text-red-600">{copy.group.archiveProHint}</p>
      ) : null}
      <button
        className="mt-3 w-full rounded-full bg-red-600 px-4 py-2 text-sm text-white"
        onClick={onDelete}
        disabled={pending}
      >
        {pending ? copy.group.deletePending : copy.group.deleteGroup}
      </button>
    </div>
  );
}
