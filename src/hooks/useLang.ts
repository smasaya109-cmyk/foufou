"use client";

import { useEffect, useState } from "react";
import { LANG_KEY, LEGACY_LANG_KEY, normalizeLang, type Lang } from "@/lib/i18n";

function readLang(): Lang {
  if (typeof window === "undefined") return "ja";
  const stored = localStorage.getItem(LANG_KEY) ?? localStorage.getItem(LEGACY_LANG_KEY);
  return normalizeLang(stored);
}

export function useLang() {
  const [lang, setLang] = useState<Lang>("ja");

  useEffect(() => {
    setLang(readLang());
    const handler = () => setLang(readLang());
    window.addEventListener("storage", handler);
    window.addEventListener("foufou-lang-change", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("foufou-lang-change", handler);
    };
  }, []);

  return lang;
}

export function setLangClient(value: Lang) {
  const normalized = normalizeLang(value);
  if (typeof window === "undefined") return;
  localStorage.setItem(LANG_KEY, normalized);
  localStorage.setItem(LEGACY_LANG_KEY, normalized);
  document.cookie = `${LANG_KEY}=${normalized}; path=/; max-age=31536000`;
  window.dispatchEvent(new Event("foufou-lang-change"));
}

