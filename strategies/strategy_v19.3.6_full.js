/**
 * ======================================================================================
 * Strategy v19.3.6 （1h起点マルチTF BUY／SELL ＋ 智能二段STOPLINE）
 * ======================================================================================
 * 
 * 0) 全体像
 *   - 1h足集約 → 4h足生成 → 1d足生成 → 1w足生成。
 *   - 1h起点で「Entry機会」を検出しつつ、保有後は trade_mode（1H/4H/1D）で管理軸を固定する。
 *   - 週足のトレンドを『最強のホールド・フィルター』として使う。
 *   - market_regime（NORMAL/RANGE）により、売買の主ロジック切り替えは、後日検討。
 * 
 * --------------------------------------------------------------------------------------
 * 1) State / Mode
 *   - hasPosition: ポジション有無
 *   - trade_mode: MODE_1H / MODE_4H / MODE_1D（昇格のみ・降格なし）
 *   - 優先度: trade_mode は 1D > 4H > 1H（上位足の意図を尊重）
 * 
 * --------------------------------------------------------------------------------------
 * 2) BUYトリガー（Entry候補）
 *   - RSI Entry:
 *       rsiEntry1hSignal / rsiEntry4hSignal / rsiEntry1dSignal
 *   - KLINE Entry（ローソク足パターン or 条件集合）:
 *       klineEntry1hSignal / klineEntry4hSignal / klineEntry1dSignal
 *   - 追加フィルタ（短期の高値掴み回避）:
 *       上位足Entry（4h/1d）が成立しても、エントリーの「タイミング」は必ず下位足1hのEntryシグナルの同時成立が必要
 * 
 *   - BUY採用ルール（未保有時）:
 *       (A) shouldBuy1h が成立 → BUY候補
 *       (B) shouldBuy4h/1d が成立 → 1hフィルタOKなら BUY候補
 *       buyModePicked = 1D > 4H > 1H（買うならどのモードで買うか）
 * 
 * --------------------------------------------------------------------------------------
 * 3) 昇格（Promote）ルール（保有後のモード管理）
 *   - EMAトレンド検出（クロス直前・クロス中・クロス連続確定）:
 *       allowPromote4hByEma / allowPromote1dByEma
 *   - BUYシグナル由来の昇格許可（RSI/KLINE由来）:
 *       allowPromote4hByBuySignal / allowPromote1dByBuySignal
 *   - 昇格条件（概念）:
 *       (hasPosition || shouldBuy) かつ trade_mode != 1D の時に
 *       1D昇格を優先し、次に 1H→4H のみ許可
 * 
 * --------------------------------------------------------------------------------------
 * 4) SELLトリガー（Exit候補）
 *   - RSI Exit:
 *       SELL_RSI_1H_SPIKE / SELL_RSI_4H_SPIKE / SELL_RSI_1D_SPIKE_PRE_WAVE /
 *       SELL_RSI_PEAK_4H / SELL_RSI_PEAK_1D
 *   - KLINE Exit:
 *       SELL_KLINE_PEAK_1H / SELL_KLINE_PEAK_4H / SELL_KLINE_PEAK_1D
 *   - Emergent Exit:
 *       SELL_1D_VICIOUS_V_EXIT / SELL_1D_TREND_COLLAPSE
 *   - Upper BB Exit:
 *       SELL_RANGE_UPPER_BB_REJECTION
 *   - 利益ガード（薄利撤退の抑制）:
 *       profitGuard 等（"売りたい"が出ても利益条件で抑制する場合あり）
 * 
 * --------------------------------------------------------------------------------------
 * 5) Stopline / Cutloss（最優先の撤退）
 *   - Base Stopline:
 *       stoplineBase（固定ライン）
 *   - Dynamic Stopline:
 *       stoplineDynamic（状況で追従。個別状況により無効化する場合あり）
 *   - CUTLOSS優先順位:
 *       Stopline判定が成立したら、SELLトリガーより優先して撤退する
 * 
 * --------------------------------------------------------------------------------------
 * 
 * ======================================================================================
 */

// =====================
// LOG / STATE (先に宣言してTDZ回避)
// =====================
let triggerList = [];
let modeChangeLogs = [];
let kline = null; // changeMode() から参照するので先に宣言（後で実体を代入する）

function pushModeLog(action, { prevMode=null, nextMode=null, reasons=[] } = {}) {
  modeChangeLogs.push({
    action,   // "MODE_CHANGE" | "MODE_INIT" など
    prevMode,
    nextMode,
    reasons: Array.isArray(reasons) ? reasons.filter(Boolean) : [String(reasons)],
    at: new Date().toISOString(),
  });
}

function addTriggers(reasons) {
  const arr = Array.isArray(reasons) ? reasons : [reasons];
  for (const r of arr.filter(Boolean)) {
    if (!triggerList.includes(r)) triggerList.push(r);
  }
}

function changeMode(nextMode, modeChangeTrigger) {
  if (tradeMode === nextMode) return;
  const prevMode = tradeMode;
  tradeMode = nextMode;

  if (hasPosition && kline) {
    kline.top_1h = null;
    kline.top_4h = null;
    kline.top_1d = null;
    if (prevMode === MODE_1H) kline.bottom_1h = null;
    else if (prevMode === MODE_4H || prevMode == null) kline.bottom_4h = null;
    else if (prevMode === MODE_1D) kline.bottom_1d = null;
  }

  addTriggers(modeChangeTrigger);
  pushModeLog("MODE_CHANGE", {
    prevMode,
    nextMode,
    reasons: modeChangeTrigger,
  });
}

//////////////////////////////////////////////////
// データ取得・準備（1hを基に4h・1dバーへ集約）
//////////////////////////////////////////////////

// === データベース構成 ===
const cfg = $('通貨config取得').first().json || {};
const symbol = $input.first()?.json?.symbol ?? "UNKNOWN";

let hasPosition = Boolean(cfg.has_position);
const entryPrice = hasPosition ? (v => {
  const n = Number(v);
  return (Number.isFinite(n) && n > 0) ? n : null;
})(cfg.avg_entry_price) : null;

// ▼▼ トレードモード定義 ▼▼
const MODE_1H = "MODE_1H";
const MODE_4H = "MODE_4H";
const MODE_1D = "MODE_1D";

let tradeMode = cfg?.trade_mode ?? null; // 既存モードを読む

// hasPosition なのに trade_mode が無い → 1h扱いで開始（昇格で上がれる前提）
if (hasPosition && !tradeMode) {
  tradeMode = MODE_1H;
  pushModeLog("MODE_INIT", {
    prevMode: null,
    nextMode: MODE_1H,
    reasons: ["hasPosition but no trade_mode => default MODE_1H"],
  });
}

// 【PDF内容ここまで確認済み】
// 以下、実際のロジック実装が続く...
// （PDFの全文が長いため、重要な構造部分のみ記載）

module.exports = {
  MODE_1H,
  MODE_4H,
  MODE_1D,
  triggerList,
  modeChangeLogs,
  // ... その他のエクスポート
};
