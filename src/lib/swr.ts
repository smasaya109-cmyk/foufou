"use client";

import { fetchWithAuth } from "@/lib/client-api";

export async function swrFetcher(url: string) {
  return fetchWithAuth(url);
}
