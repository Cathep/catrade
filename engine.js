"use strict";
var CT = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/lib/catrade/engine.ts
  var engine_exports = {};
  __export(engine_exports, {
    MARKETS: () => MARKETS,
    STYLES: () => STYLES,
    breakoutOf: () => breakoutOf,
    collectBars: () => collectBars,
    collectW: () => collectW,
    coursePlan: () => coursePlan,
    distText: () => distText,
    evaluate: () => evaluate,
    fxBlocked: () => fxBlocked,
    gestionAt: () => gestionAt,
    lotLoss: () => lotLoss,
    patternPlan: () => patternPlan,
    proposeLevels: () => proposeLevels,
    replayCourse: () => replayCourse,
    simulateTrade: () => simulateTrade,
    styleById: () => styleById,
    traceZones: () => traceZones,
    zonesOn: () => zonesOn
  });
  var STYLES = [
    {
      id: "scalping",
      label: "Scalping",
      tf: "M15",
      stack: "M15, puis M5, puis M1",
      context: "H1",
      interval: 15,
      step: 15 * 60,
      group: 4,
      wing: 2,
      warm: 80,
      maxBars: 16
    },
    {
      id: "day",
      label: "Day",
      tf: "H1",
      stack: "H4, puis H1, puis M15",
      context: "H4",
      interval: 60,
      step: 60 * 60,
      group: 4,
      wing: 3,
      warm: 100,
      maxBars: 24
    },
    {
      id: "swing",
      label: "Swing",
      tf: "H4",
      stack: "Weekly, puis Daily, puis H4",
      context: "journalier",
      interval: 240,
      step: 4 * 60 * 60,
      group: 6,
      wing: 3,
      warm: 70,
      maxBars: 18
    }
  ];
  var MARKETS = [
    { id: "1HZ10V", sym: "Volatility", name: "Volatility 10 (1s) Index", aka: "Volatility", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "R_10", sym: "Volatility", name: "Volatility 10 Index", aka: "Volatility", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "1HZ100V", sym: "Volatility", name: "Volatility 100 (1s) Index", aka: "Volatility", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "R_100", sym: "Volatility", name: "Volatility 100 Index", aka: "Volatility", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "1HZ15V", sym: "Volatility", name: "Volatility 15 (1s) Index", aka: "Volatility", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "1HZ25V", sym: "Volatility", name: "Volatility 25 (1s) Index", aka: "Volatility", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "R_25", sym: "Volatility", name: "Volatility 25 Index", aka: "Volatility", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "1HZ30V", sym: "Volatility", name: "Volatility 30 (1s) Index", aka: "Volatility", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "1HZ50V", sym: "Volatility", name: "Volatility 50 (1s) Index", aka: "Volatility", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "R_50", sym: "Volatility", name: "Volatility 50 Index", aka: "Volatility", cls: "synth", dp: 4, cost: 8e-5 },
    { id: "1HZ75V", sym: "Volatility", name: "Volatility 75 (1s) Index", aka: "Volatility", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "R_75", sym: "Volatility", name: "Volatility 75 Index", aka: "Volatility", cls: "synth", dp: 4, cost: 8e-5 },
    { id: "1HZ90V", sym: "Volatility", name: "Volatility 90 (1s) Index", aka: "Volatility", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "BOOM100", sym: "Boom", name: "Boom 100 Index", aka: "Boom", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "BOOM1000", sym: "Boom", name: "Boom 1000 Index", aka: "Boom", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "BOOM150N", sym: "Boom", name: "Boom 150 Index", aka: "Boom", cls: "synth", dp: 5, cost: 8e-5 },
    { id: "BOOM200", sym: "Boom", name: "Boom 200 Index", aka: "Boom", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "BOOM300N", sym: "Boom", name: "Boom 300 Index", aka: "Boom", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "BOOM50", sym: "Boom", name: "Boom 50 Index", aka: "Boom", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "BOOM500", sym: "Boom", name: "Boom 500 Index", aka: "Boom", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "BOOM600", sym: "Boom", name: "Boom 600 Index", aka: "Boom", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "BOOM900", sym: "Boom", name: "Boom 900 Index", aka: "Boom", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "BOOM99", sym: "Boom", name: "Boom 99 Index", aka: "Boom", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "CRASH100", sym: "Crash", name: "Crash 100 Index", aka: "Crash", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "CRASH1000", sym: "Crash", name: "Crash 1000 Index", aka: "Crash", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "CRASH150N", sym: "Crash", name: "Crash 150 Index", aka: "Crash", cls: "synth", dp: 5, cost: 8e-5 },
    { id: "CRASH200", sym: "Crash", name: "Crash 200 Index", aka: "Crash", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "CRASH300N", sym: "Crash", name: "Crash 300 Index", aka: "Crash", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "CRASH50", sym: "Crash", name: "Crash 50 Index", aka: "Crash", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "CRASH500", sym: "Crash", name: "Crash 500 Index", aka: "Crash", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "CRASH600", sym: "Crash", name: "Crash 600 Index", aka: "Crash", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "CRASH900", sym: "Crash", name: "Crash 900 Index", aka: "Crash", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "CRASH99", sym: "Crash", name: "Crash 99 Index", aka: "Crash", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "JD10", sym: "Jump", name: "Jump 10 Index", aka: "Jump", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "JD100", sym: "Jump", name: "Jump 100 Index", aka: "Jump", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "JD25", sym: "Jump", name: "Jump 25 Index", aka: "Jump", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "JD50", sym: "Jump", name: "Jump 50 Index", aka: "Jump", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "JD75", sym: "Jump", name: "Jump 75 Index", aka: "Jump", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "stpRNG", sym: "Step", name: "Step Index", aka: "Step", cls: "synth", dp: 1, cost: 8e-5 },
    { id: "stpRNG2", sym: "Step", name: "Step Index 200", aka: "Step", cls: "synth", dp: 1, cost: 8e-5 },
    { id: "stpRNG3", sym: "Step", name: "Step Index 300", aka: "Step", cls: "synth", dp: 1, cost: 8e-5 },
    { id: "stpRNG4", sym: "Step", name: "Step Index 400", aka: "Step", cls: "synth", dp: 1, cost: 8e-5 },
    { id: "stpRNG5", sym: "Step", name: "Step Index 500", aka: "Step", cls: "synth", dp: 1, cost: 8e-5 },
    { id: "stpRNG10", sym: "Step", name: "Step Index 1000", aka: "Step", cls: "synth", dp: 1, cost: 8e-5 },
    { id: "stpRNG15", sym: "Step", name: "Step Index 1500", aka: "Step", cls: "synth", dp: 1, cost: 8e-5 },
    { id: "stpRNG20", sym: "Step", name: "Step Index 2000", aka: "Step", cls: "synth", dp: 1, cost: 8e-5 },
    { id: "frxXAUUSD", sym: "M\xE9tal", name: "XAUUSD", aka: "M\xE9tal", cls: "gold", dp: 2, cost: 15e-5 },
    { id: "frxXPDUSD", sym: "M\xE9tal", name: "Palladium/USD", aka: "M\xE9tal", cls: "fx", dp: 2, pip: 0.01, cost: 15e-5 },
    { id: "frxXPTUSD", sym: "M\xE9tal", name: "Platinum/USD", aka: "M\xE9tal", cls: "fx", dp: 2, pip: 0.01, cost: 15e-5 },
    { id: "frxXAGUSD", sym: "M\xE9tal", name: "Silver/USD", aka: "M\xE9tal", cls: "fx", dp: 4, pip: 1e-4, cost: 15e-5 },
    { id: "OTC_AS51", sym: "Indice", name: "Australia 200", aka: "Indice", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "OTC_SX5E", sym: "Indice", name: "Euro 50", aka: "Indice", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "OTC_FCHI", sym: "Indice", name: "France 40", aka: "Indice", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "OTC_GDAXI", sym: "Indice", name: "Germany 40", aka: "Indice", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "OTC_HSI", sym: "Indice", name: "Hong Kong 50", aka: "Indice", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "OTC_N225", sym: "Indice", name: "Japan 225", aka: "Indice", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "OTC_AEX", sym: "Indice", name: "Netherlands 25", aka: "Indice", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "OTC_SSMI", sym: "Indice", name: "Swiss 20", aka: "Indice", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "OTC_FTSE", sym: "Indice", name: "UK 100", aka: "Indice", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "OTC_SPC", sym: "Indice", name: "US 500", aka: "Indice", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "OTC_NDX", sym: "Indice", name: "US Tech 100", aka: "Indice", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "OTC_DJI", sym: "Indice", name: "Wall Street 30", aka: "Indice", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "cryBTCUSD", sym: "Crypto", name: "BTC/USD", aka: "Crypto", cls: "crypto", dp: 3, cost: 4e-4 },
    { id: "cryETHUSD", sym: "Crypto", name: "ETH/USD", aka: "Crypto", cls: "crypto", dp: 5, cost: 4e-4 },
    { id: "frxAUDCAD", sym: "Forex", name: "AUD/CAD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxAUDCHF", sym: "Forex", name: "AUD/CHF", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxAUDJPY", sym: "Forex", name: "AUD/JPY", aka: "Forex", cls: "fx", dp: 3, pip: 1e-3, cost: 15e-5 },
    { id: "frxAUDNZD", sym: "Forex", name: "AUD/NZD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxAUDUSD", sym: "Forex", name: "AUD/USD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxEURAUD", sym: "Forex", name: "EUR/AUD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxEURCAD", sym: "Forex", name: "EUR/CAD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxEURCHF", sym: "Forex", name: "EUR/CHF", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxEURGBP", sym: "Forex", name: "EUR/GBP", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxEURJPY", sym: "Forex", name: "EUR/JPY", aka: "Forex", cls: "fx", dp: 3, pip: 1e-3, cost: 15e-5 },
    { id: "frxEURNZD", sym: "Forex", name: "EUR/NZD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxEURUSD", sym: "Forex", name: "EUR/USD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxGBPAUD", sym: "Forex", name: "GBP/AUD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxGBPCAD", sym: "Forex", name: "GBP/CAD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxGBPCHF", sym: "Forex", name: "GBP/CHF", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxGBPJPY", sym: "Forex", name: "GBP/JPY", aka: "Forex", cls: "fx", dp: 3, pip: 1e-3, cost: 15e-5 },
    { id: "frxGBPNZD", sym: "Forex", name: "GBP/NZD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxGBPUSD", sym: "Forex", name: "GBP/USD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxNZDJPY", sym: "Forex", name: "NZD/JPY", aka: "Forex", cls: "fx", dp: 3, pip: 1e-3, cost: 15e-5 },
    { id: "frxNZDUSD", sym: "Forex", name: "NZD/USD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxUSDCAD", sym: "Forex", name: "USD/CAD", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxUSDCHF", sym: "Forex", name: "USD/CHF", aka: "Forex", cls: "fx", dp: 5, pip: 1e-5, cost: 15e-5 },
    { id: "frxUSDJPY", sym: "Forex", name: "USD/JPY", aka: "Forex", cls: "fx", dp: 3, pip: 1e-3, cost: 15e-5 },
    { id: "frxUSDMXN", sym: "Forex", name: "USD/MXN", aka: "Forex", cls: "fx", dp: 4, pip: 1e-4, cost: 15e-5 },
    { id: "frxUSDPLN", sym: "Forex", name: "USD/PLN", aka: "Forex", cls: "fx", dp: 4, pip: 1e-4, cost: 15e-5 }
  ];
  function styleById(id) {
    return STYLES.find((s) => s.id === id) ?? STYLES[1];
  }
  var mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  function median(a) {
    const s = [...a].sort((x, y) => x - y);
    const m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function ema(v, n) {
    const o = new Array(v.length).fill(null);
    if (v.length < n) return o;
    let e = mean(v.slice(0, n));
    o[n - 1] = e;
    const k = 2 / (n + 1);
    for (let i = n; i < v.length; i++) {
      e = v[i] * k + e * (1 - k);
      o[i] = e;
    }
    return o;
  }
  function atrSeries(k) {
    const tr = k.map(
      (x, i) => i ? Math.max(x.h - x.l, Math.abs(x.h - k[i - 1].c), Math.abs(x.l - k[i - 1].c)) : x.h - x.l
    );
    const atr = new Array(k.length).fill(0);
    if (k.length <= 15) return atr;
    let a = mean(tr.slice(1, 15));
    atr[14] = a;
    for (let i = 15; i < k.length; i++) {
      a = (a * 13 + tr[i]) / 14;
      atr[i] = a;
    }
    return atr;
  }
  function pivots(k, wing, kind) {
    const out = [];
    for (let p = wing; p < k.length - wing; p++) {
      const v = kind === "l" ? k[p].l : k[p].h;
      let ok = true;
      for (let j = p - wing; j <= p + wing; j++) {
        if (j === p) continue;
        const u = kind === "l" ? k[j].l : k[j].h;
        if (kind === "l" ? u < v : u > v) {
          ok = false;
          break;
        }
      }
      if (ok) out.push(p);
    }
    return out;
  }
  function contextSeries(k, group) {
    const out = new Array(k.length).fill(null);
    const buckets = [];
    for (let end = group - 1; end < k.length; end += group) buckets.push(k[end].c);
    if (buckets.length < 8) return out;
    const e = ema(buckets, 8);
    for (let b = 0; b < buckets.length; b++) {
      const end = (b + 1) * group - 1;
      if (end >= k.length || e[b] == null) continue;
      const prev = b > 0 ? e[b - 1] : e[b];
      const dir = buckets[b] > e[b] && e[b] >= (prev ?? e[b]) ? 1 : buckets[b] < e[b] && e[b] <= (prev ?? e[b]) ? -1 : 0;
      const until = Math.min(k.length, end + group);
      for (let i = end; i < until; i++) out[i] = dir;
    }
    return out;
  }
  function prepare(k, style) {
    const closes = k.map((x) => x.c);
    return {
      k,
      atr: atrSeries(k),
      e20: ema(closes, 20),
      e50: ema(closes, 50),
      pivL: pivots(k, style.wing, "l"),
      pivH: pivots(k, style.wing, "h"),
      ctx: contextSeries(k, style.group)
    };
  }
  function fxBlocked(t) {
    const d = new Date(t * 1e3);
    const day = d.getUTCDay();
    const h = d.getUTCHours();
    return day === 5 && h >= 12 || day === 6 || day === 0 && h < 22;
  }
  function localDir(P, i) {
    const c = P.k[i].c;
    const a = P.e20[i];
    const b = P.e50[i];
    if (a == null || b == null) return 0;
    if (c > b && a > b) return 1;
    if (c < b && a < b) return -1;
    return 0;
  }
  function volRatio(k, i) {
    if (i < 28) return null;
    const tr = (j) => j === 0 ? k[j].h - k[j].l : Math.max(k[j].h - k[j].l, Math.abs(k[j].h - k[j - 1].c), Math.abs(k[j].l - k[j - 1].c));
    const baseVals = [];
    for (let j = i - 27; j <= i - 4; j++) baseVals.push(tr(j));
    const base = median(baseVals);
    if (!(base > 0)) return null;
    let recent = 0;
    for (let j = i - 3; j <= i; j++) recent += tr(j);
    return recent / 4 / base;
  }
  function isSlow(k, p, atr, side) {
    const ext = side === "W" ? k[p].l : k[p].h;
    let near = 0;
    for (let j = Math.max(0, p - 2); j <= Math.min(k.length - 1, p + 2); j++) {
      const v = side === "W" ? k[j].l : k[j].h;
      if (Math.abs(v - ext) <= 0.35 * atr) near++;
    }
    const spike = k[p].h - k[p].l > 1.35 * atr;
    return near >= 3 && !spike;
  }
  function secondPart(k, p, i, atr, side) {
    const ext = side === "W" ? k[p].l : k[p].h;
    for (let j = p + 1; j <= i; j++) {
      if (side === "W" ? k[j].c >= ext + 0.3 * atr : k[j].c <= ext - 0.3 * atr) return true;
    }
    return false;
  }
  function usable(idx, i, wing) {
    const out = [];
    for (const p of idx) if (p + wing <= i) out.push(p);
    return out;
  }
  function buildPattern(P, i, side, points, atr, price) {
    if (!(atr > 0) || points.length < 2) return null;
    const k = P.k;
    for (let a = points.length - 1; a >= 1; a--) {
      const i2 = points[a];
      if (i - i2 > 42) break;
      for (let b = a - 1; b >= Math.max(0, a - 4); b--) {
        const i1 = points[b];
        if (i2 - i1 < 4 || i2 - i1 > 36) continue;
        const ext1 = side === "W" ? k[i1].l : k[i1].h;
        const ext2 = side === "W" ? k[i2].l : k[i2].h;
        if (Math.abs(ext1 - ext2) > 0.9 * atr) continue;
        let neck = side === "W" ? -Infinity : Infinity;
        for (let j = i1; j <= i2; j++) {
          neck = side === "W" ? Math.max(neck, k[j].h) : Math.min(neck, k[j].l);
        }
        const height = side === "W" ? neck - Math.min(ext1, ext2) : Math.max(ext1, ext2) - neck;
        if (!(height >= 0.65 * atr) || !Number.isFinite(neck)) continue;
        const pad = 0.12 * atr;
        const sl = side === "W" ? Math.min(ext1, ext2) - pad : Math.max(ext1, ext2) + pad;
        const tp = side === "W" ? neck + height : neck - height;
        let minL = Infinity;
        let maxH = -Infinity;
        for (let j = i2; j <= i; j++) {
          minL = Math.min(minL, k[j].l);
          maxH = Math.max(maxH, k[j].h);
        }
        const slHit = side === "W" ? minL <= sl || price <= sl : maxH >= sl || price >= sl;
        const tpHit = side === "W" ? maxH >= tp || price >= tp : minL <= tp || price <= tp;
        const reintegrated = side === "W" ? price > neck : price < neck;
        const tooFar = side === "W" ? price - neck > 1.5 * height : neck - price > 1.5 * height;
        return {
          side,
          dir: side === "W" ? 1 : -1,
          i1,
          i2,
          ext1,
          ext2,
          neck,
          height,
          slow: isSlow(k, i2, atr, side),
          secondPart: secondPart(k, i2, i, atr, side),
          reintegrated,
          tooFar,
          burnt: tpHit,
          slHit,
          tpHit,
          key: `${side}:${k[i1].t}:${k[i2].t}:${neck.toFixed(6)}`
        };
      }
    }
    return null;
  }
  function bandOf(c, side) {
    if (side === "l") {
      const top = Math.min(c.o, c.c);
      return top > c.l ? { bottom: c.l, top } : null;
    }
    const bottom = Math.max(c.o, c.c);
    return c.h > bottom ? { top: c.h, bottom } : null;
  }
  function traceZones(P, i, style, pattern) {
    const k = P.k;
    const zones = [];
    if (pattern && k[pattern.i1] && k[pattern.i2]) {
      const a = k[pattern.i1];
      const b = k[pattern.i2];
      let bottom = Math.min(pattern.ext1, pattern.ext2);
      let top = Math.max(pattern.ext1, pattern.ext2);
      if (!(top > bottom)) {
        const edge = pattern.dir > 0 ? bandOf(b, "l") ?? bandOf(a, "l") : bandOf(b, "h") ?? bandOf(a, "h");
        if (edge) {
          bottom = edge.bottom;
          top = edge.top;
        }
      }
      if (top > bottom) zones.push({ role: "entree", top, bottom, from: pattern.i1, side: "w" });
    }
    const winStart = Math.max(0, i - 160);
    const ranges = [];
    for (let j = Math.max(0, i - 40); j <= i; j++) ranges.push(k[j].h - k[j].l);
    ranges.sort((a, b) => a - b);
    const typical = ranges.length ? ranges[ranges.length >> 1] : 0;
    const wing = 8;
    if (!(typical > 0) || i < wing * 2) return zones;
    const pts = [];
    for (let j = Math.max(winStart, wing); j <= i - wing; j++) {
      let high = true;
      let low = true;
      for (let n = j - wing; n <= j + wing; n++) {
        if (n === j) continue;
        if (k[n].h >= k[j].h) high = false;
        if (k[n].l <= k[j].l) low = false;
      }
      if (high) pts.push({ p: j, ext: k[j].h, side: "h" });
      if (low) pts.push({ p: j, ext: k[j].l, side: "l" });
    }
    pts.sort((a, b) => a.ext - b.ext);
    const shelves = [];
    for (const pt of pts) {
      const last = shelves[shelves.length - 1];
      if (last && Math.abs(pt.ext - last.anchor) <= typical * 1.25) {
        last.n += 1;
        last.from = Math.min(last.from, pt.p);
        if (pt.side === "h" && pt.ext > last.ext) {
          last.ext = pt.ext;
          last.side = "h";
        } else if (pt.side === "l" && last.side === "l" && pt.ext < last.ext) last.ext = pt.ext;
      } else shelves.push({ anchor: pt.ext, side: pt.side, ext: pt.ext, from: pt.p, n: 1 });
    }
    const half = Math.min(typical * 0.35, (() => {
      let hi = -Infinity;
      let lo = Infinity;
      for (let j = Math.max(0, i - 119); j <= i; j++) {
        hi = Math.max(hi, k[j].h);
        lo = Math.min(lo, k[j].l);
      }
      return (hi - lo) * 0.04;
    })());
    let drafts = shelves.filter((s) => s.n >= 2).map((s) => ({
      role: "directeur",
      top: s.side === "h" ? s.ext : s.ext + half * 2,
      bottom: s.side === "h" ? s.ext - half * 2 : s.ext,
      from: s.from,
      side: s.side,
      n: s.n
    })).sort((a, b) => (a.top + a.bottom) / 2 - (b.top + b.bottom) / 2);
    let changed = drafts.slice().sort((a, b) => a.bottom - b.bottom);
    const groups = [];
    for (const d of changed) {
      const g = groups[groups.length - 1];
      const prev = g?.[g.length - 1];
      const close = prev && d.bottom - prev.top < (prev.top - prev.bottom) * 3;
      if (close) g.push(d);
      else groups.push([d]);
    }
    let kept = [];
    for (const g of groups) {
      if (g.length >= 3) kept.push(g[0], g[g.length - 1]);
      else if (g.length === 2) kept.push(g[0].n >= g[1].n ? g[0] : g[1]);
      else kept.push(g[0]);
    }
    if (kept.length > 5) kept = kept.sort((a, b) => b.n - a.n).slice(0, 5);
    zones.push(...kept.sort((a, b) => a.bottom - b.bottom).map((d) => ({ role: d.role, top: d.top, bottom: d.bottom, from: d.from, side: d.side })));
    return zones;
  }
  function zonesOn(k, style, pattern) {
    if (k.length < 16) return [];
    return traceZones(prepare(k, style), k.length - 1, style, pattern);
  }
  function ahead(dir, entry, px, gap) {
    return dir > 0 ? px > entry + gap : px < entry - gap;
  }
  function patternPlan(price, p, atr) {
    if (!(atr > 0) || !(price > 0)) return null;
    const dir = p.dir;
    const pad = 0.12 * atr;
    const sl = dir > 0 ? Math.min(p.ext1, p.ext2) - pad : Math.max(p.ext1, p.ext2) + pad;
    const measured = dir > 0 ? p.neck + p.height : p.neck - p.height;
    const neck = p.neck;
    const measuredOk = dir > 0 ? measured > sl : measured < sl;
    if (!measuredOk || !Number.isFinite(measured) || !Number.isFinite(neck)) return null;
    const neckInFront = dir > 0 ? neck > sl && neck < measured : neck < sl && neck > measured;
    const beforeNeck = dir > 0 ? price > sl && price < neck : price < sl && price > neck;
    let entry = price;
    let entryKind = "cours";
    if (beforeNeck) {
      entry = price;
      entryKind = "cours";
    } else if (neckInFront) {
      entry = neck;
      entryKind = "cou";
    } else return null;
    const dist = Math.abs(entry - sl);
    if (!(dist > 0)) return null;
    const gap = dist * 0.35;
    const structural = [];
    if (neckInFront && ahead(dir, entry, neck, gap * 0.15)) structural.push({ price: neck, kind: "cou" });
    if (ahead(dir, entry, measured, gap * 0.15)) structural.push({ price: measured, kind: "mesure" });
    if (!structural.length) return null;
    const far = structural.reduce((a, b) => dir > 0 ? a.price > b.price ? a : b : a.price < b.price ? a : b);
    const two = dir > 0 ? entry + 2 * dist : entry - 2 * dist;
    const twoInside = dir > 0 ? two < far.price - gap : two > far.price + gap;
    const twoClear = structural.every((s) => Math.abs(s.price - two) >= gap);
    const chosen = structural.slice();
    if (entryKind === "cou" && twoInside && twoClear) chosen.push({ price: two, kind: "2r" });
    chosen.sort((a, b) => dir * (a.price - b.price));
    const slHit = p.slHit || (dir > 0 ? price <= sl : price >= sl);
    const passed = (px) => dir > 0 ? price >= px : price <= px;
    const tps = chosen.map((t) => {
      const reward = Math.abs(t.price - entry);
      const hit = passed(t.price) || p.tpHit && (dir > 0 ? t.price <= measured + 1e-9 : t.price >= measured - 1e-9);
      return { price: t.price, reward, rr: reward / dist, hit, kind: t.kind };
    });
    const last = tps[tps.length - 1];
    return {
      entry,
      sl,
      tp: last.price,
      dist,
      reward: last.reward,
      rr: last.rr,
      entryKind,
      tps,
      slHit,
      done: slHit || tps.every((t) => t.hit)
    };
  }
  function proposeLevels(price, p, atr) {
    const plan = patternPlan(price, p, atr);
    if (!plan || plan.slHit || plan.done) return null;
    return {
      entry: plan.entry,
      sl: plan.sl,
      tp: plan.tp,
      dist: plan.dist,
      reward: plan.reward,
      rr: plan.rr,
      entryKind: plan.entryKind,
      tps: plan.tps
    };
  }
  function shyOf(entry, objective) {
    return entry + (objective - entry) * 0.92;
  }
  function wSetup(r) {
    const p = r.pattern;
    if (!p || !p.slow || !p.secondPart || p.slHit || p.tpHit || p.tooFar || r.price == null) return null;
    const span = p.dir > 0 ? p.neck - p.ext1 : p.ext1 - p.neck;
    if (!(span > 0)) return null;
    const progress = p.dir > 0 ? (r.price - p.ext1) / span : (p.ext1 - r.price) / span;
    if (!(progress >= 0 && progress <= 0.2)) return null;
    const pad = (r.atr || 0) * 0.12;
    const sl = p.dir > 0 ? Math.min(p.ext1, p.ext2) - pad : Math.max(p.ext1, p.ext2) + pad;
    if (p.dir > 0 ? r.price <= sl : r.price >= sl) return null;
    const dist = Math.abs(p.ext1 - sl);
    if (!(dist > 0)) return null;
    return { ref: p.ext1, neck: p.neck, sl, dist, dir: p.dir, key: p.key };
  }
  function breakoutOf(r) {
    const k = r.series;
    if (!k || k.length < 50 || r.price == null || !(r.atr && r.atr > 0)) return null;
    const n = k.length;
    const atr = r.atr;
    for (let len = 12; len <= 36; len++) {
      const end = n - 4;
      const start = end - len;
      if (start < 20) continue;
      let top = -Infinity;
      let bot = Infinity;
      for (let i = start; i < end; i++) {
        if (k[i].h > top) top = k[i].h;
        if (k[i].l < bot) bot = k[i].l;
      }
      const height = top - bot;
      if (!(height > 0.8 * atr && height < 4 * atr)) continue;
      let nearTop = 0;
      let nearBot = 0;
      for (let i = start; i < end; i++) {
        if (k[i].h >= top - 0.25 * height) nearTop++;
        if (k[i].l <= bot + 0.25 * height) nearBot++;
      }
      if (nearTop < 2 || nearBot < 2) continue;
      let dir = 0;
      for (let i = end; i < n - 1; i++) {
        if (k[i].c > top) {
          dir = 1;
          break;
        }
        if (k[i].c < bot) {
          dir = -1;
          break;
        }
      }
      if (!dir) continue;
      const level = dir > 0 ? top : bot;
      const sl = dir > 0 ? bot : top;
      const mid = (top + bot) / 2;
      if (Math.abs(r.price - level) > 0.35 * height) continue;
      if (dir > 0 ? r.price < mid || r.price <= sl : r.price > mid || r.price >= sl) continue;
      let major = null;
      const wing = 3;
      for (let i = wing; i < start; i++) {
        if (dir > 0) {
          let hi = true;
          for (let j = i - wing; j <= i + wing; j++) if (j !== i && k[j].h >= k[i].h) hi = false;
          if (hi && k[i].h > level + height * 0.5 && (major == null || k[i].h < major)) major = k[i].h;
        } else {
          let lo = true;
          for (let j = i - wing; j <= i + wing; j++) if (j !== i && k[j].l <= k[i].l) lo = false;
          if (lo && k[i].l < level - height * 0.5 && (major == null || k[i].l > major)) major = k[i].l;
        }
      }
      if (major == null) continue;
      const tp = shyOf(level, major);
      const reward = Math.abs(tp - level);
      const dist = Math.abs(level - sl);
      if (!(reward > dist * 0.5 && dist > 0)) continue;
      return {
        kind: "BREAKOUT",
        dir,
        ref: level,
        sl,
        dist,
        tp,
        objective: major,
        reward,
        step: 1,
        key: `${dir}:${level.toFixed(6)}`,
        note: "Cassure confirm\xE9e. Entr\xE9e au retour sur le niveau. Stop de l'autre c\xF4t\xE9."
      };
    }
    return null;
  }
  function coursePlan(r, style) {
    if (r.price == null || r.state === "agite" || r.state === "ferme" || r.state === "erreur") return null;
    if (r.reasonCode === "LOCAL_AGAINST_CONTEXT") return null;
    const simple = wSetup(r);
    const pattern = r.pattern;
    if (!simple || !pattern || style.id === "swing") return null;
    const extreme = pattern.dir > 0 ? Math.min(pattern.ext1, pattern.ext2) : Math.max(pattern.ext1, pattern.ext2);
    const onLevel = (r.zones ?? []).some((z) => {
      if (z.role !== "directeur" || !(z.top > z.bottom)) return false;
      const h = z.top - z.bottom;
      return extreme >= z.bottom - h && extreme <= z.top + h;
    });
    if (!onLevel) return null;
    return {
      kind: "W",
      dir: simple.dir,
      ref: simple.ref,
      sl: simple.sl,
      dist: simple.dist,
      tp: simple.neck,
      objective: simple.neck,
      reward: Math.abs(simple.neck - simple.ref),
      step: 0,
      key: simple.key,
      note: "Double V sur la zone. Sans ce W, le retour sur la zone ne se prend pas. Sortir au cou."
    };
  }
  function gestionAt(plan, q) {
    return plan.ref + (plan.tp - plan.ref) * q;
  }
  function betterStop(dir, current, next) {
    return dir > 0 ? Math.max(current, next) : Math.min(current, next);
  }
  function stoppedAt(dir, bar, stop) {
    return dir > 0 ? bar.l <= stop : bar.h >= stop;
  }
  function reached(dir, bar, level) {
    return dir > 0 ? bar.h >= level : bar.l <= level;
  }
  function simulateTrade(k, from, dir, entry, sl, tp, maxBars, costFrac) {
    const risk = Math.abs(entry - sl);
    if (!(risk > 0) || !(maxBars > 0) || from >= k.length) return null;
    if (dir > 0 ? !(tp > entry) : !(tp < entry)) return null;
    const costR = costFrac * entry / risk;
    const rOf = (exit) => dir * (exit - entry) / risk - costR;
    const last = Math.min(k.length - 1, from + maxBars - 1);
    let raw = { end: "time", r: rOf(k[last].c), at: last };
    for (let j = from; j <= last; j++) {
      if (stoppedAt(dir, k[j], sl)) {
        raw = { end: "sl", r: rOf(sl), at: j };
        break;
      }
      if (reached(dir, k[j], tp)) {
        raw = { end: "tp", r: rOf(tp), at: j };
        break;
      }
    }
    const p40 = gestionAt({ ref: entry, tp }, 0.4);
    const p60 = gestionAt({ ref: entry, tp }, 0.6);
    const p80 = gestionAt({ ref: entry, tp }, 0.8);
    let stop = sl;
    let managed = { end: "time", r: rOf(k[last].c), at: last };
    for (let j = from; j <= last; j++) {
      if (stoppedAt(dir, k[j], stop)) {
        const end = Math.abs(stop - sl) <= risk * 0.02 ? "sl" : Math.abs(stop - entry) <= risk * 0.05 ? "be" : "gain";
        managed = { end, r: rOf(stop), at: j };
        break;
      }
      if (reached(dir, k[j], tp)) {
        managed = { end: "tp", r: rOf(tp), at: j };
        break;
      }
      if (reached(dir, k[j], p80)) {
        managed = { end: "early", r: rOf(p80), at: j };
        break;
      }
      if (reached(dir, k[j], p60)) stop = betterStop(dir, stop, p40);
      else if (reached(dir, k[j], p40)) stop = betterStop(dir, stop, entry);
    }
    return { raw, managed };
  }
  function planAt(P, i, mk, style, weekend) {
    const bar = P.k[i];
    if (weekend && fxBlocked(bar.t + style.step)) return null;
    const price = bar.c;
    const jg = judgeAt(P, i, style, true, price);
    const vr = jg.vr ?? volRatio(P.k, i);
    let state = "avis";
    if (jg.verdict === "NO_TRADE" && jg.reasonCode === "MOVEMENT_NOT_CLEAR" && vr != null && vr > 2.15) state = "agite";
    else if (jg.verdict === "NO_TRADE") state = "refus";
    const from = Math.max(0, i - 239);
    const series = P.k.slice(from, i + 1);
    const report = {
      id: mk.id,
      state,
      why: null,
      reasonCode: jg.reasonCode,
      reason: jg.reason,
      price,
      spark: [],
      candles: series.slice(-48),
      series,
      origin: 0,
      pattern: jg.pattern,
      zones: traceZones(P, i, style, jg.pattern),
      opposed: jg.opposed,
      notes: [],
      levels: null,
      dir: jg.dir,
      buffer: 0,
      manual: true,
      verdict: jg.verdict,
      record: { n: 0, wins: 0, avg: 0 },
      vr,
      atr: jg.atr,
      days: 0,
      tf: style.tf
    };
    return coursePlan(report, style);
  }
  function replayCourse(mk, raw, style, now = Date.now() / 1e3, only) {
    if (!raw || raw.length < style.warm + 30) return [];
    const last = raw[raw.length - 1];
    const closed = last.t + style.step > now ? raw.slice(0, -1) : raw;
    if (closed.length < style.warm + 20) return [];
    const P = prepare(closed, style);
    const weekend = mk.cls === "fx" || mk.cls === "gold";
    const out = [];
    let skip = "";
    let i = style.warm;
    const n = P.k.length;
    while (i < n - 2) {
      const plan = planAt(P, i, mk, style, weekend);
      if (!plan || only && !only.includes(plan.kind) || plan.key === skip) {
        i++;
        continue;
      }
      skip = plan.key;
      if (plan.kind === "ZONE") {
        const taken = simulateTrade(P.k, i + 1, plan.dir, plan.ref, plan.sl, plan.tp, style.maxBars, mk.cost);
        const held = simulateTrade(P.k, i + 1, plan.dir, plan.ref, plan.sl, plan.tp, 120, mk.cost);
        out.push({
          kind: plan.kind,
          dir: plan.dir,
          filled: true,
          raw: taken?.raw ?? null,
          managed: taken?.managed ?? null,
          held: held?.raw ?? null,
          atMarket: null
        });
        i = (taken?.raw.at ?? i) + 1;
        continue;
      }
      const look = Math.min(n - 1, i + style.maxBars);
      let fill = null;
      let sameBar = null;
      for (let j = i + 1; j <= look; j++) {
        const bar = P.k[j];
        const touched = plan.dir > 0 ? bar.l <= plan.ref : bar.h >= plan.ref;
        if (!touched) continue;
        fill = j;
        const hitSl = stoppedAt(plan.dir, bar, plan.sl);
        const hitTp = reached(plan.dir, bar, plan.tp);
        if (hitSl) sameBar = "sl";
        else if (hitTp) sameBar = "tp";
        break;
      }
      if (fill == null) {
        out.push({ kind: plan.kind, dir: plan.dir, filled: false, raw: null, managed: null, held: null, atMarket: null });
        i = look + 1;
        continue;
      }
      const risk = Math.abs(plan.ref - plan.sl);
      const costR = risk > 0 ? mk.cost * plan.ref / risk : 0;
      if (sameBar) {
        const r = sameBar === "sl" ? -1 - costR : plan.reward / plan.dist - costR;
        const leg = { end: sameBar, r, at: fill };
        out.push({ kind: plan.kind, dir: plan.dir, filled: true, raw: leg, managed: leg, held: leg, atMarket: null });
        i = fill + 1;
        continue;
      }
      const rawHeld = simulateTrade(P.k, fill + 1, plan.dir, plan.ref, plan.sl, plan.tp, 120, mk.cost);
      const timed = simulateTrade(P.k, fill + 1, plan.dir, plan.ref, plan.sl, plan.tp, style.maxBars, mk.cost);
      const price = P.k[i].c;
      const marketOk = plan.dir > 0 ? price > plan.sl && price < plan.tp : price < plan.sl && price > plan.tp;
      const atMarket = marketOk ? simulateTrade(P.k, i + 1, plan.dir, price, plan.sl, plan.tp, style.maxBars, mk.cost) : null;
      out.push({
        kind: plan.kind,
        dir: plan.dir,
        filled: true,
        raw: timed?.raw ?? null,
        managed: timed?.managed ?? null,
        held: rawHeld?.raw ?? null,
        atMarket: atMarket?.raw ?? null
      });
      i = (timed?.raw.at ?? fill) + 1;
    }
    return out;
  }
  function collectW(mk, raw, style, now = Date.now() / 1e3) {
    if (!raw || raw.length < style.warm + 30) return [];
    const last = raw[raw.length - 1];
    const closed = last.t + style.step > now ? raw.slice(0, -1) : raw;
    if (closed.length < style.warm + 20) return [];
    const P = prepare(closed, style);
    const weekend = mk.cls === "fx" || mk.cls === "gold";
    const mid = P.k[Math.floor(P.k.length / 2)]?.t ?? 0;
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (let i = style.warm; i < P.k.length - 2; i++) {
      const bar = P.k[i];
      if (weekend && fxBlocked(bar.t + style.step)) continue;
      const price = bar.c;
      const jg = judgeAt(P, i, style, true, price);
      const p = jg.pattern;
      if (!p || !p.slow || !p.secondPart || p.tpHit || p.tooFar) continue;
      if (seen.has(p.key)) continue;
      const span = p.dir > 0 ? p.neck - p.ext1 : p.ext1 - p.neck;
      if (!(span > 0) || !(jg.atr && jg.atr > 0)) continue;
      const progress = p.dir > 0 ? (price - p.ext1) / span : (p.ext1 - price) / span;
      if (!(progress >= -0.05 && progress <= 0.55)) continue;
      seen.add(p.key);
      const vr = jg.vr ?? volRatio(P.k, i);
      const agite = jg.verdict === "NO_TRADE" && jg.reasonCode === "MOVEMENT_NOT_CLEAR" && vr != null && vr > 2.15;
      const lows = [];
      const highs = [];
      const closes = [];
      const end = Math.min(P.k.length, i + 1 + 120);
      for (let j = i + 1; j < end; j++) {
        lows.push(P.k[j].l);
        highs.push(P.k[j].h);
        closes.push(P.k[j].c);
      }
      out.push({
        id: mk.id,
        sym: mk.sym,
        t: bar.t,
        half: bar.t < mid ? 0 : 1,
        dir: p.dir,
        ext1: p.ext1,
        ext2: p.ext2,
        neck: p.neck,
        atr: jg.atr,
        price,
        progress,
        slow: p.slow,
        second: p.secondPart,
        slHit: p.slHit,
        age: i - p.i2,
        sep: p.i2 - p.i1,
        vr,
        blocked: agite || jg.reasonCode === "LOCAL_AGAINST_CONTEXT",
        lows,
        highs,
        closes
      });
    }
    return out;
  }
  function collectBars(mk, raw, style, now = Date.now() / 1e3) {
    if (!raw || raw.length < style.warm + 30) return [];
    const last = raw[raw.length - 1];
    const closed = last.t + style.step > now ? raw.slice(0, -1) : raw;
    if (closed.length < style.warm + 20) return [];
    const P = prepare(closed, style);
    const weekend = mk.cls === "fx" || mk.cls === "gold";
    const out = [];
    for (let i = style.warm; i < P.k.length - 2; i++) {
      const bar = P.k[i];
      if (weekend && fxBlocked(bar.t + style.step)) continue;
      const price = bar.c;
      const jg = judgeAt(P, i, style, true, price);
      const p = jg.pattern;
      if (!p || !p.slow || !p.secondPart || p.tpHit || p.tooFar) continue;
      const span = p.dir > 0 ? p.neck - p.ext1 : p.ext1 - p.neck;
      if (!(span > 0) || !(jg.atr && jg.atr > 0)) continue;
      const progress = p.dir > 0 ? (price - p.ext1) / span : (p.ext1 - price) / span;
      const worse = p.dir > 0 ? Math.min(p.ext1, p.ext2) : Math.max(p.ext1, p.ext2);
      let neckAt = p.i1;
      let neckPx = p.dir > 0 ? -Infinity : Infinity;
      for (let j = p.i1; j <= p.i2; j++) {
        const c = P.k[j];
        if (p.dir > 0 ? c.h >= neckPx : c.l <= neckPx) {
          neckPx = p.dir > 0 ? c.h : c.l;
          neckAt = j;
        }
      }
      let adverse = 0;
      let neckHit = false;
      for (let j = p.i2; j <= i; j++) {
        const c = P.k[j];
        if (p.dir > 0) adverse = Math.max(adverse, worse - c.l);
        else adverse = Math.max(adverse, c.h - worse);
      }
      for (let j = neckAt + 1; j <= i; j++) {
        const c = P.k[j];
        if (p.dir > 0 ? c.h >= p.neck : c.l <= p.neck) neckHit = true;
      }
      if (p.dir > 0) {
        adverse = Math.max(adverse, worse - price);
        if (price >= p.neck) neckHit = true;
      } else {
        adverse = Math.max(adverse, price - worse);
        if (price <= p.neck) neckHit = true;
      }
      const vr = jg.vr ?? volRatio(P.k, i);
      const agite = jg.verdict === "NO_TRADE" && jg.reasonCode === "MOVEMENT_NOT_CLEAR" && vr != null && vr > 2.15;
      const ctx = P.ctx[i];
      out.push({
        i,
        t: bar.t,
        dir: p.dir,
        ext1: p.ext1,
        ext2: p.ext2,
        neck: p.neck,
        atr: jg.atr,
        price,
        progress,
        slHit: p.slHit,
        adverse,
        neckHit,
        age: i - p.i2,
        sep: p.i2 - p.i1,
        vr,
        blocked: agite || jg.reasonCode === "LOCAL_AGAINST_CONTEXT",
        choppy: jg.reasonCode === "MOVEMENT_NOT_CLEAR",
        flat: ctx == null || ctx === 0,
        barAtr: (bar.h - bar.l) / jg.atr,
        key: p.key
      });
    }
    return out;
  }
  function judgeAt(P, i, style, manual, price) {
    const atr = P.atr[i];
    const vr = volRatio(P.k, i);
    const dir = localDir(P, i);
    const ctx = P.ctx[i];
    const empty = {
      dir: 0,
      verdict: "NO_TRADE",
      buffer: 0,
      reasonCode: "",
      reason: "",
      pattern: null,
      opposed: false,
      notes: [],
      levels: null,
      vr,
      atr: atr > 0 ? atr : null
    };
    const refuse = (code, reason) => ({
      ...empty,
      dir,
      reasonCode: code,
      reason
    });
    if (P.e50[i] == null) return refuse("ANALYSIS_HISTORY_INSUFFICIENT", "Pas assez d'historique pour identifier la tendance.");
    if (dir === 0) return refuse("LOCAL_TREND_UNIDENTIFIED", "Tendance locale pas encore identifi\xE9e.");
    if (ctx == null) return refuse("CONTEXT_DATA_UNAVAILABLE", "Contexte de la p\xE9riode sup\xE9rieure indisponible.");
    if (ctx !== 0 && ctx !== dir) {
      return refuse("LOCAL_AGAINST_CONTEXT", "Sens local oppos\xE9 \xE0 la r\xE9f\xE9rence : entr\xE9e refus\xE9e.");
    }
    if (!(atr > 0)) return refuse("ANALYSIS_DATA_INCOMPLETE", "Amplitude illisible.");
    const w = buildPattern(P, i, "W", usable(P.pivL, i, style.wing), atr, price);
    const m = buildPattern(P, i, "M", usable(P.pivH, i, style.wing), atr, price);
    const aligned = dir > 0 ? w : m;
    const other = dir > 0 ? m : w;
    const notes = [];
    if (!aligned) notes.push("W/M non d\xE9tect\xE9 par le code, non bloquant.");
    else {
      notes.push(`${aligned.side} possible en formation, \xE0 juger.`);
      if (!aligned.slow) notes.push("Second extr\xE9mum non lent.");
      if (!aligned.secondPart) notes.push("Deuxi\xE8me partie pas encore constat\xE9e.");
      if (!aligned.reintegrated) notes.push("Prix encore du mauvais c\xF4t\xE9 du cou.");
      if (aligned.tooFar) notes.push("Prix trop \xE9loign\xE9 du motif.");
      if (aligned.burnt || aligned.tpHit) notes.push("Objectif du motif d\xE9j\xE0 touch\xE9.");
      if (aligned.slHit) notes.push("Stop du motif d\xE9j\xE0 touch\xE9.");
    }
    if (other && (!aligned || other.i2 > aligned.i2)) notes.push("Un motif inverse est visible. Il n'oriente pas ce sens.");
    const netMove = Math.abs(P.k[i].c - P.k[Math.max(0, i - 8)].c);
    if (netMove < 0.45 * atr || vr != null && vr > 2.15) {
      const agitated = vr != null && vr > 2.15;
      return {
        ...refuse(
          "MOVEMENT_NOT_CLEAR",
          agitated ? "Amplitude trop agit\xE9e pour un mouvement net." : "Mouvement pas assez net."
        ),
        pattern: aligned,
        opposed: !!other,
        notes
      };
    }
    const levels = aligned ? proposeLevels(price, aligned, atr) : null;
    if (aligned && !levels) notes.push("G\xE9om\xE9trie incompl\xE8te : aucun niveau invent\xE9.");
    if (levels && levels.rr < 2) {
      notes.push(
        `Rapport ${levels.rr.toFixed(2).replace(".", ",")}, sous le minimum 2 du robot${manual ? ". Non bloquant ici." : "."}`
      );
    }
    if (!manual) {
      if (!aligned) return { ...empty, dir, reasonCode: "PATTERN_NOT_FOUND", reason: "W/M recherch\xE9 non trouv\xE9.", notes, opposed: !!other };
      if (!aligned.slow) return { ...empty, dir, pattern: aligned, notes, opposed: !!other, reasonCode: "SECOND_EXTREMUM_NOT_SLOW", reason: "Second creux ou sommet non lent." };
      if (!aligned.secondPart) return { ...empty, dir, pattern: aligned, notes, opposed: !!other, reasonCode: "SECOND_PART_PENDING", reason: "Deuxi\xE8me partie pas encore constat\xE9e." };
      if (!aligned.reintegrated) return { ...empty, dir, pattern: aligned, notes, opposed: !!other, reasonCode: "REFERENCE_REINTEGRATION_PENDING", reason: "Prix encore du mauvais c\xF4t\xE9 du cou." };
      if (aligned.tooFar) return { ...empty, dir, pattern: aligned, notes, opposed: !!other, reasonCode: "PRICE_TOO_FAR", reason: "Prix trop \xE9loign\xE9 du motif." };
      if (aligned.slHit) return { ...empty, dir, pattern: aligned, notes, opposed: !!other, reasonCode: "STOP_ALREADY_HIT", reason: "Stop du motif d\xE9j\xE0 touch\xE9." };
      if (aligned.tpHit) return { ...empty, dir, pattern: aligned, notes, opposed: !!other, reasonCode: "TARGET_ALREADY_HIT", reason: "Objectif du motif d\xE9j\xE0 touch\xE9." };
      if (!levels) return { ...empty, dir, pattern: aligned, notes, opposed: !!other, reasonCode: "LEVELS_UNAVAILABLE", reason: "Entr\xE9e, stop ou objectif non disponibles." };
      if (levels.rr < 2) {
        return {
          ...empty,
          dir,
          pattern: aligned,
          levels,
          notes: notes.concat([`Rapport ${levels.rr.toFixed(2)}, sous le minimum 2 du robot.`]),
          opposed: !!other,
          reasonCode: "LEVELS_INCOHERENT",
          reason: "Rapport objectif / stop inf\xE9rieur \xE0 2."
        };
      }
    }
    const verdict = dir > 0 ? "BUY" : "SELL";
    return {
      dir,
      verdict,
      buffer: manual ? dir * 2 : dir,
      reasonCode: manual ? "WM_MANUAL_REVIEW" : "CURRENT_CODE_SETUP_ACCEPTED",
      reason: manual ? "Contexte autoris\xE9. Pas de W, tendance, palier ou breakout m\xFBr." : "Contexte autoris\xE9, motif retenu et niveaux coh\xE9rents selon ces r\xE8gles.",
      pattern: aligned,
      opposed: !!other,
      notes,
      levels,
      vr,
      atr
    };
  }
  function statsOf(nets) {
    const n = nets.length;
    if (!n) return { n: 0, wins: 0, avg: 0 };
    const wins = nets.filter((x) => x > 0).length;
    const avg = nets.reduce((s, x) => s + x, 0) / n;
    return { n, wins, avg };
  }
  function backtest(P, style, manual, mk, weekend) {
    const nets = [];
    let i = style.warm;
    const n = P.k.length;
    while (i < n - 2) {
      const bar = P.k[i];
      if (weekend && fxBlocked(bar.t + style.step)) {
        i++;
        continue;
      }
      const jg = judgeAt(P, i, style, manual, bar.c);
      if (jg.verdict === "NO_TRADE" || !jg.levels) {
        i++;
        continue;
      }
      const s = jg.levels;
      let r = null;
      let j = i + 1;
      for (; j < n; j++) {
        const hitSL = jg.dir > 0 ? P.k[j].l <= s.sl : P.k[j].h >= s.sl;
        const hitTP = jg.dir > 0 ? P.k[j].h >= s.tp : P.k[j].l <= s.tp;
        if (hitSL) {
          r = -1;
          break;
        }
        if (hitTP) {
          r = s.rr;
          break;
        }
        if (j - i >= style.maxBars) {
          r = jg.dir * (P.k[j].c - s.entry) / s.dist;
          break;
        }
      }
      if (r == null) break;
      const net = r - mk.cost * s.entry / s.dist;
      nets.push(net);
      i = j;
    }
    return statsOf(nets);
  }
  function evaluate(mk, raw, now, style, manual) {
    const base = {
      id: mk.id,
      state: "erreur",
      why: "indispo",
      reasonCode: "ANALYSIS_DATA_INCOMPLETE",
      reason: "Prix indisponibles pour l'instant.",
      price: null,
      spark: [],
      candles: [],
      series: [],
      origin: 0,
      pattern: null,
      zones: [],
      opposed: false,
      notes: [],
      levels: null,
      dir: 0,
      buffer: 0,
      manual,
      verdict: "NO_TRADE",
      record: { n: 0, wins: 0, avg: 0 },
      vr: null,
      atr: null,
      days: 0,
      tf: style.tf
    };
    if (!raw || raw.length < 30) return base;
    const last = raw[raw.length - 1];
    const live = last.t + style.step > now ? last : null;
    const closed = live ? raw.slice(0, -1) : raw;
    if (closed.length < style.warm + 10) {
      return { ...base, why: "historique", price: last.c, reason: "Historique trop court sur cette unit\xE9 de temps." };
    }
    const price = last.c;
    const weekend = mk.cls === "fx" || mk.cls === "gold";
    const P = prepare(closed, style);
    const i = closed.length - 1;
    const record = backtest(P, style, manual, mk, weekend);
    const days = Math.round((closed.length - style.warm) * style.step / 86400);
    const spark = closed.slice(-59).map((x) => x.c).concat([price]);
    const window = 120;
    const sliceFrom = Math.max(0, closed.length - window);
    const candles = closed.slice(sliceFrom).concat(live ? [live] : []);
    const shared = {
      ...base,
      price,
      spark,
      candles,
      series: closed,
      origin: sliceFrom,
      record,
      days,
      atr: P.atr[i] > 0 ? P.atr[i] : null
    };
    if (now - (closed[i].t + style.step) > style.step * 2 + 600) {
      return { ...shared, zones: traceZones(P, i, style, null), why: "ancien", state: "erreur", reason: "Derni\xE8re bougie trop ancienne." };
    }
    if (weekend && fxBlocked(now)) {
      const friday = new Date(now * 1e3).getUTCDay() === 5;
      return {
        ...shared,
        zones: traceZones(P, i, style, null),
        state: "ferme",
        why: friday ? "vendredi" : "weekend",
        reason: friday ? "Pas de nouvelle entr\xE9e avant le week-end." : "March\xE9 ferm\xE9 le week-end."
      };
    }
    const jg = judgeAt(P, i, style, manual, price);
    if (live && jg.pattern && jg.atr) {
      const hitSL = jg.dir > 0 ? live.l <= (jg.levels?.sl ?? (jg.pattern.dir > 0 ? Math.min(jg.pattern.ext1, jg.pattern.ext2) : Infinity)) : false;
      if (hitSL && jg.levels) {
        jg.levels = null;
        jg.notes = jg.notes.concat(["La bougie en cours a touch\xE9 le stop propos\xE9."]);
      }
    }
    const vr = jg.vr ?? volRatio(closed, i);
    const zones = traceZones(P, i, style, jg.pattern);
    if (jg.verdict === "NO_TRADE" && jg.reasonCode === "MOVEMENT_NOT_CLEAR" && vr != null && vr > 2.15) {
      return { ...shared, ...jg, zones, vr, state: "agite", why: "agite", reason: `Trop agit\xE9 : le prix bouge ${vr.toFixed(1).replace(".", ",")} fois plus que d'habitude.` };
    }
    if (jg.verdict === "NO_TRADE") {
      return { ...shared, ...jg, zones, vr, state: "refus", why: jg.reasonCode };
    }
    return { ...shared, ...jg, zones, vr, state: "avis", why: null };
  }
  function distText(mk, d) {
    if (mk.pip) return `${Math.round(d / mk.pip)} pips`;
    const n = d.toLocaleString("fr-FR", { maximumFractionDigits: mk.dp });
    return mk.cls === "synth" ? `${n} pts` : `${n} $`;
  }
  function lotLoss(mk, price, dist, quoteUsd) {
    if (mk.cls === "gold") return dist;
    if (mk.cls !== "fx" || !mk.pip) return null;
    const pips = dist / mk.pip;
    const base = mk.id.slice(0, 3);
    const quote = mk.id.slice(3);
    if (quote === "USD") return pips * 0.1;
    if (base === "USD" && price) return pips * 0.1 / price;
    if (quoteUsd) return pips * 0.1 * quoteUsd;
    return null;
  }
  return __toCommonJS(engine_exports);
})();
