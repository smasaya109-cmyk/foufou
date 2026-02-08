"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/client-api";
import { getCopy } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

export default function ShareLinkCard({
  groupId,
  initialToken
}: {
  groupId: string;
  initialToken?: string | null;
}) {
  const [token, setToken] = useState(initialToken ?? null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lang = useLang();
  const copy = getCopy(lang);

  useEffect(() => {
    setToken(initialToken ?? null);
  }, [initialToken]);

  async function rotate() {
    setError(null);
    setPending(true);
    try {
      const data = await fetchWithAuth(`/api/groups/${groupId}/share/rotate`, {
        method: "POST"
      });
      setToken(data.shareToken);
      setCopied(false);
    } catch (err: any) {
      setError(err?.message ?? copy.group.shareUpdateFailed);
    } finally {
      setPending(false);
    }
  }

  const shareUrl = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${token}` : "";
  const displayUrl = shareUrl || "";

  return (
    <div className="card p-4 min-w-0">
      <p className="font-semibold">{copy.group.shareTitle}</p>
      <p className="text-sm text-muted">
        {copy.group.shareDesc}
      </p>
      {token ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div
            className="min-w-0 flex-1 truncate rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-xs"
            title={displayUrl}
          >
            {displayUrl}
          </div>
          <button
            className="rounded-full border border-[var(--stroke)] px-3 py-2 text-xs sm:min-w-[84px]"
            onClick={async () => {
              if (!displayUrl) return;
              try {
                await navigator.clipboard.writeText(displayUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              } catch {
                setCopied(false);
              }
            }}
            type="button"
          >
            {copied ? copy.group.shareCopied : copy.group.shareCopy}
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      <button
        className="mt-3 rounded-full border border-[var(--stroke)] px-3 py-2 text-sm"
        onClick={rotate}
        disabled={pending}
      >
        {pending ? copy.group.shareUpdating : copy.group.shareUpdate}
      </button>
    </div>
  );
}
