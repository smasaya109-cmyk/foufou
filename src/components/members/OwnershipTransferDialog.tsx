import { useState } from "react";
import Modal from "@/components/common/Modal";
import Alert from "@/components/common/Alert";
import { fetchWithAuth } from "@/lib/client-api";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export type EditorItem = {
  userId: string;
  name: string;
  email?: string | null;
};

export default function OwnershipTransferDialog({
  groupId,
  editors
}: {
  groupId: string;
  editors: EditorItem[];
}) {
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const lang = useLang();
  const copy = getCopy(lang);

  async function requestTransfer() {
    if (!selectedId) return;
    setPending(true);
    setMessage(null);
    try {
      await fetchWithAuth(`/api/groups/${groupId}/ownership/transfer`, {
        method: "POST",
        body: JSON.stringify({ toUserId: selectedId })
      });
      setMessage(copy.group.ownershipSuccess);
    } catch (err: any) {
      setMessage(err?.message ?? copy.group.ownershipFailed);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title={lang === "en" ? "Transfer ownership" : "Owner移譲"}>
      <div className="space-y-3">
        <p className="text-sm text-muted">{copy.group.ownershipRequestSub}</p>
        <select
          className="input-soft w-full text-sm"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          <option value="">{copy.group.ownershipSelect}</option>
          {editors.map((editor) => (
            <option key={editor.userId} value={editor.userId}>
              {editor.name}
            </option>
          ))}
        </select>
        <button
          className="btn-primary text-xs"
          onClick={requestTransfer}
          disabled={!selectedId || pending}
        >
          {pending ? copy.group.ownershipSending : copy.group.ownershipSend}
        </button>
        {message ? <Alert type="info" message={message} /> : null}
      </div>
    </Modal>
  );
}
