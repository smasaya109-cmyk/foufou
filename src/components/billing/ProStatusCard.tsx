"use client";

import useSWR from "swr";
import { useLang } from "@/hooks/useLang";
import { swrFetcher } from "@/lib/swr";

export default function ProStatusCard() {
  const lang = useLang();
  const { data } = useSWR("/api/groups", swrFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true
  });
  const plan = data?.entitlements?.label ?? "Free";
  return (
    <div className="card p-4">
      <p className="font-semibold">{lang === "en" ? "Pro status" : "現在のPro状態"}</p>
      <p className="text-sm text-muted">{plan}</p>
    </div>
  );
}
