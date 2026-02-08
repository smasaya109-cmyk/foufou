"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import GroupHeader from "@/components/group/GroupHeader";
import GroupTabs from "@/components/group/GroupTabs";
import MemberTable, { MemberItem } from "@/components/members/MemberTable";
import Alert from "@/components/common/Alert";
import GroupPassCard from "@/components/members/GroupPassCard";
import { fetchWithAuth } from "@/lib/client-api";
import { swrFetcher } from "@/lib/swr";
import { useLang } from "@/hooks/useLang";
import { getCopy } from "@/lib/i18n";

export default function MembersPage({ params }: { params: { groupId: string } }) {
  const { data: groupData } = useSWR(`/api/groups/${params.groupId}`, swrFetcher, {
    revalidateOnFocus: false
  });
  const { data: membersData, mutate } = useSWR(
    `/api/groups/${params.groupId}/members`,
    swrFetcher,
    { revalidateOnFocus: false }
  );
  const groupName = groupData?.group?.title ?? "—";
  const groupIcon = groupData?.group?.icon ?? "🧳";
  const premiumLabel = groupData?.entitlements?.label ?? "Free";
  const [localName, setLocalName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [localPending, setLocalPending] = useState(false);
  const lang = useLang();
  const copy = getCopy(lang);

  const members = useMemo<MemberItem[]>(
    () =>
      (membersData?.members ?? []).map((m: any) => ({
        id: m.userId ?? m.id ?? "",
        name: m.name ?? m.userId ?? "—",
        joinedAt: m.joinedAt ?? "-"
      })),
    [membersData]
  );

  return (
    <div className="space-y-8">
      <GroupHeader title={groupName} icon={groupIcon} premiumLabel={premiumLabel} />
      <GroupTabs groupId={params.groupId} active="members" />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <MemberTable
          items={members}
          onRename={async (id, name) => {
            if (!name) return;
            setLocalError(null);
            try {
              if (String(id).startsWith("local_tmp_")) {
                return;
              }
              await mutate(
                async (current: { members?: any[] } | undefined) => {
                  await fetchWithAuth(`/api/groups/${params.groupId}/members`, {
                    method: "PATCH",
                    body: JSON.stringify({ userId: id, name })
                  });
                  return {
                    members: (current?.members ?? []).map((m: any) =>
                      (m.userId ?? m.id) === id ? { ...m, name } : m
                    )
                  };
                },
                {
                  optimisticData: {
                    members: (membersData?.members ?? []).map((m: any) =>
                      (m.userId ?? m.id) === id ? { ...m, name } : m
                    )
                  },
                  rollbackOnError: true,
                  populateCache: true,
                  revalidate: false
                }
              );
            } catch {
              setLocalError(copy.group.memberRenameFailed);
            }
          }}
        />
        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <p className="font-semibold">{copy.group.membersAddTitle}</p>
            <input
              className="input-soft w-full text-sm"
              placeholder={copy.group.memberPlaceholder}
              value={localName}
              onChange={(event) => setLocalName(event.target.value)}
            />
            <button
              className="btn-primary text-xs"
              onClick={async () => {
                setLocalError(null);
                setLocalPending(true);
                try {
                  const optimisticMember = {
                    userId: `local_tmp_${Date.now()}`,
                    name: localName,
                    role: "local",
                    joinedAt: new Date().toISOString()
                  };
                  await mutate(
                    async (current: { members?: any[] } | undefined) => {
                      const res = await fetchWithAuth(`/api/groups/${params.groupId}/local-members`, {
                        method: "POST",
                        body: JSON.stringify({ name: localName })
                      });
                      return {
                        members: [
                          { ...optimisticMember, userId: res.id },
                          ...(current?.members ?? [])
                        ]
                      };
                    },
                    {
                      optimisticData: {
                        members: [optimisticMember, ...(membersData?.members ?? [])]
                      },
                      rollbackOnError: true,
                      populateCache: true,
                      revalidate: false
                    }
                  );
                  setLocalName("");
                } catch (err: any) {
                  setLocalError(err?.message ?? copy.group.memberAddFailed);
                } finally {
                  setLocalPending(false);
                }
              }}
              disabled={localPending || !localName}
            >
              {localPending ? copy.group.memberAddPending : copy.common.add}
            </button>
            {localError ? <Alert message={localError} /> : null}
          </div>
          <GroupPassCard />
        </div>
      </div>
    </div>
  );
}
