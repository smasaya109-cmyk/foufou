import { cookies } from "next/headers";
import { LANG_KEY, LEGACY_LANG_KEY, normalizeLang } from "@/lib/i18n";
import LPClient from "./LPClient";

export default function Home() {
  const lang = normalizeLang(
    cookies().get(LANG_KEY)?.value ?? cookies().get(LEGACY_LANG_KEY)?.value
  );
  return <LPClient initialLang={lang} />;
}
