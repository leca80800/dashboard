# cryptopro セッション記憶ファイル

**目的**: セッション間で忘れてはいけない重要情報を記録

---

## 🎯 プロジェクト概要

### 役割
- **cryptopro（俺）**: 判断から取引操作まで全自動で行う全自動取引エージェント
- **立場**: 未来の実トレーダー（現在は演習中）
- **グループ**: 120363424072547288@g.us

### 目標
- **短期**: 演習を通じて判断精度を高める
- **中期**: 少額実トレード開始（¥1,000-10,000）
- **長期**: 千万円達成（3-5年計画、月利10-15%想定）

---

## 📊 現在のステータス

### フェーズ
**演習期間**（実トレード前）

### タスク
1. ✅ ダッシュボード作成完了
2. ✅ データフォーマット策定
3. ✅ 共有知識ベース構築
4. ✅ GitHub認証完了
5. ✅ Google OAuth設定完了
6. ⏳ ダッシュボードトップページ作成中（Claude Code対応待ち）
7. ⏳ 取引所アカウント（OKX・Bybit申請予定）
8. ⏳ 学習タスクcron設定
9. ⏳ 定時分析cron設定

### スケジュール
- **毎日1時**: 市場トレンド・新手法リサーチ
- **毎日9時・15時・21時**: 4時間足チャート分析・模擬判断
- **エントリー前後**: 1時間足で精密タイミング
- **毎日0時**: 学習ログ更新・ダッシュボード更新

---

## 🤝 協業体制

### cryptowatchとの関係
- **役割分担**:
  - cryptowatch: n8n既存システム監視・分析・改善提案
  - cryptopro（俺）: 新規全自動取引開発・演習
- **知識共有**: `/workspace-crypto/shared-knowledge/` で相互学習
- **ダッシュボード**: 両エージェントの活動を一元管理

### データ連携
- **n8n日報**: `dashboard/data/n8n-reports/YYYY-MM-DD.json`（cryptowatch担当）
- **分析ログ**: `dashboard/data/cryptopro-logs/YYYY-MM-DD-HHMM.json`（俺担当）
- **チャート画像**: `dashboard/data/charts/YYYY-MM-DD-HHMM.png`（俺担当）

---

## 🔑 重要な設定

### 取引所（予定）
- **OKX**: デモ取引環境あり、演習に最適
- **Bybit**: API品質高い、比較用
- **除外**: Binance（n8nで使用中）、bitFlyer（同上）

### API設定方針
- ✅ 読み取り+取引のみ権限
- ✅ 出金権限なし
- ✅ IP制限設定
- ✅ 少額テスト → 段階的増額

### リスク管理
- 初期リスク率: 0.5%/トレード
- リスクリワード比: 最低1:2
- 同時保有: 最大2ポジション
- 1日最大損失: 総資金の3%

---

## 📂 重要ファイル

### 戦略ファイル
- `strategies/trading-playbook.md`: トレード戦略
- `strategies/risk-management.md`: リスク管理ルール
- `strategies/learning-task-spec.md`: 学習タスク詳細仕様

### 学習ログ
- `memory/daily-learning.md`: 日次学習記録

### 共有知識
- `shared-knowledge/market-insights.md`: 市場トレンド
- `shared-knowledge/technical-library.md`: テクニカル手法辞書
- `shared-knowledge/lessons-learned.md`: 失敗データベース
- `shared-knowledge/best-practices.md`: 成功パターン

### ダッシュボード
- `crypto/index.html`: 仮想通貨ダッシュボードメインUI
- `crypto/N8N_DATA_FORMAT.md`: n8nデータ仕様
- `crypto/CRYPTOPRO_DATA_FORMAT.md`: 分析ログ仕様
- **URL**: https://leca80800.github.io/dashboard/crypto/
- **トップ**: https://leca80800.github.io/dashboard/ （実装予定）

---

## 💬 ユーザーとの約束

### コミュニケーション
- **起床アラーム**: 定時なし、起きれる時に起きる（アラーム不要に変更）
- **ダッシュボード更新**: 毎日0時、WhatsAppにリンク送信
- **重要判断**: 必ず事前相談

### 学習姿勢
- 自律的に学習（深夜1時の学習タスク）
- 失敗を隠さず共有
- 改善を継続

---

## 🚀 次回セッション開始時の確認事項

**必ず最初に読むファイル**:
1. **`CRYPTO_RULES.md`** ← 運用ルール全体（最重要！）
2. **`memory/session-context.md`** ← このファイル（プロジェクト状況）
3. **`memory/daily-learning.md`** ← 前回の学習内容

**その後の確認**:
1. **GitHub認証済み？** → ダッシュボード公開
2. **取引所アカウント準備？** → チャート分析開始
3. **cron設定済み？** → 自動タスク稼働

---

## 📝 更新履歴

- **2026-02-11 03:00**: 初回作成、プロジェクト基盤構築完了
- **2026-02-11 11:00**: GitHub認証完了、ダッシュボード公開
- **2026-02-11 15:00**: ダッシュボード構造変更計画、学習タスク詳細化

---

**このファイルは各セッション開始時に必ず読むこと！**