import "./globals.css";
import { cookies } from "next/headers";
import { LANG_KEY, LEGACY_LANG_KEY, normalizeLang } from "@/lib/i18n";

export const metadata = {
  title: "FouFou",
  description: "Group travel expense splitting",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const lang = normalizeLang(
    cookieStore.get(LANG_KEY)?.value ?? cookieStore.get(LEGACY_LANG_KEY)?.value
  );
  return (
    <html lang={lang}>
      <body className="min-h-screen bg-white text-neutral-900">{children}</body>
    </html>
  );
}
