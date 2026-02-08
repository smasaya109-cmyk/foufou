import "./globals.css";
import { Inter, Noto_Sans_JP } from "next/font/google";
import { cookies } from "next/headers";
import { LANG_KEY, LEGACY_LANG_KEY, normalizeLang } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-jp",
  weight: ["400", "500", "700"]
});

export const metadata = {
  title: "FouFou",
  description: "Group travel expense splitting"
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
    <html lang={lang} className={`${inter.variable} ${notoSansJp.variable}`}>
      <body className="min-h-screen bg-white text-neutral-900">{children}</body>
    </html>
  );
}
