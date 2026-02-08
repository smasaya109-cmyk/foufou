"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  onAuthStateChanged,
  signOut,
  updateEmail,
  updateProfile,
  type User
} from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";
import { getCopy, type Lang } from "@/lib/i18n";
import { setLangClient, useLang } from "@/hooks/useLang";
import { fetchWithAuth } from "@/lib/client-api";

const NOTIFY_KEY = "tripsplit_notify";

export default function ProfilePanel() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const lang = useLang();
  const [notify, setNotify] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const copy = getCopy(lang);

  useEffect(() => {
    const storedNotify = localStorage.getItem(NOTIFY_KEY);
    if (storedNotify) setNotify(storedNotify === "true");
    const unsub = onAuthStateChanged(clientAuth, (nextUser) => {
      setUser(nextUser);
      setName(nextUser?.displayName ?? "");
      setEmail(nextUser?.email ?? "");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchWithAuth("/api/notifications")
      .then((data) => setNotifications(data.notifications ?? []))
      .catch(() => {});
  }, [user]);

  function updateLang(value: string) {
    setLangClient(value as Lang);
  }

  function updateNotify(value: boolean) {
    setNotify(value);
    localStorage.setItem(NOTIFY_KEY, String(value));
  }

  async function saveProfile() {
    if (!user) return;
    setMessage(null);
    setPending(true);
    try {
      if (name !== user.displayName) {
        await updateProfile(user, { displayName: name });
      }
      if (email && email !== user.email) {
        await updateEmail(user, email);
      }
      setMessage(lang === "en" ? "Saved." : "保存しました");
    } catch (err: any) {
      setMessage(err?.message ?? (lang === "en" ? "Failed to save." : "保存に失敗しました"));
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    await signOut(clientAuth);
  }

  async function setDevPlan(plan: "free" | "pro" | "premium") {
    setMessage(null);
    try {
      await fetchWithAuth("/api/dev/plan", {
        method: "POST",
        body: JSON.stringify({ plan })
      });
      setMessage(lang === "en" ? `Switched to ${plan}.` : `${plan}に切り替えました。`);
    } catch (err: any) {
      setMessage(err?.message ?? (lang === "en" ? "Failed to switch." : "切り替えに失敗しました。"));
    }
  }

  return (
    <div className="card p-4 text-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{copy.nav.account}</p>
      {!user ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted">{copy.common.signedOut}</p>
          <Link href="/login" className="btn-primary text-center">
            {copy.common.signIn}
          </Link>
          <div>
            <label className="text-xs text-muted">{copy.common.language}</label>
            <select
              className="mt-1 w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm"
              value={lang}
              onChange={(event) => updateLang(event.target.value)}
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-xs text-muted">{copy.common.name}</label>
            <input
              className="input-soft mt-1 w-full text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted">{copy.common.email}</label>
            <input
              className="input-soft mt-1 w-full text-sm"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{copy.common.notifications}</span>
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs ${
                notify ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-soft)]"
              }`}
              onClick={() => updateNotify(!notify)}
            >
              {notify ? copy.common.on : copy.common.off}
            </button>
          </div>
          <div>
            <label className="text-xs text-muted">{copy.common.language}</label>
            <select
              className="mt-1 w-full rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm"
              value={lang}
              onChange={(event) => updateLang(event.target.value)}
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
          {message ? <p className="text-xs text-muted">{message}</p> : null}
          <button
            className="btn-primary w-full text-xs"
            onClick={saveProfile}
            disabled={pending}
          >
            {pending ? copy.common.saving : copy.common.save}
          </button>
          <Link href="/app/billing" className="btn-outline block w-full text-center text-xs">
            {copy.common.manageBilling}
          </Link>
          <button className="btn-outline w-full text-xs" onClick={logout}>
            {copy.common.logout}
          </button>
          <div className="rounded-2xl border border-[var(--stroke)] bg-white p-3 text-xs">
            <p className="font-semibold">{lang === "en" ? "Notifications" : "通知"}</p>
            <div className="mt-2 space-y-2">
              {notifications.length ? (
                notifications.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl bg-[var(--bg-soft)] px-3 py-2">
                    <p className="font-medium">
                      {item.title ?? (lang === "en" ? "New update" : "新しい更新")}
                    </p>
                    <p className="text-[11px] text-muted">
                      {lang === "en" ? "Tap to view" : "詳細を見る"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-muted">
                  {lang === "en" ? "No notifications yet." : "通知はまだありません。"}
                </p>
              )}
            </div>
          </div>
          {process.env.NODE_ENV !== "production" ? (
            <div className="mt-4 rounded-2xl border border-[var(--stroke)] bg-[var(--bg-soft)] p-3 text-xs">
              <p className="font-semibold">{lang === "en" ? "Dev tools" : "開発用トグル"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-outline text-xs"
                  onClick={() => setDevPlan("free")}
                >
                  Free
                </button>
                <button
                  type="button"
                  className="btn-outline text-xs"
                  onClick={() => setDevPlan("pro")}
                >
                  Pro
                </button>
                <button
                  type="button"
                  className="btn-outline text-xs"
                  onClick={() => setDevPlan("premium")}
                >
                  Premium
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                {lang === "en"
                  ? "Local dev only. Updates your user plan in Firestore."
                  : "ローカル開発用。Firestoreのユーザー権限を更新します。"}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
