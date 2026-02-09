# FouFou
旅行の割り勘を「入力・共有・精算まで」一気通貫で完結できるWebアプリ。
Firebase + Stripe + Next.js で構成し、DuolingoテイストのUIで運用します。

---

## 構成
- Next.js (App Router) + TypeScript
- Firebase Auth / Firestore / Storage
- Stripe Checkout + Webhook
- Tailwind CSS
- Vercel

---

## 現在の仕様（要点）
### 役割・権限
- 編集権限は「編集者」と「Owner」のみ（ログイン必須）。
- 閲覧は共有リンクからログイン不要で可能（支払い/精算のみ）。
- Freeは **Ownerのみ編集**、共同編集は不可。
- Pro / Premium は **共同編集可能**（Proは3名まで、Premiumは無制限）。

### プラン
**Free**
- グループ作成：2件まで
- 支払い登録 / 自動精算
- 基本の割り勘（均等・特定メンバー）
- 共有リンク（支払い/精算の閲覧）

**Pro**
- グループ無制限
- 高度な割り勘（割合/端数/グループ別）
- 集計・分析
- CSV出力
- 共同編集 3名まで（Owner含む）

**Premium**
- 写真共有（思い出）
- 共同編集 無制限
- Proの全機能

※ グループパスは一旦スキップ運用（後で有効化可能）。

---

## 起動手順（ローカル）
```bash
npm install
npm run dev
```

---

## 環境変数（例）
### Firebase (Admin)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`（改行は `\n` でエスケープ）

### Firebase (Client)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Stripe
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_PREMIUM_MONTHLY`
- `STRIPE_PRICE_PREMIUM_YEARLY`
- `STRIPE_PRICE_GROUP_PASS`（スキップ中）

### App
- `APP_BASE_URL`（本番URL）
- `NEXTAUTH_URL`（本番URL）

---

## Stripe設定（本番）
### Webhook
エンドポイント：
```
https://<domain>/api/webhooks/stripe
```
イベント：
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 価格
StripeのPrice IDを `.env` / Vercel に登録。

---

## Firebase設定（本番）
**Authentication → Settings → Authorized domains**  
本番ドメインを必ず追加。

**Storage**  
必要に応じてCORS設定（本番でのアップロード用）。

---

## デプロイ（Vercel）
1. GitHub連携でプロジェクト作成  
2. Environment Variablesを追加  
3. Deploy  
4. `NEXTAUTH_URL` / `APP_BASE_URL` を本番URLに更新  
5. 再デプロイ

---

## セキュリティ・運用チェックリスト
- [ ] Firebase Authorized domains に本番追加済み
- [ ] Stripe Webhook Secret を Vercel に登録済み
- [ ] `.env` がGit管理から除外されている
- [ ] Firestore / Storage Rules を本番用に見直し
- [ ] Webhookの署名検証が有効
- [ ] 本番環境変数に `APP_BASE_URL` / `NEXTAUTH_URL` を設定

---

## これからの流れ（推奨）
1. 本番Stripe決済の動作確認（Pro / Premium）
2. Webhookイベントの本番テスト送信
3. Firebase/Storageルールの再点検
4. Vercel Analytics / Error監視の導入（任意）
5. 料金・プランの文言調整（必要に応じて）

---

## 注意点
- `.env` はGitに含めない  
- 共有リンクは閲覧専用で、編集は不可  
- Freeのアーカイブはダミー表示（Pro以上で解放）
