"use client";

import { useLang } from "@/hooks/useLang";

export default function DescriptionPage() {
  const lang = useLang();
  const t = (ja: string, en: string) => (lang === "en" ? en : ja);
  return (
    <div className="space-y-8">
      <div className="card p-7 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Guide</p>
        <h1 className="section-title text-3xl">{t("ガイド", "Guide")}</h1>
        <p className="text-sm text-muted">
          {t("アプリの使い方・特徴をまとめます。", "How to use the app and its features.")}
        </p>
      </div>
      <div className="card p-6 space-y-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] text-sm">
            📌
          </span>
          <p className="text-lg font-semibold">{t("目次", "Contents")}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <a href="#overview" className="text-[var(--accent-strong)] hover:underline">
            {t("1. はじめに", "1. Introduction")}
          </a>
          <a href="#flow" className="text-[var(--accent-strong)] hover:underline">
            {t("2. 基本の流れ", "2. Basic flow")}
          </a>
          <a href="#features" className="text-[var(--accent-strong)] hover:underline">
            {t("3. 機能一覧（プラン別）", "3. Features by plan")}
          </a>
          <a href="#details" className="text-[var(--accent-strong)] hover:underline">
            {t("4. 各機能の詳細", "4. Feature details")}
          </a>
          <a href="#mechanism" className="text-[var(--accent-strong)] hover:underline">
            {t("5. このアプリの仕組み", "5. How it works")}
          </a>
          <a href="#roles" className="text-[var(--accent-strong)] hover:underline">
            {t("6. 編集権限について", "6. Editing permissions")}
          </a>
          <a href="#tips" className="text-[var(--accent-strong)] hover:underline">
            {t("7. おすすめの使い方", "7. Tips")}
          </a>
        </div>
      </div>
      <div className="space-y-8 text-sm">
        <div id="overview" className="card p-6 space-y-3 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] text-sm">
              👋
            </span>
            <p className="text-lg font-semibold">{t("はじめに", "Introduction")}</p>
          </div>
          <p className="text-sm text-muted">
            {t(
              "FouFouは、旅行の支払いをまとめて精算まで完結できる割り勘アプリです。",
              "FouFou helps you track trip expenses and settle them in one place."
            )}
          </p>
          <p className="text-sm text-muted">
            {t("支払いを追加すると精算が自動で更新されます。", "Settlements update automatically when you add expenses.")}
          </p>
        </div>

        <div id="flow" className="card p-6 space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] text-sm">
              🧭
            </span>
            <p className="text-lg font-semibold">{t("基本の流れ", "Basic flow")}</p>
          </div>
          <ol className="space-y-3">
            {[
              {
                title: t("1. グループ作成", "1. Create a group"),
                body: t("Freeは2グループまで作成できます。", "Free lets you create up to 2 groups.")
              },
              {
                title: t("2. 支払い追加", "2. Add expenses"),
                body: t("金額・支払者・対象を入力します。", "Enter amount, payer, and participants.")
              },
              {
                title: t("3. 精算確認", "3. Check settlement"),
                body: t("送金提案が自動で表示されます。", "Transfer suggestions are generated automatically.")
              },
              {
                title: t("4. 共有", "4. Share"),
                body: t("閲覧用リンクで共有できます。", "Share a view-only link.")
              }
            ].map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-strong)]">
                  {item.title.split(".")[0]}
                </span>
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div id="features" className="card p-6 space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] text-sm">
              🧩
            </span>
            <p className="text-lg font-semibold">{t("機能一覧", "Features")}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Free</p>
              <ul className="space-y-1 text-sm text-muted">
                <li>{t("・支払い登録と自動精算", "• Expenses + auto settlement")}</li>
                <li>{t("・均等 / 特定メンバー割り", "• Equal / selected member splits")}</li>
                <li>{t("・支払い/精算の共有", "• Share expenses & settlement")}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Pro</p>
              <ul className="space-y-1 text-sm text-muted">
                <li>{t("・高度な割り勘ルール", "• Advanced splits")}</li>
                <li>{t("・集計 / 分析", "• Insights & reports")}</li>
                <li>{t("・CSV出力", "• CSV export")}</li>
                <li>{t("・共同編集3名まで", "• Up to 3 editors")}</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Premium</p>
              <ul className="space-y-1 text-sm text-muted">
                <li>{t("・写真共有（思い出）", "• Photo sharing")}</li>
                <li>{t("・共同編集無制限", "• Unlimited editors")}</li>
                <li>{t("・Proの全機能", "• All Pro features")}</li>
              </ul>
            </div>
          </div>
        </div>

        <div id="details" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] text-sm">
              🧪
            </span>
            <p className="text-lg font-semibold">{t("各機能の詳細", "Feature details")}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-5">
              <p className="font-semibold">{t("支払い登録（Free）", "Expense entry (Free)")}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>{t("・支払いタブの「＋」をタップ", "• Tap + in the Expenses tab")}</li>
                <li>{t("・金額 / 支払者 / 対象を入力", "• Enter amount, payer, and participants")}</li>
                <li>{t("・保存で一覧に反映", "• Save to update the list")}</li>
              </ul>
            </div>

            <div className="card p-5">
              <p className="font-semibold">{t("自動精算（Free）", "Auto settlement (Free)")}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>{t("・支払い保存で精算タブが自動更新", "• Settlement updates on save")}</li>
                <li>{t("・「A → B」で送金提案を表示", "• Shows transfer suggestions as A → B")}</li>
              </ul>
            </div>

            <div className="card p-5">
              <p className="font-semibold">{t("共有リンク（Free）", "Share link (Free)")}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>{t("・設定タブ → 閲覧専用リンク", "• Settings → View-only link")}</li>
                <li>{t("・支払い/精算はログイン不要で閲覧", "• View expenses & settlement without login")}</li>
                <li>{t("・Premiumなら思い出も閲覧可能", "• Premium adds photo access")}</li>
              </ul>
            </div>

            <div className="card p-5">
              <p className="font-semibold">{t("高度な割り勘（Pro）", "Advanced splits (Pro)")}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>{t("・支払い追加 → 割り勘設定", "• Add expense → set split")}</li>
                <li>{t("・割合 / 端数 / グループ別に対応", "• Ratios, rounding, and subgroups")}</li>
                <li>{t("・例：先輩60%・後輩40%", "• Example: 60% / 40%")}</li>
              </ul>
            </div>

            <div className="card p-5">
              <p className="font-semibold">{t("集計・分析（Pro）", "Insights (Pro)")}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>{t("・分析タブでカテゴリ比率を見る", "• See category ratios")}</li>
                <li>{t("・日別推移で使いすぎを確認", "• Check daily trends")}</li>
                <li>{t("・次回の見積もりにも便利", "• Useful for next trip estimates")}</li>
              </ul>
            </div>

            <div className="card p-5">
              <p className="font-semibold">{t("CSV出力（Pro）", "CSV export (Pro)")}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>{t("・支払いと精算を1ファイルで出力", "• Export expenses + settlement in one file")}</li>
                <li>{t("・会計の共有や保管に便利", "• Useful for sharing and records")}</li>
              </ul>
            </div>

            <div className="card p-5">
              <p className="font-semibold">{t("共同編集（Pro）", "Collaboration (Pro)")}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>{t("・設定タブで編集者を追加", "• Add editors in Settings")}</li>
                <li>{t("・最大3名まで（Owner含む）", "• Up to 3 editors including owner")}</li>
              </ul>
            </div>

            <div className="card p-5">
              <p className="font-semibold">{t("写真共有（Premium）", "Photo sharing (Premium)")}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>{t("・写真タブで共有", "• Share in the Photos tab")}</li>
                <li>{t("・旅行の記録をまとめて保存", "• Keep trip memories together")}</li>
                <li>{t("・閲覧リンクからもDL可能", "• Download from share link")}</li>
              </ul>
            </div>

            <div className="card p-5">
              <p className="font-semibold">{t("共同編集無制限（Premium）", "Unlimited editors (Premium)")}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>{t("・編集者の人数制限なし", "• No editor limit")}</li>
                <li>{t("・大人数の旅行に最適", "• Best for large trips")}</li>
              </ul>
            </div>
          </div>
        </div>

        <div id="mechanism" className="card p-6 space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] text-sm">
              ⚙️
            </span>
            <p className="text-lg font-semibold">{t("このアプリの仕組み", "How it works")}</p>
          </div>
          <div className="space-y-3 text-sm text-muted">
            <p>{t("① 支払いと負担を分けて登録します。", "1) Track who paid and who owes separately.")}</p>
            <p>{t("② 差額を自動計算し、送金提案を表示します。", "2) We calculate balances and show transfer suggestions.")}</p>
            <p>{t("③ 共有リンクは閲覧専用です（編集はログイン後）。", "3) Share links are view-only; editing needs login.")}</p>
          </div>
        </div>

        <div id="roles" className="card p-6 space-y-2 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] text-sm">
              🔐
            </span>
            <p className="text-lg font-semibold">{t("編集権限について", "Editing permissions")}</p>
          </div>
          <p>{t("・Ownerは常に編集できます。", "• Owners can always edit.")}</p>
          <p>
            {t(
              "・編集者の追加は、OwnerがPro / Premiumの場合のみ可能です。",
              "• Adding editors requires the owner to be Pro or Premium."
            )}
          </p>
          <p>
            {t(
              "・Proは最大3名まで、Premiumは無制限で共同編集できます。",
              "• Pro allows up to 3 editors; Premium is unlimited."
            )}
          </p>
          <p>{t("・共有リンクは閲覧専用です。", "• Share links are view-only.")}</p>
        </div>

        <div id="tips" className="card p-6 space-y-2 scroll-mt-24">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] text-sm">
              💡
            </span>
            <p className="text-lg font-semibold">{t("おすすめの使い方", "Tips")}</p>
          </div>
          <p>{t("・少人数の旅行はFreeで十分。", "• Free is great for small trips.")}</p>
          <p>{t("・共同編集や分析が必要ならPro。", "• Pro for collaboration and insights.")}</p>
          <p>{t("・写真共有や大人数の共同編集はPremium。", "• Premium for photos and large teams.")}</p>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--stroke)] bg-white p-3">
            <img src="/foufou_mascot.png" alt="" className="h-10 w-10 object-contain" />
            <p className="text-sm text-muted">
              {t(
                "プラン選びに迷ったら、まずはFreeから試してみましょう。",
                "Not sure which plan? Start with Free."
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
