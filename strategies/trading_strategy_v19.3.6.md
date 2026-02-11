# Strategy v19.3.6（1h起点マルチTF BUY／SELL + 昇順二段STOPLINE）

## 0) 全体像
- 1h足累積 → 4h足生成 → 1d足生成 → 1w足生成。
- 1h起点で「Entry優先」を検出しつつ、保有後は trade_mode（1H/4H/1D）で管理軸を固定する。
- 週足のトレンドを「最強のホールド・フィルタ—」として使う。
- market_regime（NORMAL/RANGE）により、売買の主ロジック切り替えは、後日検討。

---

## 1) State / Mode
- hasPosition: ポジション有無
- trade_mode: MODE_1H / MODE_4H / MODE_1D（昇格のみ・降格なし）
- 優先度: trade_mode は 1D > 4H > 1H（上位足の意図を尊重）

---

## 2) BUYトリガー（Entry候補）
- RSI Entry:
  - rsiEntry1hSignal / rsiEntry4hSignal / rsiEntry1dSignal
- KLINE Entry（ローソク足パターン or 条件集合）:
  - klineEntry1hSignal / klineEntry4hSignal / klineEntry1dSignal
- 追加フィルタ（短期の高値圏み回避）:
  - 上位足Entry（4h/1d）が成立してても、エントリーの「タイミング」は必ず下位足1hのEntryシグナルの同時成立が必要

- BUY採用ルール（未保有時）:
  - (A) shouldBuy1h が成立 → BUY候補
  - (B) shouldBuy4h/1d が成立 → 1hフィルタOKなら BUY候補
  - buyModePicked = 1D > 4H > 1H（買うならどのモードで買うか）

---

## 3) 昇格（Promote）ルール（保有後のモード管理）
- EMAトレンド検出（クロス直前・クロス中・クロス連続確定）:
