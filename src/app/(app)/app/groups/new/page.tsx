"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GroupForm from "@/components/group/GroupForm";
import Alert from "@/components/common/Alert";
import { fetchWithAuth } from "@/lib/client-api";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export default function NewGroupPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("🧳");
  const [currency, setCurrency] = useState("JPY");
  const [myName, setMyName] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const lang = useLang();
  const copy = getCopy(lang);

  async function onSubmit() {
    setError(null);
    setPending(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        icon,
        currency,
        myName,
        participants: participants.filter((name) => name.trim().length > 0)
      };
      const data = await fetchWithAuth("/api/groups", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      router.push(`/app/groups/${data.id}`);
    } catch (err: any) {
      const message = err?.message ?? "REQUEST_FAILED";
      if (message.startsWith("AUTH_REQUIRED")) {
        setError(copy.group.authRequired);
      } else if (message.startsWith("LIMIT_REACHED")) {
        setError(copy.group.limitReached);
      } else {
        setError(message);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-3xl font-semibold">{copy.group.createTitle}</h1>
        <p className="text-sm text-muted">{copy.group.createSub}</p>
      </div>
      <div className="card p-6">
        <GroupForm
          title={title}
          setTitle={setTitle}
          icon={icon}
          setIcon={setIcon}
          currency={currency}
          setCurrency={setCurrency}
          myName={myName}
          setMyName={setMyName}
          participants={participants}
          setParticipants={setParticipants}
        />
        {error ? <div className="mt-4"><Alert message={error} /></div> : null}
        <div className="mt-6 flex gap-3">
          <button
            className="btn-primary"
            onClick={onSubmit}
            disabled={pending}
          >
            {pending ? copy.common.processing : copy.common.create}
          </button>
          <button
            className="btn-outline"
            onClick={() => router.back()}
            disabled={pending}
          >
            {copy.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
