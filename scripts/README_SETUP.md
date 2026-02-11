# Google Spreadsheet 自動行追加セットアップ

## 必要なもの
1. Google Cloud Projectでサービスアカウント作成
2. サービスアカウントのJSON認証情報
3. スプレッドシートへの編集権限付与

## セットアップ手順

### 1. サービスアカウント作成
```bash
# Google Cloud Consoleで：
# 1. プロジェクト作成（またはnullを選択）
# 2. APIとサービス > 認証情報 > サービスアカウント作成
# 3. JSONキーをダウンロード
# 4. ~/.openclaw/google-credentials.json として保存
```

### 2. スプレッドシートに権限付与
```
サービスアカウントのメールアドレス（例: crypto-bot@project.iam.gserviceaccount.com）を
スプレッドシートの共有設定で「編集者」として追加
```

### 3. 依存パッケージインストール
```bash
cd /Users/leca/.openclaw/workspace-crypto
npm install googleapis
```

### 4. テスト実行
```bash
node scripts/add-daily-row.js 2026/02/10
```

### 5. cron設定（毎日0時に実行）
```bash
# OpenClaw cronで設定
# 毎日0時に前日の行を追加
```

## 代替案：OAuth2認証

サービスアカウントが面倒な場合、OAuth2でも可能。
その場合は別途トークン取得フローが必要。

## 注意事項
- スプレッドシートIDは環境変数化推奨
- 認証情報は絶対に外部に漏らさない
- 定期的にアクセスログ確認
