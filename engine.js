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
    distText: () => distText,
    evaluate: () => evaluate,
    fxBlocked: () => fxBlocked,
    lotLoss: () => lotLoss,
    proposeLevels: () => proposeLevels,
    styleById: () => styleById
  });
  var STYLES = [
    {
      id: "scalping",
      label: "Scalping",
      tf: "M15",
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
    { id: "R_10", sym: "V10", name: "Volatility 10", aka: "FX Vol 20", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "R_25", sym: "V25", name: "Volatility 25", aka: "FX Vol 40", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "R_50", sym: "V50", name: "Volatility 50", aka: "FX Vol 60", cls: "synth", dp: 4, cost: 8e-5 },
    { id: "R_75", sym: "V75", name: "Volatility 75", aka: "FX Vol 80", cls: "synth", dp: 4, cost: 8e-5 },
    { id: "R_100", sym: "V100", name: "Volatility 100", aka: "FX Vol 99", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "1HZ15V", sym: "V15 1s", name: "Volatility 15 (1s)", cls: "synth", dp: 3, cost: 8e-5 },
    { id: "1HZ25V", sym: "V25 1s", name: "Volatility 25 (1s)", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "1HZ50V", sym: "V50 1s", name: "Volatility 50 (1s)", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "1HZ75V", sym: "V75 1s", name: "Volatility 75 (1s)", cls: "synth", dp: 2, cost: 8e-5 },
    { id: "1HZ100V", sym: "V100 1s", name: "Volatility 100 (1s)", cls: "synth", dp: 2, cost: 8e-5 }
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
  function proposeLevels(price, p, atr) {
    if (!(atr > 0) || p.slHit || p.tpHit) return null;
    const pad = 0.12 * atr;
    const sl = p.dir > 0 ? Math.min(p.ext1, p.ext2) - pad : Math.max(p.ext1, p.ext2) + pad;
    const tp = p.dir > 0 ? p.neck + p.height : p.neck - p.height;
    const between = p.dir > 0 ? price > sl && price < tp : price < sl && price > tp;
    let entry = price;
    let entryKind = "cours";
    if (!between) {
      const neckOk = p.dir > 0 ? p.neck > sl && p.neck < tp && price <= p.neck && price > sl : p.neck < sl && p.neck > tp && price >= p.neck && price < sl;
      if (!neckOk) return null;
      entry = p.neck;
      entryKind = "cou";
    }
    const dist = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (!(dist > 0) || !(reward > 0)) return null;
    return { entry, sl, tp, dist, reward, rr: reward / dist, entryKind };
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
    const netMove = Math.abs(P.k[i].c - P.k[Math.max(0, i - 8)].c);
    if (netMove < 0.45 * atr) return refuse("MOVEMENT_NOT_CLEAR", "Mouvement pas assez net.");
    if (vr != null && vr > 2.15) return refuse("MOVEMENT_NOT_CLEAR", "Amplitude trop agit\xE9e pour un mouvement net.");
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
      reason: manual ? "Sens autoris\xE9 par les autres filtres. Le W/M se juge \xE0 l'\u0153il." : "Contexte autoris\xE9, motif retenu et niveaux coh\xE9rents selon ces r\xE8gles.",
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
      origin: 0,
      pattern: null,
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
    const window = 48;
    const sliceFrom = Math.max(0, closed.length - window);
    const candles = closed.slice(sliceFrom).concat(live ? [live] : []);
    const shared = {
      ...base,
      price,
      spark,
      candles,
      origin: sliceFrom,
      record,
      days,
      atr: P.atr[i] > 0 ? P.atr[i] : null
    };
    if (now - (closed[i].t + style.step) > style.step * 2 + 600) {
      return { ...shared, why: "ancien", state: "erreur", reason: "Derni\xE8re bougie trop ancienne." };
    }
    if (weekend && fxBlocked(now)) {
      const friday = new Date(now * 1e3).getUTCDay() === 5;
      return {
        ...shared,
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
    if (jg.verdict === "NO_TRADE" && jg.reasonCode === "MOVEMENT_NOT_CLEAR" && vr != null && vr > 2.15) {
      return { ...shared, ...jg, vr, state: "agite", why: "agite", reason: `Trop agit\xE9 : le prix bouge ${vr.toFixed(1).replace(".", ",")} fois plus que d'habitude.` };
    }
    if (jg.verdict === "NO_TRADE") {
      return { ...shared, ...jg, vr, state: "refus", why: jg.reasonCode };
    }
    return { ...shared, ...jg, vr, state: "avis", why: null };
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
