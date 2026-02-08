"use client";

import Link from "next/link";
import Image from "next/image";
import LangToggle from "@/components/common/LangToggle";
import { useLang } from "@/hooks/useLang";
import type { Lang } from "@/lib/i18n";

type Props = {
  initialLang: Lang;
};

export default function LPClient({ initialLang }: Props) {
  const lang = useLang(initialLang);
  const t = (ja: string, en: string) => (lang === "en" ? en : ja);
  const highlights = [
    {
      title: t("リアルタイムで共有", "Real-time updates"),
      desc: t("支払いを追加すると、精算結果がすぐに更新されます。", "Settlements update the moment expenses are added.")
    },
    {
      title: t("みんなで入力", "Easy collaboration"),
      desc: t("共同編集で入力の手間を分散。Ownerはまとめるだけ。", "Split the work across editors.")
    },
    {
      title: t("すぐに精算", "Settle fast"),
      desc: t("送金回数を減らす提案で、終わりが早い。", "Reduce transfers with smart suggestions.")
    }
  ];
  const sections = [
    {
      title: t("同期は数秒で完了", "Sync in seconds"),
      desc: t(
        "支払いを追加すると、全員の画面に即反映。旅行中のやり取りが減り、誰が何を払ったかがその場で共有されます。",
        "Add an expense once and everyone sees it instantly. Less back-and-forth, clearer decisions."
      ),
      image: "/feature-sync.png",
      alt: t("同期を説明する画面", "Sync feature preview")
    },
    {
      title: t("誰が払ったか一目で", "Everyone knows who paid"),
      desc: t(
        "支払い一覧が見やすく並ぶので、状況をすぐ把握できます。精算提案も自動で出るため、話し合いの負担を最小限に。",
        "A clean list makes the current situation obvious. Auto settlement suggestions reduce discussion time."
      ),
      image: "/feature-paid.png",
      alt: t("支払い一覧の画面", "Expense list preview")
    },
    {
      title: t("閲覧共有リンク", "View-only sharing"),
      desc: t(
        "ログイン不要で共有できるため、参加者への連絡がスムーズです。閲覧専用なので、誤って編集される心配もありません。",
        "Share without login for quick updates. View-only access keeps everything safe from accidental edits."
      ),
      image: "/feature-paid.png",
      alt: t("共有リンクの画面", "Share link preview")
    }
  ];
  return (
    <main className="bg-[var(--bg-surface)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-6 py-16">
        <section className="space-y-10 text-center">
          <Image
            src="/foufou_mascot.webp"
            alt={t("FouFouのマスコット", "FouFou mascot")}
            width={80}
            height={80}
            className="mx-auto object-contain"
            priority
          />
          <div className="space-y-4">
            <p className="pill mx-auto w-fit bg-[var(--accent)] text-white">FouFou</p>
            <h1 className="text-4xl font-semibold md:text-5xl">
              {t("旅行の割り勘を即完結！", "Split trip expenses fast!")}
            </h1>
            <p className="text-lg text-muted">
              {t(
                "入力・共有・精算まで一気通貫。旅行中のやり取りを減らして、精算まで気持ちよく。",
                "Capture, share, and settle with less back-and-forth."
              )}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/login" className="btn-primary">
                {t("グループを作成", "Create a group")}
              </Link>
              <Link href="/signup" className="btn-outline">
                {t("無料で試す", "Try free")}
              </Link>
            </div>
            <p className="text-xs text-muted">
              {t("ボタンを押すとログイン画面へ移動します。", "Tapping the button takes you to login.")}
            </p>
          </div>
          <img
            src="/hero-app.png"
            alt={t("アプリ画面のプレビュー", "App preview")}
            className="mx-auto -mt-2 max-h-[864px] w-full max-w-[72rem] object-contain"
          />
          <div className="mt-2 flex justify-center">
            <Link href="/login" className="btn-primary">
              {t("グループを作成する", "Create a group")}
            </Link>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {highlights.map((feature) => (
            <div key={feature.title} className="card p-6">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.desc}</p>
            </div>
          ))}
        </section>

        <section className="space-y-10">
          {sections.map((item, index) => (
            <div
              key={item.title}
              className={`grid items-center gap-8 lg:grid-cols-[1fr_1fr] ${
                index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {t("ポイント", "Highlight")}
                </p>
                <h3 className="text-2xl font-semibold">{item.title}</h3>
                <p className="text-sm text-muted">{item.desc}</p>
              </div>
              <img src={item.image} alt={item.alt} className="w-full max-w-[520px] object-contain" />
            </div>
          ))}
        </section>

        <section className="space-y-8">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              {t("料金プラン", "Pricing")}
            </p>
            <h2 className="text-3xl font-semibold">{t("自分に合ったプランを選択", "Pick your plan")}</h2>
            <p className="mt-2 text-sm text-muted">
              {t("料金プランは準備中です。", "Pricing is being prepared.")}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="card p-6">
              <h3 className="font-semibold">Free</h3>
              <p className="mt-2 text-3xl font-semibold">¥0</p>
              <p className="text-sm text-muted">{t("公開中", "Available")}</p>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold">Pro</h3>
              <p className="mt-2 text-3xl font-semibold">¥880</p>
              <p className="text-sm text-muted">{t("準備中", "Coming soon")}</p>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold">Premium</h3>
              <p className="mt-2 text-3xl font-semibold">¥1,480</p>
              <p className="text-sm text-muted">{t("準備中", "Coming soon")}</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">FAQ</p>
            <h2 className="text-3xl font-semibold">{t("よくある質問", "FAQ")}</h2>
          </div>
          <div className="space-y-3">
            <details className="card p-5">
              <summary className="cursor-pointer font-semibold">
                {t("無料プランでも精算できますか？", "Can I settle with the free plan?")}
              </summary>
              <p className="mt-2 text-sm text-muted">
                {t("はい。支払い登録と精算は無料で使えます。", "Yes. Expenses and settlements are available on free.")}
              </p>
            </details>
            <details className="card p-5">
              <summary className="cursor-pointer font-semibold">
                {t("共有リンクは誰でも見られますか？", "Is the share link public?")}
              </summary>
              <p className="mt-2 text-sm text-muted">
                {t("URLを知っている人だけが閲覧できます。編集はできません。", "Anyone with the link can view it. Editing is blocked.")}
              </p>
            </details>
            <details className="card p-5">
              <summary className="cursor-pointer font-semibold">
                {t("有料プランはいつ使えますか？", "When will paid plans be available?")}
              </summary>
              <p className="mt-2 text-sm text-muted">
                {t("準備中です。公開後にアップグレードできます。", "They are in preparation and will be available soon.")}
              </p>
            </details>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-4 border-t border-[var(--stroke)] pt-6 text-xs text-muted md:flex-row">
          <p>© 2026 FouFou</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/terms" className="hover:text-[var(--ink-strong)]">
              {t("利用規約", "Terms")}
            </Link>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[var(--stroke)] bg-white px-2 py-1">
            <LangToggle />
          </div>
        </footer>
      </div>
    </main>
  );
}
