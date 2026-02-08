"use client";

import { FormEvent, useState } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import Link from "next/link";
import { clientAuth } from "@/lib/firebase-client";
import { getCopy } from "@/lib/i18n";
import { useLang } from "@/hooks/useLang";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lang = useLang();
  const copy = getCopy(lang);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await signInWithEmailAndPassword(clientAuth, email, password);
      window.location.href = "/app";
    } catch {
      setError(copy.auth.loginFailed);
    }
  }

  async function onGoogle() {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(clientAuth, provider);
      window.location.href = "/app";
    } catch {
      setError(copy.auth.googleLoginFailed);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">{copy.auth.loginTitle}</h1>
        <p className="text-sm text-muted">{copy.auth.loginSubtitle}</p>
        <button
          type="button"
          onClick={onGoogle}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[var(--stroke)] bg-white px-4 py-2 text-sm"
        >
          {copy.auth.googleLogin}
        </button>
        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-[var(--stroke)]" />
          or
          <span className="h-px flex-1 bg-[var(--stroke)]" />
        </div>
        <form className="mt-6 flex flex-col gap-4" onSubmit={onSubmit}>
          <input
            className="rounded-xl border border-[var(--stroke)] px-3 py-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="rounded-xl border border-[var(--stroke)] px-3 py-2"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button className="rounded-full bg-black px-4 py-2 text-white" type="submit">
            {copy.auth.loginButton}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted">
          {copy.auth.signupPrompt}{" "}
          <Link href="/signup" className="underline">
            {copy.auth.signupLink}
          </Link>
        </p>
      </div>
    </main>
  );
}
