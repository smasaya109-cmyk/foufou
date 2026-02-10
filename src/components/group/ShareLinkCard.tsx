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
  const shortUrl = displayUrl
    ? displayUrl.length > 36
      ? `${displayUrl.slice(0, 24)}...${displayUrl.slice(-8)}`
      : displayUrl
    : "";

  return (
    <div className="card p-4 min-w-0 overflow-hidden">
      <p className="font-semibold">{copy.group.shareTitle}</p>
      <p className="text-sm text-muted">
        {copy.group.shareDesc}
      </p>
      {token ? (
        <div className="mt-3 flex min-w-0 flex-col gap-2">
          <div className="relative min-w-0">
            <div
              className="min-w-0 w-full overflow-hidden truncate rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 pr-16 text-xs whitespace-nowrap text-ellipsis"
              title={displayUrl}
            >
              {shortUrl}
            </div>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-[var(--stroke)] bg-white px-2 py-1 text-[10px] text-[var(--ink-muted)]"
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
        </div>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-red-600">
          {error} {copy.common.supportSuffix}
        </p>
      ) : null}
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
