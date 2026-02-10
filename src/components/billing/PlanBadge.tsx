"use client";

import useSWR from "swr";
import PremiumBadge from "@/components/group/PremiumBadge";
import { swrFetcher } from "@/lib/swr";

export default function PlanBadge() {
  const { data } = useSWR("/api/groups", swrFetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true
  });
  const plan = data?.plan ?? "free";

  if (plan === "free") return null;
  const label = plan === "premium" ? "Premium" : "Pro";
  return <PremiumBadge label={label} />;
}
