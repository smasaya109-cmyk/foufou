import Link from "next/link";
import { cookies } from "next/headers";
import { LANG_KEY, LEGACY_LANG_KEY, normalizeLang } from "@/lib/i18n";

export default function Home() {
  const lang = normalizeLang(
    cookies().get(LANG_KEY)?.value ?? cookies().get(LEGACY_LANG_KEY)?.value
  );
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
          <img
            src="/foufou_mascot.png"
            alt={t("FouFouのマスコット", "FouFou mascot")}
            className="mx-auto h-20 w-20 object-contain"
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
              <img
                src={item.image}
                alt={item.alt}
                className="max-h-[600px] w-full object-contain"
              />
            </div>
          ))}
        </section>

        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-semibold">{t("料金プラン", "Pricing")}</h2>
            <p className="mt-2 text-sm text-muted">
              {t("今は無料プランで公開準備中です。", "Currently launching with the Free plan.")}
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card flex h-full flex-col p-6">
              <p className="text-sm font-semibold text-muted">{t("Freeプラン", "Free")}</p>
              <div className="mt-3 space-y-1">
                <p className="text-3xl font-extrabold">¥0</p>
                <p className="text-xs text-muted">{t("ずっと無料", "Free forever")}</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li>• {t("支払い登録・自動精算", "Expenses + settlement")}</li>
                <li>• {t("基本の割り勘", "Basic splits")}</li>
                <li>• {t("共有（支払い/精算）", "Share expenses & settlement")}</li>
              </ul>
              <span className="mt-auto inline-flex w-fit rounded-full bg-[var(--bg-soft)] px-3 py-1 text-[11px] text-[var(--ink-muted)]">
                {t("公開中", "Live")}
              </span>
            </div>
            <div className="card flex h-full flex-col border-2 border-[var(--accent)] p-6">
              <p className="text-sm font-semibold text-[var(--accent-strong)]">{t("Proプラン", "Pro")}</p>
              <div className="mt-3 space-y-2">
                <p className="text-2xl font-extrabold">{t("¥880/月", "¥880/mo")}</p>
                <p className="text-xs text-muted">{t("年払い ¥6,600/年（¥550/月相当）", "¥6,600/yr (≈¥550/mo)")}</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li>• {t("グループ作成無制限", "Unlimited groups")}</li>
                <li>• {t("高度な割り勘 + 分析", "Advanced splits + insights")}</li>
                <li>• {t("CSV出力", "CSV export")}</li>
                <li>• {t("共同編集3名まで", "Up to 3 editors")}</li>
              </ul>
              <span className="mt-auto inline-flex w-fit rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] text-[var(--accent-strong)]">
                {t("準備中", "Preparing")}
              </span>
            </div>
            <div className="card flex h-full flex-col p-6">
              <p className="text-sm font-semibold text-muted">{t("Premium", "Premium")}</p>
              <div className="mt-3 space-y-2">
                <p className="text-2xl font-extrabold">{t("¥1,480/月", "¥1,480/mo")}</p>
                <p className="text-xs text-muted">{t("年払い ¥11,880/年（¥990/月相当）", "¥11,880/yr (≈¥990/mo)")}</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-muted">
                <li>• {t("写真共有", "Photo sharing")}</li>
                <li>• {t("共同編集無制限", "Unlimited editors")}</li>
                <li>• {t("Proの全機能", "All Pro features")}</li>
              </ul>
              <span className="mt-auto inline-flex w-fit rounded-full bg-[var(--bg-soft)] px-3 py-1 text-[11px] text-[var(--ink-muted)]">
                {t("準備中", "Preparing")}
              </span>
            </div>
          </div>
        </section>

        <section className="card p-6 md:p-8">
          <h2 className="text-2xl font-semibold">{t("よくある質問", "FAQ")}</h2>
          <div className="mt-4 space-y-3">
            <details className="rounded-xl border border-[var(--stroke)] bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold">
                {t("無料プランでも精算できますか？", "Can I settle on Free?")}
              </summary>
              <p className="mt-2 text-sm text-muted">
                {t("はい。支払い登録と精算提案は無料で使えます。", "Yes. Expenses and settlement are available on Free.")}
              </p>
            </details>
            <details className="rounded-xl border border-[var(--stroke)] bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold">
                {t("共有リンクは誰でも見られますか？", "Is the share link public?")}
              </summary>
              <p className="mt-2 text-sm text-muted">
                {t("リンクを知っている人は閲覧できますが、編集はできません。", "Anyone with the link can view, but cannot edit.")}
              </p>
            </details>
            <details className="rounded-xl border border-[var(--stroke)] bg-white px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold">
                {t("有料プランはいつ使えますか？", "When will paid plans be available?")}
              </summary>
              <p className="mt-2 text-sm text-muted">
                {t("現在準備中です。公開後にアップグレードできます。", "They are in preparation and will be available soon.")}
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
            <Link href="/api/lang?lang=ja" className={`px-3 py-1 text-xs ${lang === "ja" ? "rounded-full bg-[var(--accent)] text-white" : ""}`}>
              日本語
            </Link>
            <Link href="/api/lang?lang=en" className={`px-3 py-1 text-xs ${lang === "en" ? "rounded-full bg-[var(--accent)] text-white" : ""}`}>
              English
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
