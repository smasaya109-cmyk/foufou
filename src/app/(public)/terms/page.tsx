"use client";

import { useState } from "react";
import { useLang } from "@/hooks/useLang";

type TabKey = "terms" | "privacy" | "tokusho";

export default function TermsPage() {
  const lang = useLang();
  const t = (ja: string, en: string) => (lang === "en" ? en : ja);
  const [tab, setTab] = useState<TabKey>("terms");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "terms", label: t("利用規約", "Terms") },
    { key: "privacy", label: t("プライバシーポリシー", "Privacy") },
    { key: "tokusho", label: t("特定商取引法に基づく表記", "Legal disclosure") }
  ];

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-16">
      <div className="card p-7 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">FouFou</p>
        <h1 className="section-title text-3xl">{t("FouFou利用規約", "FouFou Terms")}</h1>
        <p className="text-sm text-muted">{t("最終更新日: 2026年2月7日", "Last updated: Feb 7, 2026")}</p>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                tab === item.key
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--stroke)] bg-white text-muted"
              }`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6 space-y-5 text-sm text-muted">
        {tab === "terms" ? (
          <>
            <section className="space-y-2">
              <p>
                {t(
                  "本利用規約（以下「本規約」）は、Masaya Sasaki（以下「当社」）がFouFouおよび関連アプリケーション上で提供するサービスの利用条件を定めるものです。ユーザー（以下「お客様」）は、本規約に同意したうえで本サービスをご利用いただきます。",
                  "These Terms govern the use of FouFou and related applications provided by Masaya Sasaki (the “Company”). By using the Service, you agree to these Terms."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第1条 アカウントおよび利用資格", "1. Accounts and eligibility")}</h2>
              <p>{t("1.1 アカウント作成", "1.1 Account creation")}</p>
              <p>
                {t(
                  "当社が認めた外部IDプロバイダーを通じてアカウントを作成することで、特定の機能をご利用いただけます。パスワードによるログイン方式を導入する場合がありますが、認証情報の管理はお客様の責任で行ってください。",
                  "You may access certain features by creating an account via approved external ID providers. If password login is introduced, you are responsible for safeguarding your credentials."
                )}
              </p>
              <p>{t("1.2 過去のアカウント停止", "1.2 Prior suspension")}</p>
              <p>
                {t(
                  "過去に本規約違反等によりアカウントが停止または解約されたお客様またはその所属する組織については、当社は登録を拒否または既存アカウントの解約を行う権利を留保します。",
                  "We may refuse registration or terminate accounts that were previously suspended for violations."
                )}
              </p>
              <p>{t("1.3 情報の正確性", "1.3 Accuracy of information")}</p>
              <p>
                {t(
                  "お客様は、アカウント情報を正確かつ最新の状態に維持することに同意するものとします。",
                  "You agree to keep account information accurate and up to date."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第2条 サービスの内容", "2. Service description")}</h2>
              <p>
                {t(
                  "本サービスは、旅行やグループの支払いを記録し、負担額を自動計算して精算を支援するサービスです。閲覧共有リンクや写真共有等の機能を含みます。",
                  "The Service helps you record group travel expenses, calculate balances, and support settlements. It includes view-only sharing and photo sharing features."
                )}
              </p>
              <p>{t("無料プラン", "Free plan")}</p>
              <p>{t("無料プランでは一部機能・利用上限があります。", "The Free plan includes feature and usage limits.")}</p>
              <p>{t("有料サブスクリプションプラン", "Paid subscription plans")}</p>
              <p>
                {t(
                  "有料プランでは利用上限が緩和され、高度な割り勘や分析、共同編集、写真共有などの機能が提供されます。当社はプランの機能や条件を随時変更することがあります。",
                  "Paid plans provide expanded limits and additional features such as advanced splits, insights, collaboration, and photo sharing. We may change plan features and conditions from time to time."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第3条 サービス利用許諾", "3. License")}</h2>
              <p>
                {t(
                  "当社は、本規約に従って本サービスへのアクセスおよび利用を行う非独占的、取消可能、譲渡不可、限定的な利用許諾をお客様に付与します。",
                  "We grant you a non-exclusive, revocable, non-transferable, limited license to access and use the Service under these Terms."
                )}
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>{t("本サービスのソースコードやソフトウェアの複製・改変・リバースエンジニアリング", "Copying, modifying, or reverse engineering the Service")}</li>
                <li>{t("本サービスの再販（明示的に許可された場合を除く）", "Reselling the Service unless expressly permitted")}</li>
                <li>{t("競合製品の開発または違法目的での利用", "Using the Service to develop competing products or for illegal purposes")}</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第4条 サブスクリプション、料金および支払い", "4. Subscriptions, fees, and payments")}</h2>
              <p>
                {t(
                  "サブスクリプション料金は選択した期間（月額・年額等）ごとに前払いで請求されます。",
                  "Subscription fees are billed in advance for the selected period (monthly, yearly, etc.)."
                )}
              </p>
              <p>
                {t(
                  "現行期間終了前にキャンセルしない限り、同一期間・同額で自動更新されます。",
                  "Subscriptions renew automatically at the same price and period unless canceled before renewal."
                )}
              </p>
              <p>
                {t(
                  "決済はStripe等の第三者決済プロバイダにより行われ、当社はクレジットカード情報を保存しません。",
                  "Payments are processed by third-party providers such as Stripe; we do not store card information."
                )}
              </p>
              <p>
                {t(
                  "解約はアカウント設定から可能です。解約後も既払い期間のサービス利用は有効期限まで継続します。既払い料金は原則返金されません（法令により返金が義務付けられる場合を除きます）。",
                  "You may cancel in your account settings. Service remains active until the end of the paid period. Fees are non-refundable except where required by law."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第5条 ユーザーコンテンツおよび知的財産権", "5. User content and IP")}</h2>
              <p>
                {t(
                  "お客様が本サービス上で入力・アップロードしたデータ（支払い情報、メモ、画像等）の権利はお客様に留保されます。",
                  "You retain rights to content you input or upload (expenses, notes, images, etc.)."
                )}
              </p>
              <p>
                {t(
                  "当社は本サービス提供のために必要な範囲でのみユーザーコンテンツを取り扱います。",
                  "We use user content only as necessary to provide the Service."
                )}
              </p>
              <p>
                {t(
                  "本サービスに関するソフトウェア、UI、ロゴ、デザイン等の知的財産権は当社またはライセンサーに帰属します。",
                  "All Service-related software, UI, logos, and designs are owned by the Company or licensors."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第6条 利用規約違反行為の禁止", "6. Prohibited conduct")}</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>{t("法令または公序良俗に反する目的での利用", "Use for illegal or harmful purposes")}</li>
                <li>{t("不正アクセス、利用制限回避、複数無料アカウントの作成", "Unauthorized access, bypassing limits, or creating multiple free accounts")}</li>
                <li>{t("本サービスまたはセキュリティ機能の妨害・破壊", "Interfering with the Service or security features")}</li>
                <li>{t("第三者の権利侵害・迷惑行為", "Infringing third-party rights or harassment")}</li>
              </ul>
              <p>
                {t(
                  "当社は違反が認められた場合、コンテンツやアカウントの停止・削除を行うことがあります。",
                  "We may suspend or delete content or accounts upon violations."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第7条 プライバシー", "7. Privacy")}</h2>
              <p>{t("本サービスの利用にはプライバシーポリシーが適用されます。", "Use of the Service is subject to the Privacy Policy.")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第8条 解約およびサービス停止", "8. Termination and suspension")}</h2>
              <p>
                {t(
                  "当社はお客様が本規約に違反した場合、返金なしで利用停止またはアカウント解約を行うことができます。",
                  "We may suspend or terminate accounts without refund if you violate these Terms."
                )}
              </p>
              <p>
                {t(
                  "お客様は設定パネルからいつでも解約できます。解約によって前払い料金の返金は発生しません。",
                  "You may cancel at any time in settings; no refunds for prepaid fees."
                )}
              </p>
              <p>
                {t(
                  "解約後、当社はプライバシーポリシーおよび法令に従い、アカウント情報を削除できるものとします。",
                  "After termination, we may delete account data per the Privacy Policy and applicable laws."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第9条 免責事項", "9. Disclaimer")}</h2>
              <p>
                {t(
                  "本サービスは「現状有姿」「現状有効」で提供されます。当社は法令で許容される最大限の範囲で、明示・黙示を問わずいかなる保証も否認します。",
                  "The Service is provided “as is” and “as available.” We disclaim all warranties to the fullest extent permitted by law."
                )}
              </p>
              <p>
                {t(
                  "天災地変、通信障害、システム障害その他合理的な制御を超える事由による不履行について、当社は責任を負いません。",
                  "We are not liable for failures due to events beyond reasonable control."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第10条 責任の制限", "10. Limitation of liability")}</h2>
              <p>
                {t(
                  "当社の責任は、当該事象発生前12か月間にお客様が当社に支払った総額を上限とします。間接的・付随的・結果的損害については責任を負いません。",
                  "Our total liability is limited to the amount you paid in the 12 months before the event. We are not liable for indirect or consequential damages."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第11条 免責および補償", "11. Indemnification")}</h2>
              <p>
                {t(
                  "お客様は、本規約違反または不適切な利用から生じる請求・損害について当社を免責し、補償するものとします。",
                  "You agree to indemnify the Company from claims or damages arising from your violations or misuse."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第12条 規約変更", "12. Changes to terms")}</h2>
              <p>
                {t(
                  "当社は本規約を随時変更できるものとし、改定版を掲載し最終更新日を更新します。不利益変更の場合は合理的な方法で事前に通知します。",
                  "We may update these Terms and will revise the date. Material changes will be notified in advance by reasonable means."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第13条 通知および連絡先", "13. Notices and contact")}</h2>
              <p>{t("お問い合わせ先: info@foufou.jp", "Contact: info@foufou.jp")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第14条 準拠法", "14. Governing law")}</h2>
              <p>{t("本規約は日本法に準拠します。", "These Terms are governed by Japanese law.")}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第15条 その他", "15. Miscellaneous")}</h2>
              <p>
                {t(
                  "本規約の一部が無効となっても、その他の条項は有効に存続します。本規約はお客様と当社との完全な合意を構成します。",
                  "If any provision is held invalid, the remainder remains in effect. These Terms constitute the entire agreement."
                )}
              </p>
              <p>
                {t(
                  "本規約は日本語版と英語版で作成されています。日本居住者は日本語版が、その他の居住者は英語版が優先します。",
                  "These Terms are provided in Japanese and English. The Japanese version prevails for residents of Japan; otherwise the English version prevails."
                )}
              </p>
              <p className="text-xs">{t("最終改定日: 2026年2月8日", "Last revised: Feb 8, 2026")}</p>
            </section>
          </>
        ) : null}

        {tab === "privacy" ? (
          <>
            <section className="space-y-2">
              <p>
                {t(
                  "Masaya Sasaki（以下「当社」）は、個人情報保護法その他関連法令を遵守し、以下のプライバシーポリシー（以下「本ポリシー」）に従って、FouFouにおけるプライバシー情報の保護に努めます。",
                  "Masaya Sasaki (the “Company”) complies with applicable privacy laws and protects privacy information according to this Privacy Policy."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第1条（プライバシー情報の定義）", "1. Definitions")}</h2>
              <p>
                {t(
                  "本ポリシーにおける「プライバシー情報」とは、個人情報、履歴情報、特性情報および個人関連情報を指します。",
                  "“Privacy Information” includes personal information, usage history, device characteristics, and related identifiers."
                )}
              </p>
              <p>
                {t(
                  "「個人情報」とは、氏名、連絡先、その他の記述により特定の個人を識別できる情報をいいます。",
                  "“Personal Information” means data that can identify an individual, such as name or contact details."
                )}
              </p>
              <p>
                {t(
                  "「履歴情報・特性情報」には、利用日時、利用方法、端末情報、IPアドレス、Cookie等が含まれます。",
                  "“Usage/Device Information” includes access time, usage patterns, device info, IP addresses, cookies, etc."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第2条（収集する情報）", "2. Information we collect")}</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>{t("アカウント情報（メールアドレス、表示名など）", "Account info (email, display name, etc.)")}</li>
                <li>{t("支払い・請求に関する情報（決済プロバイダ経由）", "Payment and billing details via payment providers")}</li>
                <li>{t("ログ情報（アクセス日時、操作履歴、端末情報等）", "Log data (access time, actions, device info)")}</li>
                <li>{t("Cookie等の識別情報", "Identifiers such as cookies")}</li>
              </ul>
              <p>
                {t(
                  "当社は、利用目的の達成に必要な期間のみ情報を保持し、不要となった情報は適切に削除または匿名化します。",
                  "We retain data only as long as needed and delete or anonymize it when no longer necessary."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第3条（利用目的）", "3. Purposes of use")}</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>{t("認証・ログインのため", "Authentication and login")}</li>
                <li>{t("本サービスの提供・運営のため", "Service operation and delivery")}</li>
                <li>{t("請求・決済・サポート対応のため", "Billing, payments, and support")}</li>
                <li>{t("不正利用の防止および対応のため", "Fraud prevention and response")}</li>
                <li>{t("サービス改善・分析のため", "Service improvements and analytics")}</li>
                <li>{t("重要なお知らせ・連絡のため", "Important notices and communications")}</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第4条（安全管理措置）", "4. Security measures")}</h2>
              <p>
                {t(
                  "当社は、アクセス制御・暗号化等の技術的措置、運用ルールの整備、担当者の責任明確化など、合理的な安全管理措置を講じます。",
                  "We implement reasonable safeguards such as access controls, encryption, operational policies, and clear responsibilities."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第5条（第三者提供）", "5. Third-party disclosure")}</h2>
              <p>
                {t(
                  "当社は、法令で認められる場合を除き、本人の同意なく第三者に個人情報を提供しません。",
                  "We do not provide personal data to third parties without consent unless required by law."
                )}
              </p>
              <p>
                {t(
                  "決済処理はStripe等の決済プロバイダに委託し、当社はカード情報を保持しません。",
                  "Payments are processed by providers such as Stripe; we do not store card details."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第6条（外部サービスの利用）", "6. External services")}</h2>
              <p>{t("本サービスは以下の外部サービスを利用します。", "We use the following services.")}</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>{t("Firebase（認証・データ保管）", "Firebase (auth/data storage)")}</li>
                <li>{t("Stripe（決済）", "Stripe (payments)")}</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第7条（開示・訂正・削除）", "7. Access, correction, deletion")}</h2>
              <p>
                {t(
                  "ご本人からの請求があった場合、法令に従い適切に対応します。",
                  "We respond to requests for access, correction, or deletion as required by law."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第8条（本ポリシーの変更）", "8. Changes to this policy")}</h2>
              <p>
                {t(
                  "当社は本ポリシーを随時変更できるものとし、重要な変更がある場合は適切に通知します。",
                  "We may update this policy and will notify users of material changes."
                )}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("第9条（お問い合わせ）", "9. Contact")}</h2>
              <p>{t("お問い合わせ先: info@foufou.jp", "Contact: info@foufou.jp")}</p>
            </section>
          </>
        ) : null}

        {tab === "tokusho" ? (
          <>
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("事業者名", "Seller")}</h2>
              <p>Masaya Sasaki</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("事業者の所在", "Address")}</h2>
              <p>{t("〒759-0207 山口県宇部市大字際波2406-7", "2406-7 Sainami, Ube, Yamaguchi 759-0207, Japan")}</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("連絡先", "Contact")}</h2>
              <p>info@foufou.jp</p>
              <p className="text-xs">{t("※電話番号の開示は請求があった場合に遅滞なく行います。", "Phone number will be provided upon request without delay.")}</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("提供地域", "Service area")}</h2>
              <p>{t("海外を含む", "Worldwide")}</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("販売価格", "Pricing")}</h2>
              <p>{t("各プランの価格はサービス内の料金ページに表示します（消費税・手数料を含む表示）。", "Prices are shown on the in-app pricing page (taxes/fees included where applicable).")}</p>
              <p className="text-xs">{t("インターネット通信料金はお客様のご負担となります。", "Internet connection fees are borne by the user.")}</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("支払方法", "Payment methods")}</h2>
              <p>{t("Stripeを介したクレジットカード決済", "Credit card payments via Stripe")}</p>
              <p className="text-xs">{t("※有料プランは現在準備中です。", "Paid plans are currently in preparation.")}</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("お支払時期", "Billing timing")}</h2>
              <p>
                {t(
                  "利用料金は前払いです。初回は有料プラン登録時、以降は月または年ごとの同日に請求されます（同日がない場合は月末）。",
                  "Fees are charged in advance. The first charge occurs at subscription, then on the same day each month/year (or month-end if not available)."
                )}
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("提供時期", "Delivery timing")}</h2>
              <p>{t("決済完了後、直ちに利用可能となります。", "Available immediately after payment.")}</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-[var(--ink-strong)]">{t("返品・キャンセル", "Refunds / cancellations")}</h2>
              <p>
                {t(
                  "デジタルサービスのためお客様都合での返金・キャンセルは原則不可です。長期障害等、当社の責による場合は未提供日数分を日割りで返金します。",
                  "Digital services are non-refundable for user convenience. If long-term outages occur due to our fault, we refund on a prorated basis."
                )}
              </p>
              <p className="text-xs">
                {t(
                  "解約はマイページから次回更新日の24時間前までに行えます。解約後も当該期間の終了日まで利用可能です。",
                  "You can cancel from your account at least 24 hours before renewal; access continues until the end of the paid period."
                )}
              </p>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
