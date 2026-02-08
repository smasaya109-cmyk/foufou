"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import GroupCard from "@/components/group/GroupCard";
import PaywallBanner from "@/components/common/PaywallBanner";
import Alert from "@/components/common/Alert";
import { fetchWithAuth } from "@/lib/client-api";
import { swrFetcher } from "@/lib/swr";
import { getCopy } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

type GroupData = {
  id: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
  icon?: string | null;
  membersCount?: number;
  role?: string | null;
};

export default function AppPage() {
  const router = useRouter();
  const lang = useLang();
  const copy = getCopy(lang);
  const { data, error, isLoading, mutate } = useSWR("/api/groups", swrFetcher, {
    revalidateOnFocus: false
  });
  const groups = (data?.groups ?? []) as GroupData[];
  const userPlan = data?.plan ?? "free";
  const canArchive = userPlan !== "free";
  const [actionGroup, setActionGroup] = useState<GroupData | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [longPressActive, setLongPressActive] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  const formatted = useMemo(
    () =>
      groups.map((group) => {
        const period =
          group.startDate && group.endDate
            ? `${group.startDate} - ${group.endDate}`
            : undefined;
        return { ...group, period };
      }),
    [groups]
  );
  const activeGroups = formatted.filter((group) => group.status !== "archived");
  const archivedGroups = formatted.filter((group) => group.status === "archived");

  function canArchiveGroup(group: GroupData | null) {
    if (!group) return false;
    if (group.role !== "owner") return false;
    return canArchive;
  }

  async function archiveGroup(group: GroupData) {
    if (!canArchiveGroup(group)) {
      setActionError(group.role === "owner" ? copy.group.archiveProHint : copy.group.authRequired);
      return;
    }
    setActionPending(true);
    setActionError(null);
    try {
      const optimistic = groups.map((g) =>
        g.id === group.id ? { ...g, status: "archived" } : g
      );
      mutate({ groups: optimistic }, false);
      await fetchWithAuth(`/api/groups/${group.id}/settings`, {
        method: "PATCH",
        body: JSON.stringify({ status: "archived" })
      });
      setActionGroup(null);
      mutate();
    } catch (err: any) {
      const message = err?.message ?? "PREMIUM_REQUIRED";
      if (String(message).includes("PREMIUM_REQUIRED")) {
        router.push("/app/billing");
        return;
      }
      setActionError(copy.common.errorGeneric);
      mutate();
    } finally {
      setActionPending(false);
    }
  }

  async function unarchiveGroup(group: GroupData) {
    if (!canArchiveGroup(group)) {
      setActionError(group.role === "owner" ? copy.group.unarchiveProHint : copy.group.authRequired);
      return;
    }
    setActionPending(true);
    setActionError(null);
    try {
      const optimistic = groups.map((g) =>
        g.id === group.id ? { ...g, status: "active" } : g
      );
      mutate({ groups: optimistic }, false);
      await fetchWithAuth(`/api/groups/${group.id}/settings`, {
        method: "PATCH",
        body: JSON.stringify({ status: "active" })
      });
      setActionGroup(null);
      mutate();
    } catch (err: any) {
      const message = err?.message ?? "PREMIUM_REQUIRED";
      if (String(message).includes("PREMIUM_REQUIRED")) {
        router.push("/app/billing");
        return;
      }
      setActionError(copy.common.errorGeneric);
      mutate();
    } finally {
      setActionPending(false);
    }
  }

  async function deleteGroup(groupId: string) {
    const confirmed = window.confirm(copy.group.deleteConfirm);
    if (!confirmed) return;
    setActionPending(true);
    try {
      const optimistic = groups.filter((g) => g.id !== groupId);
      mutate({ groups: optimistic }, false);
      await fetchWithAuth(`/api/groups/${groupId}`, { method: "DELETE" });
      setActionGroup(null);
      mutate();
    } finally {
      setActionPending(false);
    }
  }

  async function duplicateGroup(groupId: string) {
    setActionPending(true);
    try {
      const data = await fetchWithAuth(`/api/groups/${groupId}/duplicate`, { method: "POST" });
      if (data?.id) {
        router.push(`/app/groups/${data.id}`);
      }
      setActionGroup(null);
      mutate();
    } catch (err: any) {
      const message = err?.message ?? "PREMIUM_REQUIRED";
      if (String(message).includes("PREMIUM_REQUIRED")) {
        router.push("/app/billing");
      }
    } finally {
      setActionPending(false);
    }
  }

  function startLongPress(group: GroupData) {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = window.setTimeout(() => {
      setLongPressActive(true);
      setActionGroup(group);
    }, 550);
  }

  function cancelLongPress() {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  return (
    <div className="space-y-8">
      <div className="card p-7">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">{copy.dashboard.label}</p>
            <h1 className="section-title text-3xl">{copy.dashboard.title}</h1>
            <p className="text-sm text-muted">{copy.dashboard.subtitle}</p>
          </div>
          <Link href="/app/groups/new" className="btn-primary">
            {copy.dashboard.create}
          </Link>
        </div>
      </div>

      <PaywallBanner
        title={copy.dashboard.freeLimitTitle}
        description={copy.dashboard.freeLimitDesc}
        actionLabel={copy.dashboard.freeLimitAction}
        actionHref="/app/subscription"
        iconSrc="/foufou_mascot.png"
      />

      {isLoading && !data ? (
        <div className="flex items-center gap-3 text-sm text-muted">
          <Image src="/loading.gif" alt="" width={24} height={24} unoptimized />
          <span>{copy.common.loading}</span>
        </div>
      ) : error ? (
        <div className="space-y-3">
          <Alert message={error.message ?? copy.common.errorGeneric} />
          {String(error.message ?? "").startsWith("AUTH_REQUIRED") ? (
            <Link href="/login" className="btn-primary inline-flex">
              {copy.dashboard.loginCta}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="space-y-10">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--ink-strong)]">
                {copy.dashboard.activeTitle}
              </h2>
              <span className="text-xs text-muted">{activeGroups.length}</span>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {activeGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className="text-left"
                  onClick={() => {
                    if (longPressActive) {
                      setLongPressActive(false);
                      return;
                    }
                    router.push(`/app/groups/${group.id}`);
                  }}
                  onTouchStart={() => startLongPress(group)}
                  onTouchEnd={() => {
                    cancelLongPress();
                    setTimeout(() => setLongPressActive(false), 0);
                  }}
                  onTouchMove={cancelLongPress}
                >
                  <GroupCard
                    title={group.title}
                    icon={group.icon}
                    period={group.period}
                    members={group.membersCount ?? 0}
                    premium="Free"
                  />
                </button>
              ))}
              {!activeGroups.length && (
                <p className="text-sm text-muted">{copy.dashboard.empty}</p>
              )}
            </div>
          </div>

          {archivedGroups.length ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--ink-strong)]">
                  {copy.dashboard.archivedTitle}
                </h2>
                <span className="text-xs text-muted">{archivedGroups.length}</span>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {archivedGroups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    className="text-left"
                    onClick={() => {
                      if (longPressActive) {
                        setLongPressActive(false);
                        return;
                      }
                      router.push(`/app/groups/${group.id}`);
                    }}
                    onTouchStart={() => startLongPress(group)}
                    onTouchEnd={() => {
                      cancelLongPress();
                      setTimeout(() => setLongPressActive(false), 0);
                    }}
                    onTouchMove={cancelLongPress}
                  >
                  <GroupCard
                    title={group.title}
                    icon={group.icon}
                    period={group.period}
                    members={group.membersCount ?? 0}
                    premium={copy.group.archivePro}
                    showRestore
                    onRestore={() => unarchiveGroup(group)}
                  />
                </button>
              ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {actionGroup ? (
        <div className="fixed inset-0 z-50 bg-black/30">
          <div className="fixed inset-0 flex items-end justify-center px-4 pb-10 md:items-center">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
              {actionError ? (
                <div className="px-5 pt-4">
                  <Alert message={actionError} />
                </div>
              ) : null}
              {actionGroup.status === "archived" ? (
                <button
                  className={`flex w-full items-center justify-between border-b border-[var(--stroke)] px-5 py-4 text-left ${
                    !canArchiveGroup(actionGroup) ? "opacity-60" : ""
                  }`}
                  onClick={() => unarchiveGroup(actionGroup)}
                  disabled={actionPending}
                >
                  <span>{copy.group.unarchivePro}</span>
                  <span>↩</span>
                </button>
              ) : (
                <button
                  className={`flex w-full items-center justify-between border-b border-[var(--stroke)] px-5 py-4 text-left ${
                    !canArchiveGroup(actionGroup) ? "opacity-60" : ""
                  }`}
                  onClick={() => archiveGroup(actionGroup)}
                  disabled={actionPending}
                >
                  <span>{copy.group.archivePro}</span>
                  <span>🗂</span>
                </button>
              )}
              <button
                className="flex w-full items-center justify-between border-b border-[var(--stroke)] px-5 py-4 text-left"
                onClick={() => duplicateGroup(actionGroup.id)}
                disabled={actionPending}
              >
                <span>{copy.group.duplicate}</span>
                <span>⧉</span>
              </button>
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left text-red-600"
                onClick={() => deleteGroup(actionGroup.id)}
                disabled={actionPending}
              >
                <span>{copy.common.delete}</span>
                <span>🗑</span>
              </button>
              <button
                className="w-full border-t border-[var(--stroke)] px-5 py-4 text-sm text-muted"
                onClick={() => setActionGroup(null)}
              >
                {copy.common.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
