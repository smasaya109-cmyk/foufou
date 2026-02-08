"use client";

import { useLang, setLangClient } from "@/hooks/useLang";

export default function LangToggle() {
  const lang = useLang();
  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={() => setLangClient("ja")}
        className={`rounded-full px-3 py-1 ${
          lang === "ja" ? "bg-[var(--accent)] text-white" : "text-muted"
        }`}
      >
        日本語
      </button>
      <button
        type="button"
        onClick={() => setLangClient("en")}
        className={`rounded-full px-3 py-1 ${
          lang === "en" ? "bg-[var(--accent)] text-white" : "text-muted"
        }`}
      >
        English
      </button>
    </div>
  );
}
