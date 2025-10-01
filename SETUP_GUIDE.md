# オンライン読書会システム セットアップガイド

このガイドでは、Google Calendar連携とVercelデプロイまでの完全な手順を説明します。

## 📋 **目次**

1. [Google Cloud Console設定](#1-google-cloud-console設定)
2. [サービスアカウント作成](#2-サービスアカウント作成)
3. [Google Calendar設定](#3-google-calendar設定)
4. [Gmail設定](#4-gmail設定)
5. [GitHubセットアップ](#5-githubセットアップ)
6. [Vercelデプロイ](#6-vercelデプロイ)
7. [動作確認](#7-動作確認)

---

## **1. Google Cloud Console設定**

### **Step 1: プロジェクト作成**

1. **[Google Cloud Console](https://console.cloud.google.com/)** にアクセス
2. **「新しいプロジェクト」** をクリック
3. **プロジェクト名**: `reading-group-app` （任意の名前）
4. **「作成」** をクリック
5. **プロジェクトID** をメモ（例：`reading-group-app-123456`）

### **Step 2: 必要なAPIを有効化**

1. **「APIとサービス」** > **「ライブラリ」**
2. 以下のAPIを検索して **「有効にする」**：
   - **Google Calendar API**
   - **Gmail API**

---

## **2. サービスアカウント作成**

### **Step 1: サービスアカウント作成**

1. **「IAMと管理」** > **「サービスアカウント」**
2. **「サービスアカウントを作成」**
3. **サービスアカウント名**: `reading-group-service`
4. **「作成して続行」**
5. **役割**: `編集者` を選択
6. **「完了」**

### **Step 2: JSONキーファイルの作成**

1. 作成したサービスアカウントの **メールアドレス部分をクリック**
2. **「キー」** タブをクリック
3. **「キーを追加」** > **「新しいキーを作成」**
4. **「JSON」** を選択 > **「作成」**
5. **JSONファイルがダウンロード** されます（重要：安全に保管）

### **Step 3: 必要な情報を抽出**

ダウンロードしたJSONファイルから以下の値をメモ：

```json
{
  "type": "service_account",
  "project_id": "reading-group-app-123456",          ← GOOGLE_PROJECT_ID
  "private_key_id": "abcdef123456...",               ← GOOGLE_PRIVATE_KEY_ID
  "private_key": "-----BEGIN PRIVATE KEY-----\n...", ← GOOGLE_PRIVATE_KEY
  "client_email": "reading-group-service@...",       ← GOOGLE_SERVICE_ACCOUNT_EMAIL
  "client_id": "123456789...",                       ← GOOGLE_CLIENT_ID
  ...
}
```

---

## **3. Google Calendar設定**

### **Step 1: 読書会用カレンダー作成**

1. **[Google Calendar](https://calendar.google.com/)** にアクセス
2. 左側の **「他のカレンダー」** の **「+」** をクリック
3. **「新しいカレンダーを作成」**
4. **カレンダー名**: `オンライン読書会`
5. **「カレンダーを作成」**

### **Step 2: カレンダーIDを取得**

1. 作成したカレンダーの **「⚙️設定と共有」** をクリック
2. **「カレンダーの統合」** セクションまでスクロール
3. **「カレンダーID」** をコピー
   ```
   例: abcdef123456@group.calendar.google.com
   ```

### **Step 3: サービスアカウントと共有**

1. 同じ **「設定と共有」** 画面で **「特定のユーザーとの共有」** セクション
2. **「ユーザーを追加」** をクリック
3. **サービスアカウントのメールアドレス** を入力：
   ```
   reading-group-service@your-project-id.iam.gserviceaccount.com
   ```
4. **権限**: **「変更および共有の管理権限」** を選択
5. **「送信」**

---

## **4. Gmail設定**

### **Step 1: 2段階認証の有効化**

1. **[Google Account](https://myaccount.google.com/)** にアクセス
2. **「セキュリティ」** をクリック
3. **「2段階認証プロセス」** を有効化（未設定の場合）

### **Step 2: アプリパスワードの生成**

1. **「セキュリティ」** > **「2段階認証プロセス」**
2. **「アプリパスワード」** をクリック
   - 見つからない場合：**[直接アクセス](https://myaccount.google.com/apppasswords)**
3. **アプリ名を入力**: `Reading Group App`
4. **「作成」** をクリック
5. **16文字のパスワード** をコピー（例：`abcdefghijklmnop`）

---

## **5. GitHubセットアップ**

### **Step 1: GitHubリポジトリ作成**

1. **[GitHub.com](https://github.com)** でログイン
2. **「New repository」** をクリック
3. **Repository name**: `online-reading-group`
4. **「Public」** または **「Private」** を選択
5. **「Create repository」**

### **Step 2: ローカルからプッシュ**

```bash
# Git初期化
git init
git branch -m main

# .gitignore作成とファイル追加
git add .
git commit -m "Initial commit: オンライン読書会システム"

# GitHubリポジトリと接続
git remote add origin https://github.com/YOUR_USERNAME/online-reading-group.git
git push -u origin main
```

---

## **6. Vercelデプロイ**

### **Step 1: Vercelプロジェクト作成**

1. **[vercel.com](https://vercel.com)** にログイン
2. **「New Project」** をクリック
3. **「Import Git Repository」** でGitHubを接続
4. **`online-reading-group`** リポジトリを選択
5. **「Import」**

### **Step 2: 環境変数の設定**

**Settings** > **Environment Variables** で以下を追加：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `GOOGLE_PROJECT_ID` | `reading-group-app-123456` | GoogleプロジェクトID |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `reading-group-service@...` | サービスアカウントメール |
| `GOOGLE_PRIVATE_KEY_ID` | `abcdef123456...` | プライベートキーID |
| `GOOGLE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | プライベートキー（改行含む） |
| `GOOGLE_CLIENT_ID` | `123456789...` | クライアントID |
| `CALENDAR_ID` | `abcdef@group.calendar.google.com` | カレンダーID |
| `EMAIL_USER` | `your_admin@gmail.com` | 管理者Gmailアドレス |
| `EMAIL_PASSWORD` | `abcdefghijklmnop` | Gmailアプリパスワード |
| `ORGANIZER_EMAIL` | `your_admin@gmail.com` | 管理者連絡先 |

### **環境変数設定の重要ポイント**

#### **GOOGLE_PRIVATE_KEY の設定**
- JSONファイルの `private_key` 値をそのままコピー
- 改行文字 `\n` はそのまま残す
- ダブルクォートは除く

**正しい例**:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

### **Step 3: デプロイ実行**

1. **「Deploy」** をクリック
2. デプロイ完了まで待機
3. **本番URL** を確認：
   ```
   https://online-reading-group-abc123.vercel.app
   ```

---

## **7. 動作確認**

### **Step 1: カレンダーに読書会予定を作成**

1. **Google Calendar** で読書会カレンダーを開く
2. **新しいイベント** を作成：
   - **タイトル**: `読書会: 「7つの習慣」ディスカッション`
   - **日時**: 今後の日程
   - **説明**: `課題図書について語り合いましょう`

### **Step 2: サイト動作確認**

1. **Vercelの本番URLにアクセス**
2. **予約枠が表示されることを確認**
3. **予約フォームでテスト予約**
4. **確認メールが届くことを確認**
5. **Google Meet URLが生成されることを確認**

---

## **🔧 トラブルシューティング**

### **カレンダーが表示されない**
- サービスアカウントとカレンダーの共有設定を確認
- `CALENDAR_ID` が正しいか確認

### **メール送信エラー**
- Gmailアプリパスワードが正しいか確認
- 2段階認証が有効になっているか確認

### **Vercelデプロイエラー**
- 環境変数がすべて設定されているか確認
- `GOOGLE_PRIVATE_KEY` の改行文字が正しいか確認

---

## **📞 サポート**

技術的な問題が発生した場合：

1. **Vercel Dashboard** でエラーログを確認
2. **Google Cloud Console** でAPI使用量を確認
3. **環境変数** の設定値を再確認

---

## **🎉 完成！**

これで **Google審査不要** で **即座に一般公開可能** なオンライン読書会システムが完成しました！

**主な機能**:
- ✅ Google Calendar連携による予約枠管理
- ✅ 自動予約処理とGoogle Meet URL生成
- ✅ 確認メール自動送信
- ✅ レスポンシブデザイン
- ✅ サービスアカウント方式で審査不要