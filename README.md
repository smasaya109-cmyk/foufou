# TripSplitWeb MVP (Firebase + Vercel)

旅行の割り勘を「グループで共有・入力」し、精算まで完結できるWebアプリのMVP実装です。
UIは最小限の骨組みに留め、API/データモデル/認可ロジックを先に固めています。

## 構成
- Next.js (App Router) + TypeScript
- Firebase Auth + Firestore
- Stripe Checkout + Webhook
- Tailwind (最低限のスタイル)

## 進捗概要
- Firebase Auth/Firestore 前提へ切替
- RBAC (`requireGroupRole`) と `canUsePremium` を用意
- グループ作成制限 (Ownerアクティブ3件)
- 招待リンク作成 / 消費 (Viewer参加)
- 支払い登録・更新・削除 (監査ログ)
- 精算計算・確定・解除 (ロック連動)
- 所有権移譲 (申請→承諾)
- 共有トークン回転
- Stripe Checkout/Webhook (Pro / Group Pass) 最小実装

## セットアップ
1) 依存インストール
```bash
npm install
```

2) Firebase Admin SDK 設定（サービスアカウント）
`.env.example` を元に `.env` を作成し以下を設定します。
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`（改行は `\n` でエスケープ）

3) Firebase Web SDK 設定（公開キー）
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

4) Stripe 設定
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_*`

5) 開発サーバー起動
```bash
npm run dev
```

## 認証
- Firebase Auth の Email/Password を使用
- API には `Authorization: Bearer <Firebase ID Token>` を付与

## 権限 / エンタイトルメント
- `requireGroupRole(groupId, role)` で RBAC
- `canUsePremium(userId, groupId) = userProActive OR groupPassActive`
- パス無しでEditor化するには **Proユーザーである必要**
- グループパス有効時は全員がPro相当機能
- グループパス有効時は人数上限 20 (招待消費時に制限)

## Firestore データ構造（概要）
- `users/{userId}`
- `groups/{groupId}`
  - `members/{userId}`
  - `invites/{inviteId}`
  - `expenses/{expenseId}` (splits は配列で保持)
  - `settlements/{settlementId}`
  - `passes/{passId}`
  - `ownershipTransfers/{transferId}`
  - `auditLogs/{logId}`

## API一覧（MVP）
### Groups
- `GET /api/groups`
- `POST /api/groups` (Ownerアクティブ3件制限)
- `GET /api/groups/:groupId`
- `PATCH /api/groups/:groupId/settings`
- `POST /api/groups/:groupId/share/rotate`

### Invites
- `POST /api/groups/:groupId/invites`
- `POST /api/invites/:token/consume`

### Members
- `GET /api/groups/:groupId/members`
- `PATCH /api/groups/:groupId/members` (Ownerのみ)
- `DELETE /api/groups/:groupId/members` (Ownerのみ)

### Expenses
- `GET /api/groups/:groupId/expenses`
- `POST /api/groups/:groupId/expenses`
- `PATCH /api/expenses/:expenseId`
- `DELETE /api/expenses/:expenseId`

### Settlements
- `POST /api/groups/:groupId/settlements/compute`
- `GET /api/groups/:groupId/settlements/latest`
- `POST /api/groups/:groupId/settlements/finalize`
- `POST /api/groups/:groupId/settlements/unfinalize`

### Ownership
- `POST /api/groups/:groupId/ownership/transfer`
- `POST /api/ownership/accept`

### Billing / Webhook
- `POST /api/billing/pro/checkout`
- `POST /api/billing/group-pass/checkout`
- `POST /api/webhooks/stripe`

## 監査ログ
以下の操作で `auditLogs` に記録:
- 支払い作成/更新/削除
- ロール変更/メンバー削除
- Ownership transfer
- 精算確定/解除

## 精算ロジック
- `paid - owed = net`
- creditors/debtors を貪欲マッチングして送金回数削減

## 共有リンク
- `/share/[token]` で閲覧
- 個人情報はマスク表示
- Ownerがトークン再生成可能

## UIについて
UIは最小限の骨組みのみ実装。今後のUI確定後に拡張予定。

## 次の拡張候補
- OCR/Receipt
- 高度な割り勘 (ratio/subgroup/端数)
- 多通貨/為替
- PDF/CSV出力
- 通知 (アプリ内 + メール)
