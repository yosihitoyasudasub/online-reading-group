# Vercelデプロイガイド

## 事前準備

### 1. Vercel CLIのインストール
```bash
npm i -g vercel
```

### 2. Vercelにログイン
```bash
vercel login
```

## デプロイ手順

### 1. 環境変数の設定

Vercelダッシュボードまたはコマンドラインで以下の環境変数を設定：

```bash
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_REDIRECT_URI
vercel env add GOOGLE_REFRESH_TOKEN
vercel env add CALENDAR_ID
vercel env add EMAIL_USER
vercel env add ORGANIZER_EMAIL
```

または、Vercelダッシュボードの「Settings」→「Environment Variables」で設定

### 2. プロジェクトのデプロイ

```bash
# 初回デプロイ
vercel

# プロダクション環境へデプロイ
vercel --prod
```

### 3. カスタムドメインの設定（オプション）

Vercelダッシュボードの「Domains」セクションでカスタムドメインを追加

## 環境変数の詳細

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 クライアントID | `123456789-abcdef.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 クライアントシークレット | `GOCSPX-abcdef123456` |
| `GOOGLE_REDIRECT_URI` | リダイレクトURI（本番環境用） | `https://yourdomain.vercel.app/auth/callback` |
| `GOOGLE_REFRESH_TOKEN` | Google OAuth 2.0 リフレッシュトークン | `1//04abcdef...` |
| `CALENDAR_ID` | Google Calendar ID | `abcdef@group.calendar.google.com` |
| `EMAIL_USER` | 送信用Gmailアドレス | `your-email@gmail.com` |
| `ORGANIZER_EMAIL` | 管理者メールアドレス | `organizer@example.com` |

## Google Cloud Console設定

### 1. OAuth 2.0設定の更新

本番環境のURLをGoogle Cloud Consoleの認証済みリダイレクトURIに追加：
- `https://yourdomain.vercel.app/auth/callback`

### 2. Calendar APIとGmail API有効化の確認

以下のAPIが有効になっていることを確認：
- Google Calendar API
- Gmail API

## トラブルシューティング

### デプロイエラー

1. **環境変数未設定エラー**
   - Vercelダッシュボードで環境変数が正しく設定されているか確認

2. **API認証エラー**
   - Google Cloud ConsoleでリダイレクトURIが正しく設定されているか確認
   - リフレッシュトークンの有効期限を確認

3. **ビルドエラー**
   - `package.json`の依存関係が正しいか確認
   - Node.jsバージョンの互換性を確認

### 本番環境での動作確認

1. カレンダー表示の確認
2. 予約フォームの動作確認
3. メール送信の確認
4. Google Meet URL生成の確認

## ファイル構成（Vercel対応）

```
├── index.html          # メインページ
├── style.css           # スタイルシート
├── script.js           # フロントエンドJS
├── calendar.js         # Calendar連携
├── api/
│   └── reservations.js # Serverless関数
├── vercel.json         # Vercel設定
├── .vercelignore       # デプロイ除外ファイル
├── package.json        # 依存関係
└── DEPLOYMENT.md       # このファイル
```

## 継続的デプロイ

GitHubリポジトリと連携すると、プッシュ時に自動デプロイされます：

1. Vercelダッシュボードで「Import Project」
2. GitHubリポジトリを選択
3. 環境変数を設定
4. デプロイ開始

以降、`main`ブランチへのプッシュで自動デプロイが実行されます。