# オンライン読書会 ランディングページ

Google Calendar連携とGoogle Meet自動生成機能を持つ読書会予約システムです。

## 機能

- **読書会告知**: 開催予定の読書会一覧表示
- **予約システム**: Google Calendar連携による予約枠管理
- **自動メール送信**: 予約確認とGoogle Meet URL送信
- **過去資料アーカイブ**: 過去の読書会資料へのアクセス

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env`にコピーし、必要な値を設定してください：

```bash
cp .env.example .env
```

### 3. Google API設定

#### Google Cloud Console設定
1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクトを作成
2. Calendar API と Gmail API を有効化
3. OAuth 2.0 認証情報を作成
4. リダイレクトURIに `http://localhost:3000/auth/callback` を追加

#### 環境変数に必要な値
- `GOOGLE_CLIENT_ID`: OAuth 2.0 クライアント ID
- `GOOGLE_CLIENT_SECRET`: OAuth 2.0 クライアントシークレット
- `GOOGLE_REFRESH_TOKEN`: リフレッシュトークン
- `CALENDAR_ID`: 読書会用のGoogle Calendar ID
- `EMAIL_USER`: Gmail アドレス（送信用）
- `ORGANIZER_EMAIL`: 管理者のメールアドレス

## 起動方法

### 開発環境
```bash
npm run dev
```

### 本番環境
```bash
npm start
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## ファイル構成

```
├── index.html          # メインHTML
├── style.css           # スタイルシート
├── script.js           # フロントエンドJavaScript
├── calendar.js         # Google Calendar連携
├── server.js           # Express サーバー
├── package.json        # 依存関係
├── .env.example        # 環境変数のテンプレート
├── .env               # 環境変数（作成が必要）
└── README.md          # このファイル
```

## 使用方法

### 管理者向け

1. Google Calendarで読書会イベントを作成
2. イベントタイトルに「読書会」を含める
3. イベント説明に課題図書の情報を記載

### ユーザー向け

1. トップページで読書会の予約枠を確認
2. 参加したい日時を選択
3. 必要情報を入力して予約
4. 確認メールでGoogle Meet URLを受信

## カスタマイズ

### スタイル変更
`style.css` で色やレイアウトを調整できます。

### メールテンプレート変更
`server.js` の `sendConfirmationEmail` 関数でメール内容を編集できます。

### Calendar連携調整
`calendar.js` で表示する予約枠の条件を変更できます。

## トラブルシューティング

### Google API認証エラー
- Client IDとClient Secretが正しく設定されているか確認
- リフレッシュトークンが有効か確認
- APIが有効化されているか確認

### メール送信エラー
- Gmail の2段階認証が有効になっているか確認
- アプリパスワードを使用しているか確認

### Calendar表示されない
- Calendar IDが正しいか確認
- カレンダーが公開設定になっているか確認