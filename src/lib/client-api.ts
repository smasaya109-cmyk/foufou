"use client";

import { onAuthStateChanged } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";

async function getToken() {
  if (clientAuth.currentUser) {
    return clientAuth.currentUser.getIdToken();
  }

  return new Promise<string>((resolve, reject) => {
    const unsub = onAuthStateChanged(
      clientAuth,
      async (user) => {
        unsub();
        if (!user) {
          reject(new Error("AUTH_REQUIRED"));
          return;
        }
        resolve(await user.getIdToken());
      },
      (error) => {
        unsub();
        reject(error);
      }
    );
  });
}

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit) {
  const token = await getToken();

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(input, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = "REQUEST_FAILED";
    try {
      const data = JSON.parse(text);
      message = data?.error ?? message;
    } catch {
      if (text) message = text;
    }
    throw new Error(`${message} (status ${res.status})`);
  }
  return res.json();
}
