"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import GroupHeader from "@/components/group/GroupHeader";
import GroupTabs from "@/components/group/GroupTabs";
import ShareLinkCard from "@/components/group/ShareLinkCard";
import DangerZone from "@/components/group/DangerZone";
import Alert from "@/components/common/Alert";
import OwnershipTransferDialog from "@/components/members/OwnershipTransferDialog";
import OwnershipAcceptBanner from "@/components/ownership/OwnershipAcceptBanner";
import { fetchWithAuth } from "@/lib/client-api";
import { swrFetcher } from "@/lib/swr";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export default function SettingsPage({ params }: { params: { groupId: string } }) {
  const router = useRouter();
  const { data: groupData, mutate } = useSWR(`/api/groups/${params.groupId}`, swrFetcher, {
    revalidateOnFocus: false
  });
  const groupName = groupData?.group?.title ?? "";
  const groupIcon = groupData?.group?.icon ?? "🧳";
  const premiumLabel = groupData?.entitlements?.label ?? "Free";
  const shareToken = groupData?.group?.shareToken ?? null;
  const canArchive = Boolean(groupData?.entitlements?.canUsePremium);
  const [titleInput, setTitleInput] = useState("");
  const [iconInput, setIconInput] = useState("🧳");
  const [iconOpen, setIconOpen] = useState(false);
  const [titlePending, setTitlePending] = useState(false);
  const [titleMessage, setTitleMessage] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [archivePending, setArchivePending] = useState(false);
  const { data: editorData, mutate: mutateEditors } = useSWR(
    `/api/groups/${params.groupId}/editors`,
    swrFetcher,
    { revalidateOnFocus: false }
  );
  const [editorEmail, setEditorEmail] = useState("");
  const [editorPending, setEditorPending] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const lang = useLang();
  const copy = getCopy(lang);

  const iconOptions = [
    "🧳",
    "🏝️",
    "🏖️",
    "🏕️",
    "🏔️",
    "🏙️",
    "🗼",
    "🗽",
    "🎡",
    "🎢",
    "🎠",
    "🚗",
    "🚆",
    "✈️",
    "🛳️",
    "🚁",
    "🛶",
    "🚌",
    "🗺️",
    "🧭",
    "🏨",
    "🏯",
    "🏰",
    "⛩️",
    "🕌",
    "📸",
    "🍜",
    "🍣",
    "🍔",
    "🍕",
    "🍻",
    "☕",
    "🍷",
    "🎉",
    "🎈",
    "🎵",
    "🎮",
    "🎬",
    "🎤",
    "🎨",
    "🎯",
    "⚽",
    "🎾",
    "🏀",
    "🌅",
    "🌄",
    "🌆",
    "🌌",
    "🌈",
    "🏞️",
    "🌊",
    "🌋",
    "🌳",
    "🍁",
    "⭐",
    "❤️"
  ];

  useEffect(() => {
    if (groupName) setTitleInput(groupName);
    if (groupIcon) setIconInput(groupIcon);
  }, [groupName]);

  async function deleteGroup() {
    const confirmed = window.confirm(copy.group.deleteConfirm);
    if (!confirmed) return;
    setDeleteError(null);
    setDeletePending(true);
    try {
      await fetchWithAuth(`/api/groups/${params.groupId}`, { method: "DELETE" });
      router.push("/app");
    } catch (err: any) {
      setDeleteError(err?.message ?? copy.group.deleteFailed);
    } finally {
      setDeletePending(false);
    }
  }

  async function archiveGroup() {
    setDeleteError(null);
    if (!canArchive) {
      setDeleteError(copy.group.archiveProHint);
      return;
    }
    setArchivePending(true);
    try {
      await fetchWithAuth(`/api/groups/${params.groupId}/settings`, {
        method: "PATCH",
        body: JSON.stringify({ status: "archived" })
      });
      router.push("/app");
    } catch (err: any) {
      const message = err?.message ?? copy.group.archiveFailed;
      if (String(message).includes("PREMIUM_REQUIRED")) {
        router.push("/app/billing");
        return;
      }
      setDeleteError(message);
    } finally {
      setArchivePending(false);
    }
  }

  async function updateTitle() {
    if (!titleInput.trim()) return;
    setTitlePending(true);
    setTitleMessage(null);
    try {
      mutate(
        (current: any) => ({
          ...current,
          group: { ...current?.group, title: titleInput.trim() }
        }),
        false
      );
      await fetchWithAuth(`/api/groups/${params.groupId}/settings`, {
        method: "PATCH",
        body: JSON.stringify({ title: titleInput.trim() })
      });
      setTitleMessage(copy.group.nameUpdateSuccess);
      mutate();
    } catch (err: any) {
      setTitleMessage(err?.message ?? copy.group.nameUpdateFailed);
      mutate();
    } finally {
      setTitlePending(false);
    }
  }

  async function updateIcon(nextIcon: string) {
    setIconInput(nextIcon);
    try {
      mutate(
        (current: any) => ({
          ...current,
          group: { ...current?.group, icon: nextIcon }
        }),
        false
      );
      await fetchWithAuth(`/api/groups/${params.groupId}/settings`, {
        method: "PATCH",
        body: JSON.stringify({ icon: nextIcon })
      });
      mutate();
    } catch {
      mutate();
    }
  }

  return (
    <div className="space-y-8 overflow-x-hidden">
      <GroupHeader title={groupName} icon={groupIcon} premiumLabel={premiumLabel} />
      <GroupTabs groupId={params.groupId} active="settings" />

      <OwnershipAcceptBanner groupId={params.groupId} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <p className="font-semibold">{copy.group.groupName}</p>
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--stroke)] bg-white text-2xl"
                  onClick={() => setIconOpen((prev) => !prev)}
                  aria-label={copy.group.iconChange}
                >
                  {iconInput}
                </button>
                {iconOpen ? (
                  <div className="absolute left-0 top-14 z-20 w-48 rounded-2xl border border-[var(--stroke)] bg-white p-3 shadow-xl">
                    <div className="grid grid-cols-6 gap-2">
                      {iconOptions.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-xl hover:bg-[var(--bg-soft)]"
                          onClick={() => {
                            updateIcon(emoji);
                            setIconOpen(false);
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <input
                className="input-soft w-full min-w-0 text-sm"
                value={titleInput}
                onChange={(event) => setTitleInput(event.target.value)}
              />
            </div>
            <button
              className="btn-primary text-xs"
              onClick={updateTitle}
              disabled={titlePending}
            >
              {titlePending ? copy.group.updatePending : copy.group.updateButton}
            </button>
            {titleMessage ? <Alert type="success" message={titleMessage} /> : null}
          </div>
          <ShareLinkCard groupId={params.groupId} initialToken={shareToken} />
          <div className="card p-5 space-y-4">
            <p className="font-semibold">{copy.group.editorsTitle}</p>
            <p className="text-sm text-muted">
              {copy.group.editorsHelp}
            </p>
            <div className="flex flex-wrap gap-2">
              {(editorData?.editors ?? []).map((editor: any) => (
                <span
                  key={editor.userId}
                  className="flex items-center gap-2 rounded-full border border-[var(--stroke)] bg-white px-3 py-1 text-xs"
                >
                  {editor.name}
                  <button
                    className="text-[var(--ink-muted)]"
                    onClick={async () => {
                      setEditorError(null);
                      setEditorPending(true);
                      try {
                        await fetchWithAuth(`/api/groups/${params.groupId}/editors`, {
                          method: "DELETE",
                          body: JSON.stringify({ userId: editor.userId })
                        });
                        mutateEditors();
                      } catch (err: any) {
                        setEditorError(err?.message ?? copy.group.editorRemoveFailed);
                      } finally {
                        setEditorPending(false);
                      }
                    }}
                    aria-label={copy.group.editorRemove}
                  >
                    ×
                  </button>
                </span>
              ))}
              {!(editorData?.editors ?? []).length ? (
                <span className="text-xs text-muted">{copy.group.editorsEmpty}</span>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input-soft w-full text-sm"
                placeholder={copy.group.editorPlaceholder}
                value={editorEmail}
                onChange={(event) => setEditorEmail(event.target.value)}
              />
              <button
                className="btn-primary min-w-[96px] whitespace-nowrap text-xs"
                onClick={async () => {
                  if (!editorEmail.trim()) return;
                  setEditorError(null);
                  setEditorPending(true);
                  try {
                    await fetchWithAuth(`/api/groups/${params.groupId}/editors`, {
                      method: "POST",
                      body: JSON.stringify({ email: editorEmail.trim() })
                    });
                    setEditorEmail("");
                    mutateEditors();
                  } catch (err: any) {
                    const message = err?.message ?? copy.group.editorAddFailed;
                    if (String(message).includes("EDITOR_LIMIT")) {
                      setEditorError(copy.group.editorLimit);
                      return;
                    }
                    setEditorError(message);
                  } finally {
                    setEditorPending(false);
                  }
                }}
                disabled={editorPending}
              >
                {editorPending ? copy.group.editorAddPending : copy.group.editorAdd}
              </button>
            </div>
            {editorError ? <Alert message={editorError} /> : null}
          </div>
          <OwnershipTransferDialog
            groupId={params.groupId}
            editors={(editorData?.editors ?? []).map((editor: any) => ({
              userId: editor.userId,
              name: editor.name ?? editor.email ?? "—",
              email: editor.email ?? null
            }))}
          />
          {null}
        </div>
        <div className="space-y-5">
          <DangerZone
            onArchive={archiveGroup}
            onDelete={deleteGroup}
            pending={deletePending || archivePending}
            error={deleteError}
            archiveDisabled={!canArchive}
          />
        </div>
      </div>
    </div>
  );
}
