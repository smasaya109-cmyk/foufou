"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/client-api";
import Alert from "@/components/common/Alert";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export type OwnershipTransfer = {
  id: string;
  fromUserName: string;
  groupId: string;
};

export default function OwnershipAcceptBanner({ groupId }: { groupId: string }) {
  const [transfers, setTransfers] = useState<OwnershipTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const lang = useLang();
  const copy = getCopy(lang);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchWithAuth(`/api/ownership/pending?groupId=${groupId}`)
      .then((data) => {
        if (!mounted) return;
        setTransfers(data.transfers ?? []);
      })
      .catch(() => {
        if (!mounted) return;
        setTransfers([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [groupId]);

  async function accept(transferId: string) {
    setMessage(null);
    try {
      await fetchWithAuth("/api/ownership/accept", {
        method: "POST",
        body: JSON.stringify({ transferId })
      });
      setTransfers((prev) => prev.filter((t) => t.id !== transferId));
      setMessage(copy.group.ownershipAcceptSuccess);
    } catch (err: any) {
      setMessage(err?.message ?? copy.group.ownershipAcceptFailed);
    }
  }

  if (loading || !transfers.length) return null;

  return (
    <div className="card p-4">
      <p className="font-semibold">{copy.group.ownershipBannerTitle}</p>
      <p className="text-sm text-muted">{copy.group.ownershipBannerDesc}</p>
      <div className="mt-3 space-y-2">
        {transfers.map((transfer) => (
          <div
            key={transfer.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--stroke)] bg-white px-3 py-2"
          >
            <p className="text-sm">
              {lang === "en"
                ? `Transfer request from ${transfer.fromUserName}`
                : `${transfer.fromUserName} からの移譲申請`}
            </p>
            <button
              className="btn-primary text-xs"
              onClick={() => accept(transfer.id)}
            >
              {copy.group.ownershipAccept}
            </button>
          </div>
        ))}
      </div>
      {message ? <Alert type="info" message={message} /> : null}
    </div>
  );
}
