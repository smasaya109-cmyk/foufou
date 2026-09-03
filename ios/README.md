# FouFou iOS

既存の Web アプリ（Next.js, `../src`）はそのままに、同じバックエンド（`/api/*` + Firebase Auth）を使う
ネイティブ iOS アプリです。SwiftUI / iOS 17+ / 外部依存なし。

## 構成
- `FouFou/Services/AuthService.swift` — Firebase Auth REST（メール/パスワード）。ID トークンを Keychain に保存し自動リフレッシュ。
- `FouFou/Services/APIClient.swift` — 既存 API を `Authorization: Bearer <idToken>` で呼び出し。
- `FouFou/Services/GroupsStore.swift`, `GroupStore.swift` — 画面状態（@Observable）。
- `FouFou/Features/**` — ログイン / グループ一覧・作成 / 支払い・精算・メンバー・分析・思い出・設定 / アカウント / プラン。
- `FouFou/Core/**` — テーマ（globals.css と同じ配色）、i18n（ja/en）、カテゴリ・通貨・日付/金額フォーマッタ。

## セットアップ
```bash
brew install xcodegen          # 未インストールの場合
cp Config/Secrets.example.xcconfig Config/Secrets.xcconfig   # 値を埋める（.env の NEXT_PUBLIC_FIREBASE_* と同じ）
xcodegen generate
open FouFou.xcodeproj
```
`Secrets.xcconfig` と `*.xcodeproj` は git 管理外です（`ios/.gitignore`）。

ローカルの Next.js（`npm run dev`）に向ける場合は `API_BASE_URL = http:$()//localhost:3000` に変更してください。

## メモ
- 課金（Stripe）は Web 側で行い、アプリからは `foufou.jp/app/subscription` を開きます。
  App Store 審査（ガイドライン 3.1.1）対応が必要になる場合は StoreKit 化を検討してください。
- Google ログイン: Firebase/GoogleSignIn SDK なしで OAuth(PKCE) + `accounts:signInWithIdp` を使用（`Services/GoogleSignIn.swift`）。
  有効化するには Firebase コンソール > プロジェクト設定 > 「アプリを追加」> iOS（バンドル ID `jp.foufou.ios`）で
  `GoogleService-Info.plist` を取得し、その `CLIENT_ID` を `Config/Secrets.xcconfig` の `GOOGLE_IOS_CLIENT_ID` に設定します。
  未設定の間はボタンが無効表示になります。
- 写真アップロードは Firebase Storage REST（`groups/{groupId}/photos/…`）を使い、Web と同じパスに保存します。
