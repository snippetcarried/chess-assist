// ==UserScript==
// @name         Chess Assist
// @namespace    https://meko.gg
// @version      3.0.0
// @description  Stockfish-powered chess.com assistant — meko.gg / @snippetcarried
// @author       @snippetcarried
// @match        *://*.chess.com/*
// @grant        none
// @run-at       document-idle
// @license      MIT
// ==/UserScript==

(() => {
  // don't load twice
  if (window.__chessHelper) return;
  window.__chessHelper = true;

  // ─────────────────────────────────────────────────
  // styles
  // ─────────────────────────────────────────────────

  const StyleSheet = document.createElement('style');
  StyleSheet.textContent = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
:root {
  --ch-accent: #9678d3;
  --ch-accent-light: #b49ae0;
  --ch-accent-deep: #7c5cbf;
  --ch-accent-glow: rgba(150,120,211,0.35);
  --ch-accent-glow-strong: rgba(150,120,211,0.55);
  --ch-accent-dim: rgba(150,120,211,0.08);
  --ch-lavender: #b4a7d6;
  --ch-lavender-glow: rgba(180,167,214,0.4);
  --ch-bg: rgba(12,12,20,0.72);
  --ch-bg-sidebar: rgba(14,14,22,0.55);
  --ch-bg-content: rgba(18,18,28,0.45);
  --ch-bg-input: rgba(28,28,46,0.6);
  --ch-bg-hover: rgba(150,120,211,0.07);
  --ch-border: rgba(150,120,211,0.06);
  --ch-border-glow: rgba(150,120,211,0.14);
  --ch-radius: 14px;
  --ch-font: 'Inter', system-ui, -apple-system, sans-serif;
  --ch-text: #ddd8e8;
  --ch-text-dim: rgba(221,216,232,0.55);
  --ch-text-muted: rgba(221,216,232,0.25);
  --ch-green: #4ade80;
  --ch-red: #f06060;
  --ch-orange: #f5a623;
  --ch-ease: cubic-bezier(0.16,1,0.3,1);
  --ch-ease-out: cubic-bezier(0,0,0.2,1);
  --ch-ease-bounce: cubic-bezier(0.34,1.56,0.64,1);
}

#chess-helper-root {
  position:fixed; inset:0; pointer-events:none; z-index:99999;
  font-family:var(--ch-font); -webkit-font-smoothing:antialiased;
}

/* wrapper — always visible, holds bubble + panel */
#chess-helper-wrap {
  position:fixed; pointer-events:auto; z-index:100000;
  display:flex; flex-direction:column; align-items:flex-start;
}

/* bubble — always visible, fused into the panel */
#chess-helper-bubble {
  width:38px; height:38px;
  background:radial-gradient(circle at 35% 35%, var(--ch-lavender), var(--ch-accent-deep));
  border:none; border-radius:50%;
  box-shadow:
    0 0 14px 2px var(--ch-lavender-glow),
    0 0 36px 4px rgba(150,120,211,0.12),
    0 2px 8px -2px rgba(0,0,0,0.5),
    inset 0 1px 1px rgba(255,255,255,0.2);
  cursor:grab; user-select:none;
  transition: box-shadow .4s var(--ch-ease), filter .3s var(--ch-ease), transform .3s var(--ch-ease-bounce);
  animation: ch-breathe 3s ease-in-out infinite;
  flex-shrink:0; position:relative; z-index:2;
}
#chess-helper-bubble:hover {
  box-shadow:
    0 0 20px 4px var(--ch-accent-glow-strong),
    0 0 44px 6px rgba(150,120,211,0.18),
    0 4px 16px -2px rgba(0,0,0,0.5),
    inset 0 1px 1px rgba(255,255,255,0.25);
  animation-play-state:paused;
  filter:brightness(1.12);
}
#chess-helper-bubble:active { cursor:grabbing; filter:brightness(0.95); }
#chess-helper-wrap.dragging #chess-helper-bubble {
  animation:none; cursor:grabbing;
  box-shadow:
    0 0 24px 6px var(--ch-accent-glow-strong),
    0 6px 24px -4px rgba(0,0,0,0.6);
  filter:brightness(1.1);
}
#chess-helper-wrap.open #chess-helper-bubble {
  animation:none;
  transform:scale(0.85);
  box-shadow:
    0 0 12px 2px var(--ch-accent-glow),
    0 2px 6px -2px rgba(0,0,0,0.4);
}
@keyframes ch-breathe {
  0%, 100% { box-shadow: 0 0 14px 2px var(--ch-lavender-glow), 0 0 36px 4px rgba(150,120,211,0.12), 0 2px 8px -2px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2); }
  50% { box-shadow: 0 0 18px 3px var(--ch-accent-glow), 0 0 44px 6px rgba(150,120,211,0.16), 0 2px 8px -2px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2); }
}

/* panel — slides from bubble */
#chess-helper-panel {
  display:flex; overflow:hidden;
  border-radius:var(--ch-radius);
  width:460px; height:350px;
  backdrop-filter:blur(32px) saturate(1.3);
  -webkit-backdrop-filter:blur(32px) saturate(1.3);
  background:var(--ch-bg);
  border:1px solid var(--ch-border-glow);
  box-shadow:
    0 20px 70px -12px rgba(0,0,0,0.75),
    0 0 80px -20px rgba(150,120,211,0.1),
    0 0 1px 0 rgba(150,120,211,0.12),
    inset 0 0.5px 0 rgba(255,255,255,0.05);
  margin-top:-8px; margin-left:6px;
  opacity:0; transform:translateY(8px) scale(0.96);
  transition: opacity .3s var(--ch-ease), transform .4s var(--ch-ease-bounce), filter .3s var(--ch-ease);
  pointer-events:none;
  filter:blur(6px);
}
#chess-helper-wrap.open #chess-helper-panel {
  opacity:1; transform:translateY(0) scale(1);
  pointer-events:auto; filter:blur(0);
}

/* sidebar */
.ch-sidebar {
  width:130px; background:var(--ch-bg-sidebar);
  backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
  display:flex; flex-direction:column;
  padding:14px 0 10px; border-right:1px solid var(--ch-border); flex-shrink:0;
  position:relative;
}
.ch-sidebar::after {
  content:''; position:absolute; right:0; top:0; bottom:0; width:1px;
  background:linear-gradient(180deg, transparent, rgba(150,120,211,0.1), transparent);
  pointer-events:none;
}
.ch-sidebar-logo {
  padding:0 14px 10px; font-size:14px; font-weight:700; color:var(--ch-accent-light);
  letter-spacing:-0.3px; line-height:1;
  text-shadow:0 0 20px rgba(150,120,211,0.3);
}
.ch-sidebar-sub {
  padding:0 14px 12px; font-size:8px; color:var(--ch-text-muted);
  letter-spacing:0.3px; line-height:1.3; margin-top:-7px;
}
.ch-sidebar-section {
  padding:0 14px 5px; font-size:8px; font-weight:600; color:var(--ch-text-muted);
  text-transform:uppercase; letter-spacing:1px;
}
.ch-nav-item {
  display:flex; align-items:center; gap:7px;
  padding:7px 14px; cursor:pointer; color:var(--ch-text-dim);
  font-size:11.5px; font-weight:500; transition:all .25s var(--ch-ease);
  border:none; background:none; width:100%; text-align:left;
  font-family:var(--ch-font); position:relative;
}
.ch-nav-item:hover { color:var(--ch-text); background:var(--ch-bg-hover); }
.ch-nav-item.active {
  color:#fff; background:linear-gradient(90deg, rgba(150,120,211,0.12), transparent);
}
.ch-nav-item.active::before {
  content:''; position:absolute; left:0; top:50%; transform:translateY(-50%);
  width:2.5px; height:18px; background:var(--ch-accent); border-radius:0 3px 3px 0;
  box-shadow:0 0 8px 2px var(--ch-accent-glow);
}
.ch-nav-dot {
  width:5px; height:5px; border-radius:50%;
  background:var(--ch-accent); box-shadow:0 0 5px var(--ch-accent-glow);
  flex-shrink:0; opacity:0; transition:opacity .25s var(--ch-ease), transform .25s var(--ch-ease-bounce);
  transform:scale(0);
}
.ch-nav-item.active .ch-nav-dot { opacity:1; transform:scale(1); }
.ch-sidebar-footer {
  margin-top:auto; padding:10px 14px 0; border-top:1px solid var(--ch-border);
  font-size:8px; color:var(--ch-text-muted); line-height:1.4;
}
.ch-sidebar-footer a { color:var(--ch-text-dim); text-decoration:none; transition:color .2s; }
.ch-sidebar-footer a:hover { color:var(--ch-accent-light); text-shadow:0 0 8px var(--ch-accent-dim); }

/* content */
.ch-content {
  flex:1; background:var(--ch-bg-content); display:flex; flex-direction:column;
  overflow-y:auto; overflow-x:hidden; position:relative;
}
.ch-content::-webkit-scrollbar { width:3px; }
.ch-content::-webkit-scrollbar-track { background:transparent; }
.ch-content::-webkit-scrollbar-thumb { background:rgba(150,120,211,0.12); border-radius:3px; }
.ch-content::-webkit-scrollbar-thumb:hover { background:rgba(150,120,211,0.22); }
.ch-page {
  display:none; flex-direction:column; gap:5px; padding:16px 18px; flex:1;
  animation:ch-page-in .25s var(--ch-ease) both;
}
.ch-page.active { display:flex; }
@keyframes ch-page-in {
  from { opacity:0; transform:translateX(4px); }
  to { opacity:1; transform:translateX(0); }
}
.ch-page-title {
  font-size:15px; font-weight:700; color:#fff; letter-spacing:-0.3px;
  margin-bottom:6px;
  text-shadow:0 0 24px rgba(150,120,211,0.12);
}
.ch-section-label {
  font-size:8px; font-weight:600; color:var(--ch-text-muted);
  text-transform:uppercase; letter-spacing:1px; padding:6px 0 3px;
}

/* rows */
.ch-row {
  display:flex; justify-content:space-between; align-items:center;
  padding:6px 0; border-bottom:1px solid var(--ch-border); gap:7px;
  transition:background .2s;
}
.ch-row:hover { background:var(--ch-bg-hover); margin:0 -18px; padding:6px 18px; border-radius:7px; border-color:transparent; }
.ch-row:last-child { border-bottom:none; }
.ch-label { font-size:11.5px; color:var(--ch-text); font-weight:500; flex:1; }

/* toggle */
.ch-switch { position:relative; width:34px; height:18px; flex-shrink:0; }
.ch-switch input { opacity:0; width:0; height:0; }
.ch-slider {
  position:absolute; cursor:pointer; inset:0;
  background:rgba(255,255,255,0.05); transition:all .3s var(--ch-ease);
  border-radius:18px; border:1px solid rgba(255,255,255,0.03);
}
.ch-slider:before {
  content:""; position:absolute; height:12px; width:12px;
  left:3px; bottom:2px; background:#555;
  transition:all .3s var(--ch-ease-bounce); border-radius:50%;
}
input:checked + .ch-slider {
  background:var(--ch-accent);
  box-shadow:0 0 10px var(--ch-accent-glow), inset 0 0 5px rgba(0,0,0,0.15);
  border-color:rgba(150,120,211,0.25);
}
input:checked + .ch-slider:before { transform:translateX(16px); background:#fff; box-shadow:0 0 3px rgba(255,255,255,0.4); }

/* keybind */
.ch-keybind {
  font-size:9px; color:var(--ch-text-dim); background:var(--ch-bg-input);
  padding:2px 7px; border-radius:5px; font-family:var(--ch-font); font-weight:600;
  letter-spacing:0.3px; cursor:pointer; transition:all .25s var(--ch-ease);
  border:1px solid var(--ch-border); white-space:nowrap; min-width:40px; text-align:center;
}
.ch-keybind:hover { border-color:var(--ch-accent); color:var(--ch-text); box-shadow:0 0 6px var(--ch-accent-dim); }
.ch-keybind.recording {
  color:var(--ch-accent-light); border-color:var(--ch-accent);
  box-shadow:0 0 10px var(--ch-accent-glow);
  animation:ch-pulse-glow 1.2s ease-in-out infinite;
}
@keyframes ch-pulse-glow {
  0%,100%{ box-shadow:0 0 6px var(--ch-accent-glow); }
  50%{ box-shadow:0 0 14px var(--ch-accent-glow-strong); }
}

/* slider */
.ch-slider-row { display:flex; align-items:center; gap:8px; padding:3px 0; }
.ch-slider-label { font-size:11.5px; color:var(--ch-text); font-weight:500; white-space:nowrap; }
.ch-slider-val {
  font-size:11.5px; color:var(--ch-accent-light); font-weight:700;
  min-width:32px; text-align:right; font-variant-numeric:tabular-nums;
  text-shadow:0 0 6px var(--ch-accent-dim);
}
.ch-range {
  -webkit-appearance:none; appearance:none; flex:1; height:3px;
  background:rgba(150,120,211,0.08); border-radius:3px; outline:none; cursor:pointer;
  transition:background .2s;
}
.ch-range:hover { background:rgba(150,120,211,0.16); }
.ch-range::-webkit-slider-thumb {
  -webkit-appearance:none; width:12px; height:12px; border-radius:50%;
  background:var(--ch-accent-light); cursor:pointer; border:2px solid rgba(18,18,28,0.8);
  box-shadow:0 0 8px var(--ch-accent-glow);
  transition:box-shadow .2s;
}
.ch-range::-webkit-slider-thumb:hover { box-shadow:0 0 14px var(--ch-accent-glow-strong); }
.ch-range::-moz-range-thumb {
  width:12px; height:12px; border-radius:50%;
  background:var(--ch-accent-light); border:2px solid rgba(18,18,28,0.8); cursor:pointer;
  box-shadow:0 0 8px var(--ch-accent-glow);
}

/* status */
.ch-status-row {
  display:flex; justify-content:space-between; align-items:center;
  padding:6px 0; border-bottom:1px solid var(--ch-border);
}
.ch-status-label { font-size:11.5px; color:var(--ch-text-dim); font-weight:500; }
.ch-status-value { font-size:11.5px; color:var(--ch-green); font-weight:600; text-shadow:0 0 6px rgba(74,222,128,0.3); }

/* buttons */
.ch-btn {
  padding:7px 12px; border-radius:7px; border:1px solid var(--ch-border);
  background:var(--ch-bg-input); color:var(--ch-text); font-family:var(--ch-font);
  font-size:10.5px; font-weight:600; cursor:pointer; transition:all .25s var(--ch-ease);
  backdrop-filter:blur(4px);
}
.ch-btn:hover {
  background:var(--ch-bg-hover); border-color:var(--ch-border-glow);
  box-shadow:0 0 10px var(--ch-accent-dim);
}
.ch-btn:active { transform:scale(0.97); }
.ch-btn-accent {
  background:linear-gradient(135deg, var(--ch-accent-deep), var(--ch-accent));
  color:#fff; border:none;
  box-shadow:0 3px 14px -2px var(--ch-accent-glow), 0 0 1px 0 rgba(150,120,211,0.3) inset;
}
.ch-btn-accent:hover {
  box-shadow:0 3px 20px -2px var(--ch-accent-glow-strong), 0 0 1px 0 rgba(150,120,211,0.4) inset;
  filter:brightness(1.1);
}
.ch-btn-accent:active { filter:brightness(0.95); transform:scale(0.97); }

/* detection */
.ch-det-toggle-row { display:flex; gap:3px; padding:2px 0 5px; }
.ch-det-btn {
  flex:1; padding:5px 0; border:1px solid var(--ch-border); border-radius:7px;
  background:var(--ch-bg-input); color:var(--ch-text-dim); font-size:10.5px;
  font-weight:600; cursor:pointer; transition:all .25s var(--ch-ease);
  font-family:var(--ch-font); backdrop-filter:blur(4px);
}
.ch-det-btn:hover { border-color:var(--ch-border-glow); background:var(--ch-bg-hover); }
.ch-det-btn.active {
  background:linear-gradient(135deg, var(--ch-accent-deep), var(--ch-accent));
  color:#fff; border-color:transparent;
  box-shadow:0 3px 14px -2px var(--ch-accent-glow), inset 0 0 6px rgba(0,0,0,0.1);
}
.ch-detect-stat {
  display:flex; justify-content:space-between; align-items:center; padding:4px 0;
  transition:background .2s;
}
.ch-detect-stat:hover { background:var(--ch-bg-hover); margin:0 -18px; padding:4px 18px; border-radius:5px; }
.ch-detect-label { font-size:10.5px; color:var(--ch-text-dim); font-weight:500; }
.ch-detect-value { font-size:11.5px; color:#fff; font-weight:700; font-variant-numeric:tabular-nums; }
.ch-detect-gauge {
  height:5px; border-radius:3px; background:var(--ch-bg-input);
  overflow:hidden; margin:5px 0; position:relative;
  border:1px solid var(--ch-border);
}
.ch-detect-fill {
  height:100%; width:0%; border-radius:3px;
  transition:width .6s var(--ch-ease), background .4s var(--ch-ease), box-shadow .4s;
  background:linear-gradient(90deg, var(--ch-accent), var(--ch-accent-light));
  box-shadow:0 0 8px var(--ch-accent-glow);
  position:relative;
}
.ch-detect-fill::after {
  content:''; position:absolute; right:0; top:-1px; bottom:-1px; width:5px;
  background:rgba(255,255,255,0.35); border-radius:0 3px 3px 0;
  filter:blur(2px);
}
.ch-detect-verdict {
  text-align:center; font-size:10.5px; font-weight:600;
  color:var(--ch-text-muted); padding:2px 0;
  transition:color .3s, text-shadow .3s;
}

/* skins */
.ch-skins-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:3px; }
.ch-skin-tile {
  aspect-ratio:1; background:var(--ch-bg-input); border-radius:5px;
  cursor:pointer; position:relative; display:flex; align-items:center;
  justify-content:center; background-size:contain; background-position:center;
  background-repeat:no-repeat; transition:all .25s var(--ch-ease);
  border:1px solid transparent;
}
.ch-skin-tile:hover { border-color:var(--ch-border-glow); background-color:var(--ch-bg-hover); transform:scale(1.04); }
.ch-skin-tile.wide { grid-column:span 3; aspect-ratio:3/1; }
.ch-skin-label { font-size:14px; color:rgba(255,255,255,0.35); pointer-events:none; line-height:1; }
.ch-skin-tile.has-skin .ch-skin-label { display:none; }
.ch-skin-remove {
  display:none; position:absolute; top:-3px; right:-3px;
  width:13px; height:13px; border-radius:50%; background:var(--ch-red);
  color:#fff; border:none; font-size:8px; line-height:13px; text-align:center;
  padding:0; cursor:pointer; z-index:2; box-shadow:0 2px 5px rgba(0,0,0,0.3);
  transition:transform .15s var(--ch-ease-bounce);
}
.ch-skin-remove:hover { transform:scale(1.2); }
.ch-skin-tile.has-skin:hover .ch-skin-remove { display:block; }
.ch-skins-row-label {
  font-size:8px; color:var(--ch-text-muted); font-weight:600;
  grid-column:span 6; text-align:center; margin:1px 0 -1px;
  text-transform:uppercase; letter-spacing:0.8px;
}

/* thinking */
.ch-thinking {
  font-size:10.5px; color:var(--ch-accent-light); font-weight:600;
  text-align:center; display:none;
  text-shadow:0 0 8px var(--ch-accent-glow);
  animation:ch-think-pulse 1.5s ease-in-out infinite;
}
.ch-thinking.active { display:block; }
@keyframes ch-think-pulse {
  0%,100% { opacity:1; text-shadow:0 0 8px var(--ch-accent-glow); }
  50% { opacity:0.6; text-shadow:0 0 16px var(--ch-accent-glow-strong); }
}

/* eval bar */
#ch-eval-bar {
  width:24px; border-radius:8px; overflow:hidden;
  background:rgba(10,10,18,0.6); box-shadow:0 3px 12px -3px rgba(0,0,0,0.5), 0 0 1px var(--ch-border-glow);
  position:relative; pointer-events:auto; min-height:200px;
  border:1px solid var(--ch-border); margin-left:5px;
  backdrop-filter:blur(8px); -webkit-backdrop-filter:blur(8px);
}
#ch-eval-white {
  position:absolute; bottom:0; left:0; right:0;
  background:linear-gradient(180deg, #e8e8ec, #f5f5f5); transition:height .6s var(--ch-ease); height:50%;
}
.ch-eval-pct {
  position:absolute; width:100%; text-align:center;
  font-size:8px; font-weight:700; font-family:var(--ch-font); z-index:2; left:0;
}
#ch-eval-pct-top { top:5px; color:#fff; text-shadow:0 1px 3px #000; }
#ch-eval-pct-bot { bottom:5px; color:#111; text-shadow:0 1px 3px rgba(255,255,255,0.3); }

/* shade overlay */
.ch-shade-overlay {
  position:absolute; pointer-events:none; z-index:999;
  border-radius:2px; transition:opacity .2s var(--ch-ease);
}
`;
  document.head.appendChild(StyleSheet);


  // ─────────────────────────────────────────────────
  // state
  // ─────────────────────────────────────────────────

  window.chessHelper = {
    autoPlay: false,
    showArrow: false,
    hiddenArrow: false,
    showOpponent: false,
    showEval: false,
    detection: true,
  };

  const Detection = {
    oppMoves: 0,
    totalCpl: 0,
    bestMoves: 0,
    topThree: 0,
    blunders: 0,
    lastOppEvalCp: null,
    lastOppEvalFen: null,
    lastMyEvalCp: null,
    lastMyEvalFen: null,
  };

  const MoveLog = [];
  let DetTarget = 'opponent';
  let LastGameId = null;

  // expected stats per elo bracket for suspicion scoring
  const EloTable = [
    { elo: 400,  acpl: 215, bmr: 0.17, acc: 45 },
    { elo: 600,  acpl: 188, bmr: 0.22, acc: 50 },
    { elo: 800,  acpl: 158, bmr: 0.27, acc: 56 },
    { elo: 1000, acpl: 128, bmr: 0.33, acc: 62 },
    { elo: 1200, acpl: 97,  bmr: 0.40, acc: 68 },
    { elo: 1400, acpl: 73,  bmr: 0.48, acc: 73 },
    { elo: 1600, acpl: 53,  bmr: 0.56, acc: 78 },
    { elo: 1800, acpl: 37,  bmr: 0.64, acc: 82 },
    { elo: 2000, acpl: 26,  bmr: 0.71, acc: 86 },
    { elo: 2200, acpl: 17,  bmr: 0.77, acc: 89 },
    { elo: 2400, acpl: 11,  bmr: 0.83, acc: 92 },
    { elo: 2600, acpl: 7,   bmr: 0.88, acc: 94 },
  ];

  // maps chess.com piece classes to fen characters
  const PieceToFen = {
    wp: 'P', wn: 'N', wb: 'B', wr: 'R', wq: 'Q', wk: 'K',
    bp: 'p', bn: 'n', bb: 'b', br: 'r', bq: 'q', bk: 'k',
  };


  // ─────────────────────────────────────────────────
  // helpers
  // ─────────────────────────────────────────────────

  function Lerp(a, b, t) { return a + t * (b - a); }

  function ExpectedStats(elo) {
    if (!elo) return EloTable[4];
    const Clamped = Math.max(400, Math.min(2600, elo));
    for (let i = 0; i < EloTable.length - 1; i++) {
      if (Clamped <= EloTable[i + 1].elo) {
        const t = (Clamped - EloTable[i].elo) / (EloTable[i + 1].elo - EloTable[i].elo);
        return {
          acpl: Lerp(EloTable[i].acpl, EloTable[i + 1].acpl, t),
          bmr: Lerp(EloTable[i].bmr, EloTable[i + 1].bmr, t),
          acc: Lerp(EloTable[i].acc, EloTable[i + 1].acc, t),
        };
      }
    }
    return EloTable[EloTable.length - 1];
  }

  // same formula lichess uses for accuracy
  function LichessAccuracy(acpl) {
    return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * (acpl + 3.756)) - 3.1668));
  }

  function GetBoard() {
    return document.querySelector('wc-chess-board')
      || document.querySelector('chess-board')
      || document.querySelector('.board');
  }

  function IsFlipped() {
    const Board = GetBoard();
    return !!(Board?.hasAttribute?.('flipped') || Board?.classList?.contains('flipped'));
  }

  function GetMyColor() {
    const Board = GetBoard();
    if (Board?.game?.getPlayingAs) {
      try {
        const Color = Board.game.getPlayingAs();
        if (Color === 1 || Color === 'w' || Color === 'white') return 'w';
        if (Color === 2 || Color === 'b' || Color === 'black') return 'b';
      } catch {}
    }
    return IsFlipped() ? 'b' : 'w';
  }

  function GetPlayerElos() {
    const Elos = { top: null, bottom: null };
    try {
      const TopEl = document.querySelector(
        '.player-tagline-top .user-tagline-rating, .board-layout-top .user-tagline-rating, [class*="playerinfo-top"] [data-cy="user-tagline-rating"]'
      );
      const BotEl = document.querySelector(
        '.player-tagline-bottom .user-tagline-rating, .board-layout-bottom .user-tagline-rating, [class*="playerinfo-bottom"] [data-cy="user-tagline-rating"]'
      );
      if (TopEl) { const n = parseInt(TopEl.textContent.replace(/[()]/g, '')); if (n > 0) Elos.top = n; }
      if (BotEl) { const n = parseInt(BotEl.textContent.replace(/[()]/g, '')); if (n > 0) Elos.bottom = n; }
      // fallback: just grab whatever rating elements exist
      if (!Elos.top && !Elos.bottom) {
        const All = document.querySelectorAll('.user-tagline-rating, [data-cy="user-tagline-rating"]');
        if (All.length >= 2) {
          Elos.top = parseInt(All[0].textContent.replace(/[()]/g, '')) || null;
          Elos.bottom = parseInt(All[1].textContent.replace(/[()]/g, '')) || null;
        } else if (All.length === 1) {
          Elos.top = parseInt(All[0].textContent.replace(/[()]/g, '')) || null;
        }
      }
    } catch {}
    return Elos;
  }

  function GetDetectionElo() {
    const Elos = GetPlayerElos();
    const Flipped = IsFlipped();
    return DetTarget === 'opponent' ? (Flipped ? Elos.bottom : Elos.top) : (Flipped ? Elos.top : Elos.bottom);
  }

  function InActiveGame() {
    const Board = GetBoard();
    if (!Board) return false;
    if (document.querySelector('.move-list-wrapper, .vertical-move-list, wc-move-list, [class*="move-list"]')) return true;
    const Clocks = document.querySelectorAll('.clock-component, .clock-bottom, .clock-top');
    if ([...Clocks].some(c => c.classList.contains('clock-player-turn'))) return true;
    if (Clocks.length >= 2) return true;
    return !!(Board.game?.getTurn && Board.game?.getPlayingAs);
  }

  function IsMyTurn() {
    const Board = GetBoard();
    if (Board?.game?.getFEN) { const Turn = Board.game.getFEN().split(' ')[1]; return Turn === GetMyColor(); }
    const Bottom = document.querySelector('.clock-bottom, .clock-component-bottom');
    if (Bottom?.classList.contains('clock-player-turn')) return true;
    const Top = document.querySelector('.clock-top, .clock-component-top');
    if (Top?.classList.contains('clock-player-turn')) return false;
    return false;
  }

  function GetFEN() {
    const Board = GetBoard();
    if (Board?.game?.getFEN) {
      const Fen = Board.game.getFEN();
      if (Fen?.includes('/')) {
        const Parts = Fen.split(' ');
        // strip en passant — we don't need it and it changes the position hash
        if (Parts.length >= 4) Parts[3] = '-';
        return Parts.join(' ');
      }
    }
    // fallback: read pieces from the dom
    const Pieces = document.querySelectorAll('.piece');
    if (!Pieces.length) return null;
    const Grid = Array.from({ length: 8 }, () => Array(8).fill(null));
    Pieces.forEach(p => {
      const Classes = [...p.classList];
      const Type = Classes.find(c => PieceToFen[c]);
      const Square = Classes.find(c => c.startsWith('square-'));
      if (Type && Square) {
        const Num = Square.split('-')[1];
        Grid[8 - +Num[1]][+Num[0] - 1] = PieceToFen[Type];
      }
    });
    const Rows = Grid.map(Row => {
      let Str = '', Empty = 0;
      for (const Cell of Row) {
        if (!Cell) { Empty++; }
        else { if (Empty) Str += Empty; Empty = 0; Str += Cell; }
      }
      return Str + (Empty || '');
    });
    // figure out whose turn it is from the clocks
    let Turn = 'w';
    const Bottom = document.querySelector('.clock-bottom, .clock-component-bottom');
    const Top = document.querySelector('.clock-top, .clock-component-top');
    if (Bottom?.classList.contains('clock-player-turn')) Turn = GetMyColor() || 'w';
    else if (Top?.classList.contains('clock-player-turn')) Turn = (GetMyColor() === 'w' ? 'b' : 'w');
    return Rows.join('/') + ` ${Turn} - - 0 1`;
  }

  // just the position + turn, no castling/ep
  function BoardKey(fen) { const Parts = fen.split(' '); return Parts[0] + ' ' + (Parts[1] || 'w'); }

  function GetCurrentGameId() {
    const Board = GetBoard();
    try {
      if (Board?.game?.id) return String(Board.game.id);
      const Raw = Board?.game?.rawGame || Board?.game?._game;
      if (Raw?.id) return String(Raw.id);
    } catch {}
    return null;
  }

  function CheckGameChanged() {
    const Id = GetCurrentGameId();
    if (Id && Id !== LastGameId) { LastGameId = Id; PositionMoves.clear(); ResetDetection(); }
  }


  // ─────────────────────────────────────────────────
  // detection logic
  // ─────────────────────────────────────────────────

  function ComputeSuspicion(acpl, bmr, accuracy, blunders, moveCount, elo) {
    const Exp = ExpectedStats(elo);
    let Score = 0;
    // acpl way below expected = suspicious
    if (Exp.acpl) {
      const Ratio = Exp.acpl / Math.max(acpl, 1);
      if (Ratio > 4) Score += 35; else if (Ratio > 3) Score += 28;
      else if (Ratio > 2) Score += 18; else if (Ratio > 1.5) Score += 9;
    }
    // best move rate way above expected
    if (Exp.bmr) {
      const Diff = bmr - Exp.bmr;
      if (Diff > 0.40) Score += 75; else if (Diff > 0.28) Score += 27;
      else if (Diff > 0.18) Score += 17; else if (Diff > 0.10) Score += 8;
    }
    // zero blunders over many moves is unusual at lower elos
    if (moveCount >= 18 && blunders === 0) {
      const Bonus = elo ? (elo < 900 ? 15 : elo < 1200 ? 11 : elo < 1600 ? 7 : elo < 2000 ? 3 : 0) : 6;
      Score += Bonus;
    }
    // accuracy way above expected
    if (Exp.acc) {
      const Gap = accuracy - Exp.acc;
      if (Gap > 22) Score += 20; else if (Gap > 14) Score += 14; else if (Gap > 8) Score += 7;
    }
    return Math.min(100, Math.round(Score));
  }

  const AccentVar = 'var(--ch-accent)';

  function UpdateDetectionUI() {
    const MovesEl = document.getElementById('ch-det-moves');
    if (!MovesEl) return;
    const AcplEl = document.getElementById('ch-det-acpl');
    const BmrEl = document.getElementById('ch-det-bmr');
    const AccEl = document.getElementById('ch-det-acc');
    const ScoreEl = document.getElementById('ch-det-score');
    const FillEl = document.getElementById('ch-det-fill');
    const VerdictEl = document.getElementById('ch-det-verdict');
    MovesEl.textContent = Detection.oppMoves;
    if (Detection.oppMoves < 1) {
      AcplEl.textContent = '—'; BmrEl.textContent = '—'; AccEl.textContent = '—';
      ScoreEl.textContent = '—'; FillEl.style.width = '0%';
      FillEl.style.background = 'var(--ch-accent)';
      VerdictEl.textContent = 'Waiting for moves…'; VerdictEl.style.color = 'var(--ch-text-muted)';
      return;
    }
    const Acpl = Math.round(Detection.totalCpl / Detection.oppMoves);
    const Bmr = Detection.bestMoves / Detection.oppMoves;
    const Accuracy = LichessAccuracy(Acpl);
    const Elo = GetDetectionElo();
    AcplEl.textContent = Acpl;
    BmrEl.textContent = Math.round(Bmr * 100) + '%';
    AccEl.textContent = Math.round(Accuracy * 10) / 10 + '%';
    const Score = ComputeSuspicion(Acpl, Bmr, Accuracy, Detection.blunders, Detection.oppMoves, Elo);
    let Level, Color;
    if (DetTarget === 'self') {
      if (Score >= 75) { Level = 'Engine-level'; Color = AccentVar; }
      else if (Score >= 50) { Level = 'Very strong'; Color = AccentVar; }
      else if (Score >= 28) { Level = 'Solid play'; Color = 'var(--ch-orange)'; }
      else { Level = 'Room to improve'; Color = 'var(--ch-text-dim)'; }
    } else {
      if (Score >= 75) { Level = 'Engine detected'; Color = 'var(--ch-red)'; }
      else if (Score >= 50) { Level = 'Highly suspicious'; Color = '#e07040'; }
      else if (Score >= 28) { Level = 'Somewhat suspicious'; Color = 'var(--ch-orange)'; }
      else { Level = 'Likely clean'; Color = 'var(--ch-green)'; }
    }
    if (Detection.oppMoves < 5) Level += ' (low sample)';
    ScoreEl.textContent = Score + '%'; FillEl.style.width = Score + '%';
    FillEl.style.background = `linear-gradient(90deg, ${Color}, ${Color})`;
    FillEl.style.boxShadow = `0 0 10px ${Color.includes('var(') ? 'var(--ch-accent-glow)' : Color + '60'}`;
    VerdictEl.textContent = Level; VerdictEl.style.color = Color;
    VerdictEl.style.textShadow = `0 0 10px ${Color.includes('var(') ? 'var(--ch-accent-dim)' : Color + '40'}`;
  }

  function RecalcDetection() {
    const MyColor = GetMyColor();
    const TargetColor = DetTarget === 'opponent' ? (MyColor === 'w' ? 'b' : 'w') : MyColor;
    const Entries = MoveLog.filter(e => e.color === TargetColor);
    Detection.oppMoves = Entries.length;
    Detection.totalCpl = Entries.reduce((s, e) => s + e.cpl, 0);
    Detection.bestMoves = Entries.filter(e => e.cpl <= 5).length;
    Detection.topThree = Entries.filter(e => e.cpl > 5 && e.cpl <= 20).length;
    Detection.blunders = Entries.filter(e => e.cpl > 200).length;
    UpdateDetectionUI();
  }

  function ResetDetection() {
    Detection.oppMoves = 0; Detection.totalCpl = 0; Detection.bestMoves = 0;
    Detection.topThree = 0; Detection.blunders = 0;
    Detection.lastOppEvalCp = null; Detection.lastOppEvalFen = null;
    Detection.lastMyEvalCp = null; Detection.lastMyEvalFen = null;
    MoveLog.length = 0; UpdateDetectionUI();
  }


  // ─────────────────────────────────────────────────
  // engine (stockfish 18 wasm)
  // ─────────────────────────────────────────────────

  const PositionMoves = new Map();
  const RepeatThreshold = 2;
  let EngineDepth = 16;
  const MultiPV = 3;
  let DelayMin = 1, DelayMax = 5, DelayEnabled = false;
  let SfWorker = null, SfReady = false, InitPromise = null;

  function ShowLoadingOverlay(msg) {
    let Overlay = document.getElementById('ch-loading-overlay');
    if (!Overlay) {
      Overlay = document.createElement('div');
      Overlay.id = 'ch-loading-overlay';
      Overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:999999;backdrop-filter:blur(4px);';
      Overlay.innerHTML = '<div style="background:rgba(20,20,34,0.9);backdrop-filter:blur(12px);border:1px solid rgba(150,120,211,0.1);border-radius:12px;padding:24px 32px;text-align:center;color:#fff;font-family:var(--ch-font);max-width:280px;box-shadow:0 16px 48px rgba(0,0,0,0.6);"><div id="ch-load-spinner" style="width:28px;height:28px;border:2px solid rgba(255,255,255,0.08);border-top:2px solid #7c5cbf;border-radius:50%;margin:0 auto 12px;animation:chspin .8s linear infinite;"></div><div id="ch-load-msg" style="font-size:12px;line-height:1.5;color:#e0e0e8;"></div></div>';
      const SpinStyle = document.createElement('style');
      SpinStyle.textContent = '@keyframes chspin{to{transform:rotate(360deg)}}';
      Overlay.appendChild(SpinStyle);
      document.body.appendChild(Overlay);
    }
    document.getElementById('ch-load-msg').textContent = msg;
  }

  function HideLoadingOverlay() {
    const Overlay = document.getElementById('ch-loading-overlay');
    if (Overlay) Overlay.remove();
  }

  async function FetchWithProgress(url, label) {
    const Resp = await fetch(url);
    const Total = +Resp.headers.get('content-length') || 0;
    if (!Total || !Resp.body) { ShowLoadingOverlay(label + '…'); return Resp; }
    const Reader = Resp.body.getReader();
    const Chunks = [];
    let Loaded = 0;
    while (true) {
      const { done, value } = await Reader.read();
      if (done) break;
      Chunks.push(value); Loaded += value.length;
      ShowLoadingOverlay(label + ' ' + Math.round((Loaded / Total) * 100) + '%');
    }
    const Buffer = new Uint8Array(Loaded);
    let Pos = 0;
    for (const Chunk of Chunks) { Buffer.set(Chunk, Pos); Pos += Chunk.length; }
    return new Response(Buffer, { headers: Resp.headers });
  }

  function UciSend(cmd) { if (SfWorker) SfWorker.postMessage(cmd); }

  function UciCommand(cmd, waitFor) {
    return new Promise((resolve, reject) => {
      const Timeout = setTimeout(() => { SfWorker.removeEventListener('message', Handler); reject(new Error('UCI timeout')); }, 10000);
      const Handler = (e) => {
        if (typeof e.data === 'string' && e.data.startsWith(waitFor)) {
          clearTimeout(Timeout); SfWorker.removeEventListener('message', Handler); resolve(e.data);
        }
      };
      SfWorker.addEventListener('message', Handler); UciSend(cmd);
    });
  }

  async function InitEngine() {
    if (SfReady) return;
    if (InitPromise) return InitPromise;
    InitPromise = DoInitEngine();
    return InitPromise;
  }

  async function DoInitEngine() {
    if (SfWorker) return;
    const Base = 'https://unpkg.com/stockfish@18.0.8/bin/';
    try {
      ShowLoadingOverlay('Loading engine…');
      const [JsCode, WasmBuf] = await Promise.all([
        FetchWithProgress(Base + 'stockfish-18-lite-single.js', 'Engine JS').then(r => r.text()),
        FetchWithProgress(Base + 'stockfish-18-lite-single.wasm', 'Engine WASM').then(r => r.arrayBuffer()),
      ]);
      ShowLoadingOverlay('Starting engine…');
      // bootstrap: intercepts the wasm fetch inside the worker so we can inject our downloaded copy
      const Bootstrap = 'self.onmessage=function(e){if(e.data&&e.data.type==="init"){self.onmessage=null;var w=e.data.wasm,done=false,of=self.fetch;self.fetch=function(u,o){if(!done){done=true;return Promise.resolve(new Response(w,{status:200,headers:{"Content-Type":"application/wasm"}}))}return of.call(self,u,o)};importScripts(URL.createObjectURL(new Blob([e.data.js],{type:"application/javascript"})))}};';
      SfWorker = new Worker(URL.createObjectURL(new Blob([Bootstrap], { type: 'application/javascript' })));
      SfWorker.postMessage({ type: 'init', wasm: WasmBuf, js: JsCode }, [WasmBuf]);
      await UciCommand('uci', 'uciok');
      UciSend('setoption name MultiPV value ' + MultiPV);
      await UciCommand('isready', 'readyok');
      SfReady = true; HideLoadingOverlay();
    } catch {
      SfWorker = null;
      // wasm failed, try the asm fallback
      try {
        ShowLoadingOverlay('Falling back to ASM…');
        const Resp = await fetch(Base + 'stockfish-18-asm.js');
        const Code = await Resp.text();
        SfWorker = new Worker(URL.createObjectURL(new Blob([Code], { type: 'application/javascript' })));
        await UciCommand('uci', 'uciok');
        UciSend('setoption name MultiPV value ' + MultiPV);
        await UciCommand('isready', 'readyok');
        SfReady = true; HideLoadingOverlay();
      } catch { SfWorker = null; HideLoadingOverlay(); }
    }
  }

  function ParseCp(scoreStr) {
    const Parts = scoreStr.split(/\s+/);
    return Parts[0] === 'mate' ? (parseInt(Parts[1]) > 0 ? 99999 : -99999) : parseInt(Parts[1]);
  }

  function QueryLocal(fen, depth) {
    return new Promise((resolve) => {
      if (!SfWorker || !SfReady) { resolve([]); return; }
      const Moves = {};
      const Timeout = setTimeout(() => {
        SfWorker.removeEventListener('message', Handler);
        resolve(Object.entries(Moves).sort((a, b) => a[0] - b[0]).map(e => e[1]));
      }, 8000);
      const Handler = (e) => {
        const Line = typeof e.data === 'string' ? e.data : '';
        const PvMatch = Line.match(/multipv\s+(\d+).*?\bpv\s+(\S+)/);
        if (PvMatch) {
          const PvIdx = parseInt(PvMatch[1]);
          const Mv = PvMatch[2];
          if (Mv.length >= 4) {
            const ScoreMatch = Line.match(/score\s+(cp\s+[-\d]+|mate\s+[-\d]+)/);
            Moves[PvIdx] = { move: Mv.slice(0, 4) + (Mv.length === 5 ? Mv[4] : ''), cp: ScoreMatch ? ParseCp(ScoreMatch[1]) : null };
          }
        }
        if (Line.startsWith('bestmove')) {
          clearTimeout(Timeout); SfWorker.removeEventListener('message', Handler);
          const Best = Line.split(/\s+/)[1];
          if (Best?.length >= 4 && !Moves[1]) Moves[1] = { move: Best.slice(0, 4) + (Best.length === 5 ? Best[4] : ''), cp: null };
          resolve(Object.entries(Moves).sort((a, b) => a[0] - b[0]).map(e => e[1]));
        }
      };
      SfWorker.addEventListener('message', Handler);
      UciSend('position fen ' + fen); UciSend('go depth ' + depth);
    });
  }

  // quick eval for reanalysis — just returns the final cp
  function QuickEval(posCmd, depth) {
    return new Promise((resolve) => {
      let LastCp = 0;
      const Timeout = setTimeout(() => { SfWorker.removeEventListener('message', Handler); resolve(LastCp); }, 10000);
      const Handler = (e) => {
        const Line = typeof e.data === 'string' ? e.data : '';
        const ScoreMatch = Line.match(/score\s+(cp\s+[-\d]+|mate\s+[-\d]+)/);
        if (ScoreMatch) LastCp = ParseCp(ScoreMatch[1]);
        if (Line.startsWith('bestmove')) { clearTimeout(Timeout); SfWorker.removeEventListener('message', Handler); resolve(LastCp); }
      };
      SfWorker.addEventListener('message', Handler); UciSend(posCmd); UciSend('go depth ' + depth);
    });
  }

  // get the best move, avoiding repeats when possible
  async function FetchRemote(fen) {
    if (!SfReady) await InitEngine();
    const Key = BoardKey(fen);
    const Played = PositionMoves.get(Key) || [];
    const Candidates = await QueryLocal(fen, EngineDepth);
    if (!Candidates.length) return null;
    let Best = Candidates[0], BestCount = Infinity;
    for (const C of Candidates) {
      const Count = Played.filter(m => m === C.move).length;
      if (Count < RepeatThreshold) return C;
      if (Count < BestCount) { Best = C; BestCount = Count; }
    }
    return Best;
  }

  function FlipFEN(fen) { const Parts = fen.split(' '); Parts[1] = Parts[1] === 'w' ? 'b' : 'w'; return Parts.join(' '); }

  async function QueryOpponentBest(fen) {
    if (!SfReady) await InitEngine();
    const Candidates = await QueryLocal(FlipFEN(fen), EngineDepth);
    return Candidates.length ? Candidates[0].move : null;
  }

  function RecordMove(fen, move) {
    const Key = BoardKey(fen);
    const Played = PositionMoves.get(Key) || [];
    Played.push(move); PositionMoves.set(Key, Played);
  }

  function GetGameMoves() {
    const Board = GetBoard();
    if (!Board?.game) return [];
    let Uci = [];
    // try a few different ways chess.com exposes move history
    try {
      const History = Board.game.getHistory ? Board.game.getHistory() : (Board.game.getMoves ? Board.game.getMoves() : []);
      for (const Move of History) {
        if (typeof Move === 'string' && Move.length >= 4) Uci.push(Move.slice(0, 4) + (Move.length >= 5 && /[qrbn]/.test(Move[4]) ? Move[4] : ''));
        else if (Move?.from && Move?.to) Uci.push(Move.from + Move.to + (Move.promotion || ''));
        else if (Move?.move && typeof Move.move === 'string' && Move.move.length >= 4) Uci.push(Move.move);
      }
    } catch {}
    // verbose history fallback
    if (!Uci.length) {
      try {
        const History = Board.game.getHistory?.({ verbose: true }) || [];
        for (const Move of History) { if (Move?.from && Move?.to) Uci.push(Move.from + Move.to + (Move.promotion || '')); }
      } catch {}
    }
    // raw movelist fallback
    if (!Uci.length) {
      try {
        const Raw = Board.game.rawGame || Board.game._game || Board.game;
        if (Raw?.moveList) {
          const MoveList = Raw.moveList;
          const Moves = typeof MoveList === 'string' ? MoveList.match(/.{1,4}/g) || [] : (Array.isArray(MoveList) ? MoveList : []);
          for (const Move of Moves) { if (typeof Move === 'string' && Move.length >= 4) Uci.push(Move); }
        }
      } catch {}
    }
    return Uci;
  }

  async function ReanalyzeGame() {
    if (!SfReady) await InitEngine();
    if (!SfWorker || !SfReady) return;
    const UciMoves = GetGameMoves();
    if (!UciMoves.length) { ShowLoadingOverlay('No moves found'); setTimeout(HideLoadingOverlay, 1500); return; }
    MoveLog.length = 0;
    const AnalysisDepth = 12;
    const Total = UciMoves.length;
    ShowLoadingOverlay(`Analyzing 0/${Total}…`);
    let PrevCp = await QuickEval('position startpos', AnalysisDepth);
    for (let i = 0; i < Total; i++) {
      ShowLoadingOverlay(`Analyzing ${i + 1}/${Total}…`);
      const Cp = await QuickEval('position startpos moves ' + UciMoves.slice(0, i + 1).join(' '), AnalysisDepth);
      const Cpl = Math.min(500, Math.max(0, PrevCp + Cp));
      MoveLog.push({ color: i % 2 === 0 ? 'w' : 'b', cpl: Cpl });
      PrevCp = Cp;
    }
    RecalcDetection(); HideLoadingOverlay();
  }

  InitEngine();


  // ─────────────────────────────────────────────────
  // board interaction
  // ─────────────────────────────────────────────────

  function ClickSquare(sq) {
    const Board = GetBoard();
    if (!Board) return;
    const Rect = Board.getBoundingClientRect();
    const SqSize = Rect.width / 8;
    const File = sq.charCodeAt(0) - 97;
    const Rank = parseInt(sq[1]);
    const Flipped = IsFlipped();
    const X = Flipped ? Rect.left + (7 - File) * SqSize + SqSize / 2 : Rect.left + File * SqSize + SqSize / 2;
    const Y = Flipped ? Rect.top + (Rank - 1) * SqSize + SqSize / 2 : Rect.top + (8 - Rank) * SqSize + SqSize / 2;
    for (const Type of ['pointerdown', 'pointerup', 'click']) {
      const Cls = Type === 'click' ? MouseEvent : PointerEvent;
      Board.dispatchEvent(new Cls(Type, {
        bubbles: true, cancelable: true, view: window, clientX: X, clientY: Y, button: 0,
        buttons: Type === 'pointerdown' ? 1 : 0, pointerId: 1, isPrimary: true, pointerType: 'mouse',
      }));
    }
  }

  function IsPromotion(fen, from, to) {
    const TargetRank = to[1];
    if (TargetRank !== '8' && TargetRank !== '1') return false;
    const Rows = (fen || '').split(' ')[0]?.split('/') || [];
    const File = from.charCodeAt(0) - 97;
    const RowIdx = 8 - parseInt(from[1]);
    if (RowIdx < 0 || RowIdx > 7) return false;
    const Row = Rows[RowIdx] || '';
    let Col = 0;
    for (const Ch of Row) {
      if (Ch >= '1' && Ch <= '8') Col += parseInt(Ch);
      else { if (Col === File) return Ch === 'P' || Ch === 'p'; Col++; }
    }
    return false;
  }

  async function MakeMove(move) {
    if (!move || move.length < 4) return;
    const From = move.slice(0, 2), To = move.slice(2, 4);
    const FenBefore = GetFEN();
    const NeedsPromo = IsPromotion(FenBefore, From, To);
    const PromoChar = move.length > 4 ? move[4] : 'q';
    for (let Attempt = 0; Attempt < 3; Attempt++) {
      ClickSquare(From);
      await new Promise(r => setTimeout(r, 200 + Attempt * 100));
      ClickSquare(To);
      await new Promise(r => setTimeout(r, 300));
      // handle the promotion popup if needed
      if (NeedsPromo) {
        const Color = GetMyColor() || 'w';
        for (let Try = 0; Try < 8; Try++) {
          const PromoWindow = document.querySelector('.promotion-window, .promotion-area, [class*="promotion"]');
          if (!PromoWindow) { await new Promise(r => setTimeout(r, 150)); continue; }
          const PromoEl = PromoWindow.querySelector(`.${Color}${PromoChar}, [class*="${Color}${PromoChar}"], [data-piece="${PromoChar}"]`)
            || PromoWindow.querySelector(`[class*="${PromoChar}"]`) || PromoWindow.querySelector('[class*="queen"]') || PromoWindow.children[0];
          if (PromoEl) {
            const PromoRect = PromoEl.getBoundingClientRect();
            for (const Type of ['pointerdown', 'pointerup', 'click']) {
              const Cls = Type === 'click' ? MouseEvent : PointerEvent;
              PromoEl.dispatchEvent(new Cls(Type, {
                bubbles: true, cancelable: true, view: window,
                clientX: PromoRect.left + PromoRect.width / 2, clientY: PromoRect.top + PromoRect.height / 2,
                button: 0, buttons: Type === 'pointerdown' ? 1 : 0, pointerId: 1, isPrimary: true, pointerType: 'mouse',
              }));
            }
            break;
          }
          await new Promise(r => setTimeout(r, 150));
        }
        await new Promise(r => setTimeout(r, 300));
      }
      // if the position changed, the move went through
      if (GetFEN() !== FenBefore) break;
    }
  }


  // ─────────────────────────────────────────────────
  // drawing arrows and overlays
  // ─────────────────────────────────────────────────

  let IsDrawing = false;

  function ClearArrows() {
    IsDrawing = true;
    try { GetBoard()?.game?.markings?.removeAll?.(); } catch {}
    document.querySelectorAll('.ch-arrow-svg').forEach(e => e.remove());
    IsDrawing = false;
  }

  function ClearShading() { IsDrawing = true; document.querySelectorAll('.ch-shade-overlay').forEach(e => e.remove()); IsDrawing = false; }
  function ClearOpponentArrow() { IsDrawing = true; document.querySelectorAll('.ch-opponent-svg').forEach(e => e.remove()); IsDrawing = false; }

  function SquareToPct(sq, flipped) {
    const File = sq.charCodeAt(0) - 97, Rank = +sq[1];
    return flipped ? { x: (7 - File) * 12.5 + 6.25, y: (Rank - 1) * 12.5 + 6.25 } : { x: File * 12.5 + 6.25, y: (8 - Rank) * 12.5 + 6.25 };
  }

  // arrow shape: shaft → neck → arrowhead → neck → shaft
  function DrawArrowSVG(board, move, color, opacity, cssClass, zIndex) {
    IsDrawing = true;
    const From = move.slice(0, 2), To = move.slice(2, 4);
    const Flipped = IsFlipped();
    const Start = SquareToPct(From, Flipped), End = SquareToPct(To, Flipped);
    const Dx = End.x - Start.x, Dy = End.y - Start.y, Len = Math.hypot(Dx, Dy);
    if (Len < 0.5) { IsDrawing = false; return; }
    const Ux = Dx / Len, Uy = Dy / Len;
    const TipX = End.x - Ux, TipY = End.y - Uy;
    const BaseX = Start.x + Ux, BaseY = Start.y + Uy;
    const NeckX = TipX - Ux * 4.5, NeckY = TipY - Uy * 4.5;
    const Nx = -Uy, Ny = Ux;
    const Points = [
      [BaseX + Nx * 1.4, BaseY + Ny * 1.4], [NeckX + Nx * 1.4, NeckY + Ny * 1.4],
      [NeckX + Nx * 3.5, NeckY + Ny * 3.5], [TipX, TipY],
      [NeckX - Nx * 3.5, NeckY - Ny * 3.5], [NeckX - Nx * 1.4, NeckY - Ny * 1.4],
      [BaseX - Nx * 1.4, BaseY - Ny * 1.4],
    ];
    let Svg = board.querySelector('.' + cssClass);
    if (!Svg) {
      Svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      Svg.setAttribute('viewBox', '0 0 100 100'); Svg.classList.add(cssClass);
      Svg.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:${zIndex};`;
      if (getComputedStyle(board).position === 'static') board.style.position = 'relative';
      board.appendChild(Svg);
    } else { Svg.innerHTML = ''; }
    const Poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    Poly.setAttribute('points', Points.map(p => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' '));
    Poly.setAttribute('fill', color); Poly.setAttribute('opacity', opacity);
    Poly.setAttribute('filter', `drop-shadow(0 2px 4px ${color}44)`);
    Svg.appendChild(Poly); IsDrawing = false;
  }

  function DrawShading(move) {
    ClearShading();
    const Board = GetBoard();
    if (!Board || !move) return;
    const Rect = Board.getBoundingClientRect(), SqSize = Rect.width / 8, Flipped = IsFlipped();
    if (getComputedStyle(Board).position === 'static') Board.style.position = 'relative';
    for (const Sq of [move.slice(0, 2), move.slice(2, 4)]) {
      const File = Sq.charCodeAt(0) - 97, Rank = parseInt(Sq[1]);
      const Px = Flipped ? (7 - File) * SqSize : File * SqSize;
      const Py = Flipped ? (Rank - 1) * SqSize : (8 - Rank) * SqSize;
      const Overlay = document.createElement('div');
      Overlay.className = 'ch-shade-overlay';
      Overlay.style.cssText = `left:${Px}px;top:${Py}px;width:${SqSize}px;height:${SqSize}px;background:rgba(0,0,0,0.07);`;
      Board.appendChild(Overlay);
    }
  }

  // try native chess.com arrow api first, fall back to svg
  function DrawNativeArrow(move) {
    ClearArrows();
    const Board = GetBoard();
    if (!Board || !move) return;
    try {
      if (Board.game?.markings?.addMany) {
        IsDrawing = true;
        Board.game.markings.addMany([{ data: { from: move.slice(0, 2), to: move.slice(2, 4), color: '#7c5cbf', opacity: 0.8 }, type: 'arrow' }]);
        IsDrawing = false; return;
      }
    } catch { IsDrawing = false; }
    DrawArrowSVG(Board, move, '#7c5cbf', '0.8', 'ch-arrow-svg', 1000);
  }

  function DrawOpponentArrow(move) {
    ClearOpponentArrow();
    const Board = GetBoard();
    if (!Board || !move) return;
    DrawArrowSVG(Board, move, '#ef4444', '0.8', 'ch-opponent-svg', 1002);
  }

  function CpToWinPct(cp) { if (cp == null) return 50; return Math.round(100 / (1 + Math.exp(-0.00368208 * cp))); }

  function UpdateEval(cp, myColor) {
    const Bar = document.getElementById('ch-eval-white');
    const TopPct = document.getElementById('ch-eval-pct-top'), BotPct = document.getElementById('ch-eval-pct-bot');
    const BarWrap = document.getElementById('ch-eval-bar');
    if (!Bar || !TopPct || !BotPct) return;
    const Flipped = myColor === 'b', MyPct = CpToWinPct(cp);
    Bar.style.height = MyPct + '%';
    Bar.style.background = Flipped ? '#222' : '#f0f0f0';
    if (BarWrap) BarWrap.style.background = Flipped ? '#f0f0f0' : 'rgba(10,10,18,0.6)';
    TopPct.textContent = (100 - MyPct) + '%'; BotPct.textContent = MyPct + '%';
    TopPct.style.color = Flipped ? '#111' : '#fff'; BotPct.style.color = Flipped ? '#fff' : '#111';
    TopPct.style.textShadow = Flipped ? '0 1px 3px rgba(255,255,255,0.3)' : '0 1px 3px #000';
    BotPct.style.textShadow = Flipped ? '0 1px 3px #000' : '0 1px 3px rgba(255,255,255,0.3)';
  }


  // ─────────────────────────────────────────────────
  // main loop
  // ─────────────────────────────────────────────────

  let Processing = false;
  let LastFen = '', LastMovedFen = '', LastOppFen = '', LastOppMove = null;
  let WaitingForOpponent = false;

  function AnyActive() {
    return window.chessHelper.autoPlay || window.chessHelper.showArrow || window.chessHelper.hiddenArrow
      || window.chessHelper.showOpponent || window.chessHelper.showEval || window.chessHelper.detection;
  }

  async function Tick() {
    if (!AnyActive() || Processing) return;
    if (!InActiveGame()) return;
    CheckGameChanged();
    const MyTurn = IsMyTurn();

    // not our turn — analyze opponent's position
    if (!MyTurn) {
      WaitingForOpponent = false; LastFen = '';
      const Fen = GetFEN();
      if (Fen && Fen === LastOppFen && LastOppMove && !window.chessHelper.detection) return;
      Processing = true; ClearArrows(); ClearShading();
      if (Fen) {
        try {
          const Candidates = await QueryLocal(Fen, EngineDepth);
          const OppMove = Candidates.length ? Candidates[0].move : null;
          if (Candidates.length && Candidates[0].cp !== null) {
            // track our own moves for self-detection
            if (Detection.lastMyEvalCp !== null && Detection.lastMyEvalFen && Detection.lastMyEvalFen !== Fen) {
              const Cpl = Math.min(500, Math.max(0, Number.isFinite(Detection.lastMyEvalCp + Candidates[0].cp) ? Detection.lastMyEvalCp + Candidates[0].cp : 500));
              MoveLog.push({ color: GetMyColor(), cpl: Cpl });
              if (DetTarget === 'self') {
                Detection.oppMoves++; Detection.totalCpl += Cpl;
                if (Cpl <= 5) Detection.bestMoves++; else if (Cpl <= 20) Detection.topThree++;
                if (Cpl > 200) Detection.blunders++; UpdateDetectionUI();
              }
              Detection.lastMyEvalCp = null; Detection.lastMyEvalFen = null;
            }
            Detection.lastOppEvalCp = Candidates[0].cp; Detection.lastOppEvalFen = Fen;
            if (window.chessHelper.showEval) UpdateEval(-Candidates[0].cp, GetMyColor());
          }
          LastOppFen = Fen; LastOppMove = OppMove;
          if (window.chessHelper.showOpponent && OppMove) DrawOpponentArrow(OppMove); else ClearOpponentArrow();
        } catch {}
      } else { ClearOpponentArrow(); }
      Processing = false; return;
    }

    // our turn
    LastOppFen = ''; LastOppMove = null;
    const Fen = GetFEN();
    if (!Fen || Fen === LastFen) return;
    if (window.chessHelper.autoPlay && (Fen === LastMovedFen || WaitingForOpponent)) return;
    Processing = true; ThinkingEl.classList.add('active');
    try {
      const Result = await FetchRemote(Fen);
      ThinkingEl.classList.remove('active');
      if (!Result) return;
      const Mv = Result.move;
      UpdateEval(Result.cp, GetMyColor());
      // track opponent's move quality for detection
      if (Detection.lastOppEvalCp !== null && Result.cp != null && Detection.lastOppEvalFen && Detection.lastOppEvalFen !== Fen) {
        const Cpl = Math.min(500, Math.max(0, Number.isFinite(Detection.lastOppEvalCp + Result.cp) ? Detection.lastOppEvalCp + Result.cp : 500));
        const OppColor = GetMyColor() === 'w' ? 'b' : 'w';
        MoveLog.push({ color: OppColor, cpl: Cpl });
        if (DetTarget === 'opponent') {
          Detection.oppMoves++; Detection.totalCpl += Cpl;
          if (Cpl <= 5) Detection.bestMoves++; else if (Cpl <= 20) Detection.topThree++;
          if (Cpl > 200) Detection.blunders++; UpdateDetectionUI();
        }
        Detection.lastOppEvalCp = null; Detection.lastOppEvalFen = null;
      }
      if (Result.cp !== null) { Detection.lastMyEvalCp = Result.cp; Detection.lastMyEvalFen = Fen; }
      LastFen = Fen;
      if (window.chessHelper.hiddenArrow) { DrawShading(Mv); ClearArrows(); }
      else if (window.chessHelper.showArrow) { DrawNativeArrow(Mv); ClearShading(); }
      if (window.chessHelper.showOpponent) {
        const OppBest = await QueryOpponentBest(Fen);
        if (OppBest) DrawOpponentArrow(OppBest); else ClearOpponentArrow();
      } else { ClearOpponentArrow(); }
      if (window.chessHelper.autoPlay) {
        if (DelayEnabled) await new Promise(r => setTimeout(r, (DelayMin + Math.random() * (DelayMax - DelayMin)) * 1000));
        if (!window.chessHelper.autoPlay) return;
        RecordMove(Fen, Mv); await MakeMove(Mv);
        if (GetFEN() !== Fen) { LastMovedFen = GetFEN(); WaitingForOpponent = true; }
        else { LastFen = ''; }
      }
    } catch {} finally { Processing = false; ThinkingEl.classList.remove('active'); }
  }

  const Observer = new MutationObserver(() => { if (!IsDrawing && AnyActive()) Tick(); });
  function WatchBoard() {
    const Board = GetBoard();
    if (Board) Observer.observe(Board, { childList: true, subtree: true, attributes: true });
    else setTimeout(WatchBoard, 1000);
  }
  WatchBoard();
  setInterval(Tick, 500);


  // ─────────────────────────────────────────────────
  // ui build
  // ─────────────────────────────────────────────────

  const Root = document.createElement('div');
  Root.id = 'chess-helper-root';

  const Wrap = document.createElement('div');
  Wrap.id = 'chess-helper-wrap';

  const Bubble = document.createElement('div');
  Bubble.id = 'chess-helper-bubble';

  const Panel = document.createElement('div');
  Panel.id = 'chess-helper-panel';
  Panel.innerHTML = `
    <div class="ch-sidebar">
      <div class="ch-sidebar-logo">meko.gg</div>
      <div class="ch-sidebar-sub">@snippetcarried</div>
      <div class="ch-sidebar-section">Modules</div>
      <button class="ch-nav-item active" data-page="gameplay"><span class="ch-nav-dot"></span>Gameplay</button>
      <button class="ch-nav-item" data-page="detection"><span class="ch-nav-dot"></span>Detection</button>
      <button class="ch-nav-item" data-page="skins"><span class="ch-nav-dot"></span>Skins</button>
      <button class="ch-nav-item" data-page="settings"><span class="ch-nav-dot"></span>Settings</button>
      <div class="ch-sidebar-footer"><a href="https://meko.gg" target="_blank" rel="noopener">meko.gg</a> · <a href="https://github.com/snippetcarried" target="_blank" rel="noopener">github</a></div>
    </div>
    <div class="ch-content">
      <div class="ch-page active" id="ch-page-gameplay">
        <div class="ch-page-title">Gameplay</div>
        <div class="ch-thinking" id="ch-thinking">Thinking…</div>
        <div class="ch-section-label">Engine</div>
        <div class="ch-slider-row">
          <span class="ch-slider-label">Depth</span>
          <input type="range" class="ch-range" id="ch-depth" min="1" max="24" value="16">
          <span class="ch-slider-val" id="ch-depth-val">16</span>
        </div>
        <div class="ch-section-label">Moves</div>
        <div class="ch-row"><span class="ch-label">Best move</span><span class="ch-keybind" data-bind="arrow">—</span><label class="ch-switch"><input type="checkbox" id="ch-arrow"><span class="ch-slider"></span></label></div>
        <div class="ch-row"><span class="ch-label">Hidden arrows</span><span class="ch-keybind" data-bind="hidden">—</span><label class="ch-switch"><input type="checkbox" id="ch-hidden"><span class="ch-slider"></span></label></div>
        <div class="ch-row"><span class="ch-label">Auto-play</span><span class="ch-keybind" data-bind="auto">—</span><label class="ch-switch"><input type="checkbox" id="ch-auto"><span class="ch-slider"></span></label></div>
        <div class="ch-row"><span class="ch-label">Opponent's best</span><span class="ch-keybind" data-bind="opponent">—</span><label class="ch-switch"><input type="checkbox" id="ch-opponent"><span class="ch-slider"></span></label></div>
        <div class="ch-row"><span class="ch-label">Win percent</span><span class="ch-keybind" data-bind="eval">—</span><label class="ch-switch"><input type="checkbox" id="ch-eval"><span class="ch-slider"></span></label></div>
        <div class="ch-status-row"><span class="ch-status-label">Status</span><span class="ch-status-value" id="ch-engine-status">Loading…</span></div>
        <button class="ch-btn ch-btn-accent" id="ch-analyze" style="margin-top:3px;">Analyze once</button>
      </div>
      <div class="ch-page" id="ch-page-detection">
        <div class="ch-page-title">Detection</div>
        <div class="ch-det-toggle-row">
          <button id="ch-det-opp" class="ch-det-btn active">Opponent</button>
          <button id="ch-det-self" class="ch-det-btn">You</button>
        </div>
        <div class="ch-detect-stat"><span class="ch-detect-label">Moves analyzed</span><span class="ch-detect-value" id="ch-det-moves">0</span></div>
        <div class="ch-detect-stat"><span class="ch-detect-label">Avg CPL</span><span class="ch-detect-value" id="ch-det-acpl">—</span></div>
        <div class="ch-detect-stat"><span class="ch-detect-label">Best move rate</span><span class="ch-detect-value" id="ch-det-bmr">—</span></div>
        <div class="ch-detect-stat"><span class="ch-detect-label">Accuracy</span><span class="ch-detect-value" id="ch-det-acc">—</span></div>
        <div class="ch-detect-stat"><span class="ch-detect-label">Suspicion</span><span class="ch-detect-value" id="ch-det-score">—</span></div>
        <div class="ch-detect-gauge"><div class="ch-detect-fill" id="ch-det-fill"></div></div>
        <div class="ch-detect-verdict" id="ch-det-verdict">Waiting for moves…</div>
        <div style="display:flex;gap:4px;margin-top:3px;">
          <button class="ch-btn" id="ch-det-reanalyze" style="flex:1;">Re-analyze</button>
          <button class="ch-btn" id="ch-det-reset" style="flex:1;">Reset</button>
        </div>
      </div>
      <div class="ch-page" id="ch-page-skins">
        <div class="ch-page-title">Skins</div>
        <div class="ch-skins-grid" id="ch-skins-grid">
          <div class="ch-skins-row-label">White</div>
          <div class="ch-skin-tile" data-skin="wk"><span class="ch-skin-label"><img src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wk.png" style="width:24px;height:24px;pointer-events:none;"></span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skin-tile" data-skin="wq"><span class="ch-skin-label"><img src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wq.png" style="width:24px;height:24px;pointer-events:none;"></span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skin-tile" data-skin="wr"><span class="ch-skin-label"><img src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wr.png" style="width:24px;height:24px;pointer-events:none;"></span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skin-tile" data-skin="wb"><span class="ch-skin-label"><img src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wb.png" style="width:24px;height:24px;pointer-events:none;"></span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skin-tile" data-skin="wn"><span class="ch-skin-label"><img src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wn.png" style="width:24px;height:24px;pointer-events:none;"></span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skin-tile" data-skin="wp"><span class="ch-skin-label"><img src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/wp.png" style="width:24px;height:24px;pointer-events:none;"></span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skins-row-label">Black</div>
          <div class="ch-skin-tile" data-skin="bk"><span class="ch-skin-label"><img src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bk.png" style="width:24px;height:24px;pointer-events:none;"></span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skin-tile" data-skin="bq"><span class="ch-skin-label"><img src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bq.png" style="width:24px;height:24px;pointer-events:none;"></span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skin-tile" data-skin="br"><span class="ch-skin-label"><img src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/br.png" style="width:24px;height:24px;pointer-events:none;"></span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skin-tile" data-skin="bb"><span class="ch-skin-label"><img src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bb.png" style="width:24px;height:24px;pointer-events:none;"></span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skin-tile" data-skin="bn"><span class="ch-skin-label"><img src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bn.png" style="width:24px;height:24px;pointer-events:none;"></span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skin-tile" data-skin="bp"><span class="ch-skin-label"><img src="https://images.chesscomfiles.com/chess-themes/pieces/neo/150/bp.png" style="width:24px;height:24px;pointer-events:none;"></span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skins-row-label">Board</div>
          <div class="ch-skin-tile" data-skin="board" style="grid-column:2/6;aspect-ratio:4/1;"><span class="ch-skin-label" style="font-size:10px;">Board BG</span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skins-row-label">Tiles</div>
          <div class="ch-skin-tile wide" data-skin="lightTiles"><span class="ch-skin-label" style="font-size:10px;">Light</span><button class="ch-skin-remove">×</button></div>
          <div class="ch-skin-tile wide" data-skin="darkTiles"><span class="ch-skin-label" style="font-size:10px;">Dark</span><button class="ch-skin-remove">×</button></div>
        </div>
        <div class="ch-row"><span class="ch-label">Piece mask</span><label class="ch-switch"><input type="checkbox" id="ch-skin-mask"><span class="ch-slider"></span></label></div>
        <button class="ch-btn" id="ch-skins-reset">Reset all skins</button>
      </div>
      <div class="ch-page" id="ch-page-settings">
        <div class="ch-page-title">Settings</div>
        <div class="ch-section-label">Auto-play Delay</div>
        <div class="ch-row"><span class="ch-label">Move delay</span><span class="ch-keybind" data-bind="delay">—</span><label class="ch-switch"><input type="checkbox" id="ch-delay-toggle"><span class="ch-slider"></span></label></div>
        <div id="ch-delay-sliders" style="display:none">
          <div class="ch-slider-row" style="margin-top:3px"><span class="ch-slider-label">Min</span><input type="range" class="ch-range" id="ch-delay-min" min="0" max="15" value="1" step="0.5"><span class="ch-slider-val" id="ch-delay-min-val">1.0s</span></div>
          <div class="ch-slider-row" style="margin-top:2px"><span class="ch-slider-label">Max</span><input type="range" class="ch-range" id="ch-delay-max" min="0" max="15" value="5" step="0.5"><span class="ch-slider-val" id="ch-delay-max-val">5.0s</span></div>
        </div>
        <div class="ch-section-label">Visibility</div>
        <div class="ch-row"><span class="ch-label">Hide all</span><span class="ch-keybind" data-bind="hide">—</span></div>
        <div class="ch-section-label">Keybinds</div>
        <div style="font-size:9px;color:var(--ch-text-muted);padding:2px 0 3px;">Click any keybind badge to record a shortcut</div>
      </div>
    </div>
  `;

  const EvalBar = document.createElement('div');
  EvalBar.id = 'ch-eval-bar';
  EvalBar.innerHTML = '<div id="ch-eval-pct-top" class="ch-eval-pct">50%</div><div id="ch-eval-white"></div><div id="ch-eval-pct-bot" class="ch-eval-pct">50%</div>';
  EvalBar.style.display = 'none';

  // panel + eval sit in a horizontal row below the bubble
  const PanelRow = document.createElement('div');
  PanelRow.style.cssText = 'display:flex;align-items:stretch;';
  PanelRow.append(Panel, EvalBar);

  Wrap.append(Bubble, PanelRow);
  Root.appendChild(Wrap);
  document.body.appendChild(Root);

  const ThinkingEl = Panel.querySelector('#ch-thinking');
  const StatusEl = Panel.querySelector('#ch-engine-status');
  const StatusCheck = setInterval(() => {
    if (SfReady) { StatusEl.textContent = 'Ready'; StatusEl.style.color = 'var(--ch-green)'; clearInterval(StatusCheck); }
  }, 500);


  // ─────────────────────────────────────────────────
  // sidebar navigation
  // ─────────────────────────────────────────────────

  Panel.querySelectorAll('.ch-nav-item').forEach(Nav => {
    Nav.onclick = () => {
      Panel.querySelectorAll('.ch-nav-item').forEach(n => n.classList.remove('active'));
      Panel.querySelectorAll('.ch-page').forEach(p => p.classList.remove('active'));
      Nav.classList.add('active');
      const Page = Panel.querySelector('#ch-page-' + Nav.dataset.page);
      if (Page) Page.classList.add('active');
    };
  });


  // ─────────────────────────────────────────────────
  // detection controls
  // ─────────────────────────────────────────────────

  Panel.querySelector('#ch-det-reset').onclick = ResetDetection;
  Panel.querySelector('#ch-det-reanalyze').onclick = ReanalyzeGame;

  function SetDetTarget(target) {
    if (DetTarget === target) return;
    DetTarget = target;
    Panel.querySelector('#ch-det-opp').classList.toggle('active', target === 'opponent');
    Panel.querySelector('#ch-det-self').classList.toggle('active', target === 'self');
    RecalcDetection();
  }
  Panel.querySelector('#ch-det-opp').onclick = () => SetDetTarget('opponent');
  Panel.querySelector('#ch-det-self').onclick = () => SetDetTarget('self');


  // ─────────────────────────────────────────────────
  // skins system
  // ─────────────────────────────────────────────────

  const SkinCodes = ['wk', 'wq', 'wr', 'wb', 'wn', 'wp', 'bk', 'bq', 'br', 'bb', 'bn', 'bp', 'board', 'lightTiles', 'darkTiles'];
  let SavedSkins = {};
  try { SavedSkins = JSON.parse(localStorage.getItem('ch-skins') || '{}'); } catch {}
  let SkinMaskMode = localStorage.getItem('ch-skin-mask') === '1';
  const SkinStyleEl = document.createElement('style');
  SkinStyleEl.id = 'ch-custom-skins';
  document.head.appendChild(SkinStyleEl);

  function GetOriginalPieceUrl(code) {
    const CssVar = getComputedStyle(document.documentElement).getPropertyValue('--theme-piece-set-' + code);
    if (CssVar) { const Match = CssVar.match(/url\(["']?(.*?)["']?\)/); if (Match) return Match[1]; }
    const El = document.querySelector('.piece.' + code);
    if (El) { const Bg = getComputedStyle(El).backgroundImage; const Match = Bg.match(/url\(["']?(.*?)["']?\)/); if (Match) return Match[1]; }
    return 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/' + code + '.png';
  }

  function ClearInlineSkins() {
    document.querySelectorAll('[data-ch-skin]').forEach(El => {
      for (const Prop of ['background-image', 'background-size', 'background-position', 'background-repeat', '-webkit-mask-image', 'mask-image', '-webkit-mask-size', 'mask-size', 'animation']) El.style.removeProperty(Prop);
      delete El.dataset.chSkin;
    });
  }

  // continuously re-apply skins since chess.com overrides them on piece movement
  let SkinLoopRunning = false;
  function SkinEnforceLoop() {
    if (!SkinLoopRunning) return;
    if (!SkinCodes.slice(0, 12).some(c => SavedSkins[c])) { SkinLoopRunning = false; return; }
    const Board = GetBoard();
    if (Board) {
      for (const Code of SkinCodes.slice(0, 12)) {
        if (!SavedSkins[Code]) continue;
        Board.querySelectorAll(`.piece.${Code},.promotion-piece.${Code}`).forEach(El => {
          if (El.dataset.chSkin === SavedSkins[Code]) return;
          El.style.setProperty('background-image', `url("${SavedSkins[Code]}")`, 'important');
          if (SkinMaskMode) {
            const Orig = GetOriginalPieceUrl(Code);
            El.style.setProperty('-webkit-mask-image', `url("${Orig}")`, 'important');
            El.style.setProperty('mask-image', `url("${Orig}")`, 'important');
            El.style.setProperty('-webkit-mask-size', 'contain', 'important');
            El.style.setProperty('mask-size', 'contain', 'important');
            El.style.setProperty('background-size', 'cover', 'important');
          } else { El.style.setProperty('background-size', 'contain', 'important'); }
          El.style.setProperty('animation', 'none', 'important');
          El.dataset.chSkin = SavedSkins[Code];
        });
      }
    }
    requestAnimationFrame(SkinEnforceLoop);
  }
  function StartSkinLoop() {
    if (!SkinLoopRunning && SkinCodes.slice(0, 12).some(c => SavedSkins[c])) { SkinLoopRunning = true; requestAnimationFrame(SkinEnforceLoop); }
  }

  function UpdateTileOverlays() {
    document.querySelectorAll('.ch-tile-overlay').forEach(El => El.remove());
    if (!SavedSkins.lightTiles && !SavedSkins.darkTiles) return;
    const Board = GetBoard();
    if (!Board) return;
    const CreateOverlay = (url, light) => {
      const Div = document.createElement('div'); Div.className = 'ch-tile-overlay';
      const Grad = light ? 'repeating-conic-gradient(#fff 0% 25%,transparent 0% 50%)' : 'repeating-conic-gradient(transparent 0% 25%,#fff 0% 50%)';
      const BgSize = SkinMaskMode ? '12.5% 12.5%' : 'cover';
      Div.style.cssText = `position:absolute;inset:0;pointer-events:none;z-index:1;background-image:url("${url}");background-size:${BgSize};background-position:${SkinMaskMode ? '0 0' : 'center'};background-repeat:${SkinMaskMode ? 'round' : 'repeat'};-webkit-mask-image:${Grad};mask-image:${Grad};-webkit-mask-size:25% 25%;mask-size:25% 25%;`;
      Board.appendChild(Div);
    };
    if (SavedSkins.lightTiles) CreateOverlay(SavedSkins.lightTiles, true);
    if (SavedSkins.darkTiles) CreateOverlay(SavedSkins.darkTiles, false);
  }

  function ApplySkins() {
    let Css = '';
    for (const Code of SkinCodes.slice(0, 12)) {
      if (!SavedSkins[Code]) continue;
      const Sel = `.piece.${Code},.promotion-piece.${Code}`;
      if (SkinMaskMode) {
        const Orig = GetOriginalPieceUrl(Code);
        Css += `${Sel}{-webkit-mask-image:url("${Orig}");mask-image:url("${Orig}");-webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center;background-image:url("${SavedSkins[Code]}")!important;background-size:cover!important;background-position:center!important;animation:none!important}\n`;
      } else {
        Css += `${Sel}{background-image:url("${SavedSkins[Code]}")!important;background-size:contain!important;background-repeat:no-repeat!important;background-position:center!important;animation:none!important}\n`;
      }
    }
    if (SavedSkins.board) Css += `.board,#board-vs-personalities,#board-single,#board-board,.fade-in-overlay{background-image:url("${SavedSkins.board}")!important;background-size:cover!important;background-position:center!important}\n`;
    SkinStyleEl.textContent = Css;
    const Board = GetBoard();
    if (Board) {
      if (SavedSkins.board) {
        Board.style.setProperty('background-image', `url("${SavedSkins.board}")`, 'important');
        Board.style.setProperty('background-size', 'cover', 'important');
        Board.style.setProperty('background-position', 'center', 'important');
      } else { Board.style.removeProperty('background-image'); Board.style.removeProperty('background-size'); Board.style.removeProperty('background-position'); }
    }
    UpdateTileOverlays(); ClearInlineSkins(); StartSkinLoop();
  }

  function RenderSkinTiles() {
    Panel.querySelectorAll('.ch-skin-tile').forEach(Tile => {
      const Code = Tile.dataset.skin;
      if (SavedSkins[Code]) { Tile.style.backgroundImage = `url("${SavedSkins[Code]}")`; Tile.classList.add('has-skin'); }
      else { Tile.style.backgroundImage = ''; Tile.classList.remove('has-skin'); }
    });
  }

  const SkinInput = document.createElement('input');
  SkinInput.type = 'file'; SkinInput.accept = 'image/*'; SkinInput.hidden = true;
  document.body.appendChild(SkinInput);
  let ActiveSkinCode = null;

  Panel.querySelector('#ch-skins-grid').addEventListener('click', e => {
    const RemoveBtn = e.target.closest('.ch-skin-remove');
    const Tile = e.target.closest('.ch-skin-tile');
    if (!Tile) return;
    if (RemoveBtn) {
      delete SavedSkins[Tile.dataset.skin];
      try { localStorage.setItem('ch-skins', JSON.stringify(SavedSkins)); } catch {}
      RenderSkinTiles(); ApplySkins(); return;
    }
    ActiveSkinCode = Tile.dataset.skin; SkinInput.click();
  });

  SkinInput.onchange = () => {
    const File = SkinInput.files[0];
    if (!File || !ActiveSkinCode) return;
    const Reader = new FileReader();
    Reader.onload = ev => {
      SavedSkins[ActiveSkinCode] = ev.target.result;
      try { localStorage.setItem('ch-skins', JSON.stringify(SavedSkins)); } catch {}
      RenderSkinTiles(); ApplySkins();
    };
    Reader.readAsDataURL(File); SkinInput.value = '';
  };

  Panel.querySelector('#ch-skins-reset').onclick = () => {
    SavedSkins = {};
    try { localStorage.setItem('ch-skins', '{}'); } catch {}
    RenderSkinTiles(); ApplySkins();
  };

  const MaskToggle = Panel.querySelector('#ch-skin-mask');
  MaskToggle.checked = SkinMaskMode;
  MaskToggle.onchange = () => { SkinMaskMode = MaskToggle.checked; localStorage.setItem('ch-skin-mask', SkinMaskMode ? '1' : '0'); ApplySkins(); };
  RenderSkinTiles(); ApplySkins();


  // ─────────────────────────────────────────────────
  // panel controls
  // ─────────────────────────────────────────────────

  Panel.querySelector('#ch-depth').oninput = e => { EngineDepth = parseInt(e.target.value); Panel.querySelector('#ch-depth-val').textContent = EngineDepth; };
  Panel.querySelector('#ch-delay-toggle').onchange = e => { DelayEnabled = e.target.checked; Panel.querySelector('#ch-delay-sliders').style.display = e.target.checked ? '' : 'none'; };

  const DelayMinSlider = Panel.querySelector('#ch-delay-min'), DelayMaxSlider = Panel.querySelector('#ch-delay-max');
  const DelayMinVal = Panel.querySelector('#ch-delay-min-val'), DelayMaxVal = Panel.querySelector('#ch-delay-max-val');

  DelayMinSlider.oninput = e => {
    DelayMin = parseFloat(e.target.value);
    if (DelayMin > DelayMax) { DelayMax = DelayMin; DelayMaxSlider.value = DelayMax; DelayMaxVal.textContent = DelayMax + 's'; }
    DelayMinVal.textContent = DelayMin + 's';
  };
  DelayMaxSlider.oninput = e => {
    DelayMax = parseFloat(e.target.value);
    if (DelayMax < DelayMin) { DelayMin = DelayMax; DelayMinSlider.value = DelayMin; DelayMinVal.textContent = DelayMin + 's'; }
    DelayMaxVal.textContent = DelayMax + 's';
  };

  Panel.querySelector('#ch-arrow').onchange = e => { window.chessHelper.showArrow = e.target.checked; if (!e.target.checked) ClearArrows(); else { LastFen = ''; Tick(); } };
  Panel.querySelector('#ch-hidden').onchange = e => { window.chessHelper.hiddenArrow = e.target.checked; if (!e.target.checked) ClearShading(); else { LastFen = ''; Tick(); } };
  Panel.querySelector('#ch-auto').onchange = e => {
    window.chessHelper.autoPlay = e.target.checked;
    if (e.target.checked) { LastFen = ''; LastMovedFen = ''; WaitingForOpponent = false; Tick(); for (let i = 1; i <= 5; i++) setTimeout(Tick, i * 1000); }
  };
  Panel.querySelector('#ch-opponent').onchange = e => { window.chessHelper.showOpponent = e.target.checked; if (!e.target.checked) ClearOpponentArrow(); else { LastFen = ''; Tick(); } };
  Panel.querySelector('#ch-eval').onchange = e => { window.chessHelper.showEval = e.target.checked; EvalBar.style.display = e.target.checked ? '' : 'none'; if (e.target.checked) { LastFen = ''; LastOppFen = ''; Tick(); } };

  Panel.querySelector('#ch-analyze').onclick = async () => {
    const Btn = Panel.querySelector('#ch-analyze');
    Btn.textContent = 'Analyzing…'; ThinkingEl.classList.add('active');
    if (!InActiveGame()) { Btn.textContent = 'No game'; ThinkingEl.classList.remove('active'); setTimeout(() => Btn.textContent = 'Analyze once', 1500); return; }
    const Fen = GetFEN();
    if (!Fen) { Btn.textContent = 'No game'; ThinkingEl.classList.remove('active'); setTimeout(() => Btn.textContent = 'Analyze once', 1500); return; }
    try {
      if (!IsMyTurn()) {
        const Candidates = await QueryLocal(Fen, EngineDepth);
        const OppMove = Candidates.length ? Candidates[0].move : null;
        ThinkingEl.classList.remove('active');
        if (OppMove) { DrawOpponentArrow(OppMove); Btn.textContent = `Opp: ${OppMove.toUpperCase()}`; }
        else { Btn.textContent = 'No result'; }
        setTimeout(() => Btn.textContent = 'Analyze once', 2500); return;
      }
      const Result = await FetchRemote(Fen);
      ThinkingEl.classList.remove('active');
      if (Result) {
        UpdateEval(Result.cp, GetMyColor());
        if (window.chessHelper.hiddenArrow) { DrawShading(Result.move); ClearArrows(); } else DrawNativeArrow(Result.move);
        Btn.textContent = `Best: ${Result.move.toUpperCase()}`;
      } else { Btn.textContent = 'No result'; }
      setTimeout(() => Btn.textContent = 'Analyze once', 2500);
    } catch { ThinkingEl.classList.remove('active'); Btn.textContent = 'Error'; setTimeout(() => Btn.textContent = 'Analyze once', 2000); }
  };


  // ─────────────────────────────────────────────────
  // unified drag — bubble drags everything
  // ─────────────────────────────────────────────────

  const DragThreshold = 4;
  let WrapX = window.innerWidth - 60, WrapY = 20;
  let Dragging = false, DragMoved = false;
  let DragStartX = 0, DragStartY = 0;
  let DragOffsetX = 0, DragOffsetY = 0;
  let PanelOpen = false;

  function SetWrapPos() { Wrap.style.transform = `translate3d(${WrapX}px,${WrapY}px,0)`; }
  SetWrapPos();

  function OnDragDown(e) {
    e.preventDefault();
    Dragging = true; DragMoved = false;
    const Point = e.touches ? e.touches[0] : e;
    DragOffsetX = Point.clientX - WrapX; DragOffsetY = Point.clientY - WrapY;
    DragStartX = Point.clientX; DragStartY = Point.clientY;
  }

  // drag from bubble or sidebar header
  Bubble.addEventListener('mousedown', OnDragDown);
  Bubble.addEventListener('touchstart', OnDragDown, { passive: false });

  const Sidebar = Panel.querySelector('.ch-sidebar');
  Sidebar.addEventListener('mousedown', e => {
    // don't interfere with nav clicks or footer links
    if (e.target.closest('.ch-nav-item') || e.target.closest('.ch-sidebar-footer')) return;
    OnDragDown(e);
  });

  document.addEventListener('mousemove', OnDragMove);
  document.addEventListener('touchmove', OnDragMove);

  function OnDragMove(e) {
    if (!Dragging) return;
    const Point = e.touches ? e.touches[0] : e;
    const Dx = Math.abs(Point.clientX - DragStartX), Dy = Math.abs(Point.clientY - DragStartY);
    // ignore tiny movements so clicks don't accidentally become drags
    if (!DragMoved && Dx < DragThreshold && Dy < DragThreshold) return;
    if (!DragMoved) { DragMoved = true; Wrap.classList.add('dragging'); }
    WrapX = Math.max(-10, Math.min(Point.clientX - DragOffsetX, innerWidth - 30));
    WrapY = Math.max(-5, Math.min(Point.clientY - DragOffsetY, innerHeight - 30));
    SetWrapPos();
  }

  function OnDragUp(e) {
    if (!Dragging) return;
    Dragging = false; Wrap.classList.remove('dragging');
    // if we didn't drag, toggle the panel
    if (!DragMoved) {
      const ClickedBubble = e.target === Bubble || Bubble.contains(e.target);
      if (ClickedBubble) {
        PanelOpen = !PanelOpen;
        Wrap.classList.toggle('open', PanelOpen);
      }
    }
  }

  document.addEventListener('mouseup', OnDragUp);
  document.addEventListener('touchend', OnDragUp);


  // ─────────────────────────────────────────────────
  // hide/show everything
  // ─────────────────────────────────────────────────

  let UiHidden = false, AutoPlayBeforeHide = false;

  function ToggleUI() {
    UiHidden = !UiHidden;
    Root.style.display = UiHidden ? 'none' : '';
    if (UiHidden) {
      ClearArrows(); ClearShading(); ClearOpponentArrow();
      AutoPlayBeforeHide = window.chessHelper.autoPlay;
      if (AutoPlayBeforeHide) { window.chessHelper.autoPlay = false; Panel.querySelector('#ch-auto').checked = false; }
    } else {
      if (AutoPlayBeforeHide) { window.chessHelper.autoPlay = true; Panel.querySelector('#ch-auto').checked = true; }
      LastFen = ''; Tick();
    }
  }


  // ─────────────────────────────────────────────────
  // keybind system
  // ─────────────────────────────────────────────────

  const Binds = { hide: null, arrow: null, hidden: null, auto: null, delay: null, opponent: null, eval: null };
  let RecordingBind = null, RecordingHeldMods = null;
  const KeyNames = { ' ': 'Space', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right' };
  const ModKeys = new Set(['Control', 'Shift', 'Alt', 'Meta']);

  function PrettyKey(key) { return KeyNames[key] || (key.length === 1 ? key.toUpperCase() : key); }

  function LiveLabel(e) {
    const Parts = [];
    if (e.ctrlKey) Parts.push('Ctrl'); if (e.altKey) Parts.push('Alt');
    if (e.shiftKey) Parts.push('Shift'); if (e.metaKey) Parts.push('Win');
    if (!ModKeys.has(e.key)) Parts.push(PrettyKey(e.key));
    return Parts.join('+') || '—';
  }

  function KeyLabel(k) {
    if (!k) return '—';
    const Parts = [];
    if (k.ctrl) Parts.push('Ctrl'); if (k.alt) Parts.push('Alt');
    if (k.shift) Parts.push('Shift'); if (k.meta) Parts.push('Win');
    if (k.key) Parts.push(PrettyKey(k.key));
    return Parts.join('+') || '—';
  }

  function MatchesKey(e, k) {
    if (!k?.key) return false;
    return e.ctrlKey === !!k.ctrl && e.altKey === !!k.alt && e.shiftKey === !!k.shift && e.metaKey === !!k.meta && e.key.toLowerCase() === k.key.toLowerCase();
  }

  // fingerprint a keybind for conflict detection
  function BindFingerprint(k) {
    if (!k) return '';
    const Parts = [];
    if (k.ctrl) Parts.push('c'); if (k.alt) Parts.push('a'); if (k.shift) Parts.push('s'); if (k.meta) Parts.push('m');
    if (k.key) Parts.push(k.key.toLowerCase());
    return Parts.join('|');
  }

  function CancelRecording() {
    if (!RecordingBind) return;
    RecordingBind.el.textContent = KeyLabel(Binds[RecordingBind.name]);
    RecordingBind.el.classList.remove('recording'); RecordingBind = null;
  }

  function CommitBind(newKey) {
    const Name = RecordingBind.name, Fp = BindFingerprint(newKey);
    for (const [Other, Key] of Object.entries(Binds)) {
      if (Other !== Name && Key && BindFingerprint(Key) === Fp) {
        Binds[Other] = null;
        const OtherEl = Panel.querySelector(`.ch-keybind[data-bind="${Other}"]`);
        if (OtherEl) OtherEl.textContent = '—';
      }
    }
    Binds[Name] = newKey; RecordingBind.el.textContent = KeyLabel(newKey);
    RecordingBind.el.classList.remove('recording'); RecordingBind = null;
  }

  Panel.querySelectorAll('.ch-keybind[data-bind]').forEach(El => {
    El.onclick = ev => {
      ev.stopPropagation();
      if (RecordingBind?.el === El) { CancelRecording(); return; }
      CancelRecording();
      RecordingBind = { name: El.dataset.bind, el: El };
      El.textContent = '…'; El.classList.add('recording');
    };
  });

  document.addEventListener('click', e => { if (RecordingBind && !e.target.closest('.ch-keybind')) CancelRecording(); });

  function ToggleBind(name) {
    const Map = { arrow: '#ch-arrow', hidden: '#ch-hidden', auto: '#ch-auto', delay: '#ch-delay-toggle', opponent: '#ch-opponent', eval: '#ch-eval' };
    const Checkbox = Panel.querySelector(Map[name]);
    if (!Checkbox) return;
    Checkbox.checked = !Checkbox.checked; Checkbox.dispatchEvent(new Event('change'));
  }

  // track solo modifier key presses (e.g. just pressing shift to toggle something)
  let SoloModKey = null, SoloModTime = 0;

  function MatchModOnly(e, k) {
    if (!k || k.key) return false;
    return (!!k.ctrl === (e.key === 'Control')) && (!!k.alt === (e.key === 'Alt')) && (!!k.shift === (e.key === 'Shift')) && (!!k.meta === (e.key === 'Meta'));
  }

  document.addEventListener('keydown', e => {
    if (RecordingBind) {
      if (e.key === 'Escape') { CancelRecording(); return; }
      e.preventDefault(); e.stopPropagation();
      RecordingBind.el.textContent = LiveLabel(e);
      if (ModKeys.has(e.key)) {
        RecordingHeldMods = { ctrl: e.ctrlKey || e.key === 'Control', alt: e.altKey || e.key === 'Alt', shift: e.shiftKey || e.key === 'Shift', meta: e.metaKey || e.key === 'Meta', key: null };
      } else { RecordingHeldMods = null; CommitBind({ ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, meta: e.metaKey, key: e.key }); }
      return;
    }
    if (ModKeys.has(e.key)) { SoloModKey = e.key; SoloModTime = Date.now(); } else SoloModKey = null;
    for (const Name of ['hide', 'arrow', 'hidden', 'auto', 'delay', 'opponent', 'eval']) {
      if (MatchesKey(e, Binds[Name])) { e.preventDefault(); if (Name === 'hide') ToggleUI(); else ToggleBind(Name); return; }
    }
  });

  document.addEventListener('keyup', e => {
    // commit modifier-only bind on release
    if (RecordingBind && RecordingHeldMods) { CommitBind(RecordingHeldMods); RecordingHeldMods = null; return; }
    // solo modifier tap detection
    if (!ModKeys.has(e.key) || !SoloModKey || e.key !== SoloModKey || Date.now() - SoloModTime > 1000) { SoloModKey = null; return; }
    SoloModKey = null;
    for (const Name of ['hide', 'arrow', 'hidden', 'auto', 'delay', 'opponent', 'eval']) {
      if (MatchModOnly(e, Binds[Name])) { e.preventDefault(); if (Name === 'hide') ToggleUI(); else ToggleBind(Name); return; }
    }
  });
})();
