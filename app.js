"use strict";
const { MARKETS, STYLES, styleById, evaluate, distText, lotLoss } = CT;
const $ = (s) => document.querySelector(s);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const fmt = (v, dp) => v.toLocaleString("fr-FR", { minimumFractionDigits: dp, maximumFractionDigits: dp });
const num = (x, d = 1) => x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const hm = (ms) => new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&" + "amp;";
    if (c === "<") return "&" + "lt;";
    if (c === ">") return "&" + "gt;";
    if (c === '"') return "&" + "quot;";
    return "&" + "#39;";
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let styleId = store.get("ct.style", "day");
let family = store.get("ct.family", "Volatility");
const FAMILIES = [];
for (const m of MARKETS) if (m.aka && !FAMILIES.includes(m.aka)) FAMILIES.push(m.aka);
if (!FAMILIES.includes(family)) family = "Volatility";
let manual = store.get("ct.manual", true);
let reports = [];
let busy = false;
let scannedAt = 0;
let choices = store.get("ct.choices", {});
let simLot = store.get("ct.simLot", null);
let gen = 0;

const LOT_SPEC = {
  "Volatility 10 (1s) Index": { min: 0.5, max: 810, contract: 1, ccy: "USD" },
  "Volatility 10 Index": { min: 0.5, max: 1280, contract: 1, ccy: "USD" },
  "Volatility 100 (1s) Index": { min: 1, max: 900, contract: 1, ccy: "USD" },
  "Volatility 100 Index": { min: 1, max: 1000, contract: 1, ccy: "USD" },
  "Volatility 150 (1s) Index": { min: 1, max: 50, contract: 1, ccy: "USD" },
  "Volatility 250 (1s) Index": { min: 10, max: 50, contract: 1, ccy: "USD" },
  "Volatility 15 (1s) Index": { min: 0.2, max: 370, contract: 1, ccy: "USD" },
  "Volatility 25 (1s) Index": { min: 0.005, max: 4, contract: 1, ccy: "USD" },
  "Volatility 25 Index": { min: 0.5, max: 1000, contract: 1, ccy: "USD" },
  "Volatility 30 (1s) Index": { min: 0.2, max: 360, contract: 1, ccy: "USD" },
  "Volatility 50 (1s) Index": { min: 0.005, max: 6, contract: 1, ccy: "USD" },
  "Volatility 50 Index": { min: 4, max: 12000, contract: 1, ccy: "USD" },
  "Volatility 75 (1s) Index": { min: 0.05, max: 240, contract: 1, ccy: "USD" },
  "Volatility 75 Index": { min: 0.01, max: 50, contract: 1, ccy: "USD" },
  "Volatility 90 (1s) Index": { min: 0.1, max: 50, contract: 1, ccy: "USD" },
  "Boom 100 Index": { min: 0.1, max: 160, contract: 1, ccy: "USD" },
  "Boom 1000 Index": { min: 0.2, max: 250, contract: 1, ccy: "USD" },
  "Boom 150 Index": { min: 0.5, max: 1300, contract: 1, ccy: "USD" },
  "Boom 200 Index": { min: 0.1, max: 130, contract: 1, ccy: "USD" },
  "Boom 300 Index": { min: 0.5, max: 1000, contract: 1, ccy: "USD" },
  "Boom 50 Index": { min: 0.1, max: 200, contract: 1, ccy: "USD" },
  "Boom 500 Index": { min: 0.2, max: 500, contract: 1, ccy: "USD" },
  "Boom 600 Index": { min: 0.2, max: 470, contract: 1, ccy: "USD" },
  "Boom 900 Index": { min: 0.2, max: 340, contract: 1, ccy: "USD" },
  "Boom 99 Index": { min: 0.1, max: 160, contract: 1, ccy: "USD" },
  "Crash 100 Index": { min: 0.1, max: 160, contract: 1, ccy: "USD" },
  "Crash 1000 Index": { min: 0.2, max: 600, contract: 1, ccy: "USD" },
  "Crash 150 Index": { min: 0.5, max: 1230, contract: 1, ccy: "USD" },
  "Crash 200 Index": { min: 0.1, max: 130, contract: 1, ccy: "USD" },
  "Crash 300 Index": { min: 0.5, max: 515, contract: 1, ccy: "USD" },
  "Crash 50 Index": { min: 0.1, max: 200, contract: 1, ccy: "USD" },
  "Crash 500 Index": { min: 0.2, max: 730, contract: 1, ccy: "USD" },
  "Crash 600 Index": { min: 0.2, max: 100, contract: 1, ccy: "USD" },
  "Crash 900 Index": { min: 0.2, max: 160, contract: 1, ccy: "USD" },
  "Crash 99 Index": { min: 0.1, max: 160, contract: 1, ccy: "USD" },
  "Jump 10 Index": { min: 0.01, max: 20, contract: 1, ccy: "USD" },
  "Jump 100 Index": { min: 0.1, max: 380, contract: 1, ccy: "USD" },
  "Jump 25 Index": { min: 0.01, max: 7, contract: 1, ccy: "USD" },
  "Jump 50 Index": { min: 0.01, max: 10, contract: 1, ccy: "USD" },
  "Jump 75 Index": { min: 0.01, max: 20, contract: 1, ccy: "USD" },
  "Step Index": { min: 0.1, max: 270, contract: 10, ccy: "USD" },
  "Step Index 200": { min: 0.1, max: 70, contract: 10, ccy: "USD" },
  "Step Index 300": { min: 0.1, max: 40, contract: 10, ccy: "USD" },
  "Step Index 400": { min: 0.1, max: 45, contract: 10, ccy: "USD" },
  "Step Index 500": { min: 0.1, max: 80, contract: 10, ccy: "USD" },
  "Step Index 1000": { min: 0.1, max: 270, contract: 10, ccy: "USD" },
  "Step Index 1500": { min: 0.1, max: 270, contract: 10, ccy: "USD" },
  "Step Index 2000": { min: 0.1, max: 270, contract: 10, ccy: "USD" },
  "Range Break 100 Index": { min: 0.01, max: 15, contract: 1, ccy: "USD" },
  "Range Break 200 Index": { min: 0.01, max: 20, contract: 1, ccy: "USD" },
  "AUD Basket": { min: 0.01, max: 10, contract: 100, ccy: "USD" },
  "EUR Basket": { min: 0.01, max: 13, contract: 100, ccy: "USD" },
  "GBP Basket": { min: 0.01, max: 10, contract: 100, ccy: "USD" },
  "Gold Basket": { min: 0.01, max: 2, contract: 1, ccy: "USD" },
  "USD Basket": { min: 0.01, max: 12, contract: 100, ccy: "USD" },
  "Bear Market Index": { min: 0.01, max: 100, contract: 1, ccy: "USD" },
  "Bull Market Index": { min: 0.01, max: 100, contract: 1, ccy: "USD" },
  "XAUUSD": { min: 0.01, max: 30, contract: 100, ccy: "USD" },
  "Palladium/USD": { min: 0.01, max: 10, contract: 100, ccy: "XPD" },
  "Platinum/USD": { min: 0.01, max: 10, contract: 100, ccy: "XPT" },
  "Silver/USD": { min: 0.01, max: 15, contract: 5000, ccy: "XAG" },
  "Australia 200": { min: 0.1, max: 200, contract: 1, ccy: "AUD" },
  "Euro 50": { min: 0.1, max: 500, contract: 1, ccy: "EUR" },
  "France 40": { min: 0.1, max: 100, contract: 1, ccy: "EUR" },
  "Germany 40": { min: 0.1, max: 100, contract: 1, ccy: "EUR" },
  "Hong Kong 50": { min: 0.1, max: 100, contract: 1, ccy: "HKD" },
  "Japan 225": { min: 10, max: 5000, contract: 1, ccy: "JPY" },
  "Netherlands 25": { min: 0.1, max: 100, contract: 1, ccy: "EUR" },
  "Swiss 20": { min: 0.1, max: 100, contract: 1, ccy: "CHF" },
  "UK 100": { min: 0.1, max: 200, contract: 1, ccy: "GBP" },
  "US 500": { min: 0.1, max: 750, contract: 1, ccy: "USD" },
  "US Tech 100": { min: 0.1, max: 200, contract: 1, ccy: "USD" },
  "Wall Street 30": { min: 0.1, max: 150, contract: 1, ccy: "USD" },
  "BTC/USD": { min: 0.01, max: 50, contract: 1, ccy: "USD" },
  "ETH/USD": { min: 0.1, max: 750, contract: 1, ccy: "USD" },
  "AUD/CAD": { min: 0.01, max: 15, contract: 100000, ccy: "AUD" },
  "AUD/CHF": { min: 0.01, max: 15, contract: 100000, ccy: "AUD" },
  "AUD/JPY": { min: 0.01, max: 40, contract: 100000, ccy: "AUD" },
  "AUD/NZD": { min: 0.01, max: 15, contract: 100000, ccy: "AUD" },
  "AUD/USD": { min: 0.01, max: 100, contract: 100000, ccy: "AUD" },
  "EUR/AUD": { min: 0.01, max: 40, contract: 100000, ccy: "EUR" },
  "EUR/CAD": { min: 0.01, max: 40, contract: 100000, ccy: "EUR" },
  "EUR/CHF": { min: 0.01, max: 40, contract: 100000, ccy: "EUR" },
  "EUR/GBP": { min: 0.01, max: 40, contract: 100000, ccy: "EUR" },
  "EUR/JPY": { min: 0.01, max: 40, contract: 100000, ccy: "EUR" },
  "EUR/NZD": { min: 0.01, max: 15, contract: 100000, ccy: "EUR" },
  "EUR/USD": { min: 0.01, max: 100, contract: 100000, ccy: "EUR" },
  "GBP/AUD": { min: 0.01, max: 40, contract: 100000, ccy: "GBP" },
  "GBP/CAD": { min: 0.01, max: 15, contract: 100000, ccy: "GBP" },
  "GBP/CHF": { min: 0.01, max: 15, contract: 100000, ccy: "GBP" },
  "GBP/JPY": { min: 0.01, max: 100, contract: 100000, ccy: "GBP" },
  "GBP/NZD": { min: 0.01, max: 15, contract: 100000, ccy: "GBP" },
  "GBP/USD": { min: 0.01, max: 100, contract: 100000, ccy: "GBP" },
  "NZD/JPY": { min: 0.01, max: 15, contract: 100000, ccy: "NZD" },
  "NZD/USD": { min: 0.01, max: 100, contract: 100000, ccy: "NZD" },
  "USD/CAD": { min: 0.01, max: 100, contract: 100000, ccy: "USD" },
  "USD/CHF": { min: 0.01, max: 100, contract: 100000, ccy: "USD" },
  "USD/JPY": { min: 0.01, max: 100, contract: 100000, ccy: "USD" },
  "USD/MXN": { min: 0.01, max: 15, contract: 100000, ccy: "USD" },
  "USD/PLN": { min: 0.01, max: 15, contract: 100000, ccy: "USD" },
};

function specOf(mk) {
  return LOT_SPEC[mk.name] || { min: 0.01, max: 50, contract: 1, ccy: "USD" };
}
function lotDigits(v) { return v < 0.01 ? 3 : 2; }
function lotChoices(s) {
  const out = [];
  for (const k of [1, 2, 5, 10, 20, 50]) {
    const d = lotDigits(s.min);
    const p = 10 ** d;
    const v = Math.round(s.min * k * p) / p;
    if (v + 1e-9 < s.min || v > s.max + 1e-9) continue;
    if (!out.some((x) => Math.abs(x - v) < 1e-9)) out.push(v);
  }
  if (!out.length || Math.abs(out[0] - s.min) > 1e-9) out.unshift(s.min);
  return out.slice(0, 6);
}
function lotFor(mk) {
  const s = specOf(mk);
  if (simLot != null && simLot + 1e-12 >= s.min && simLot <= s.max + 1e-12) return simLot;
  return s.min;
}
function moneyFor(mk, price, dist, lots) {
  const s = specOf(mk);
  const v = dist * s.contract * lots;
  if (mk.cls === "gold") return { v, ccy: "USD" };
  if (mk.cls === "fx") {
    const quote = mk.id.slice(6);
    if (!quote || quote === "USD") return { v, ccy: "USD" };
    if (mk.id.startsWith("frxUSD") && price) return { v: v / price, ccy: "USD" };
    return { v, ccy: quote };
  }
  return { v, ccy: s.ccy };
}
function planOf(r) {
  if (!r) return null;
  if (r.pattern && r.atr > 0 && typeof CT.patternPlan === "function") {
    const price = r.price != null ? r.price : r.pattern.neck;
    const plan = CT.patternPlan(price, r.pattern, r.atr);
    if (plan) {
      const last = plan.tps[plan.tps.length - 1];
      const some = plan.tps.some((t) => t.hit);
      const status = plan.slHit ? "stop" : last && last.hit ? "objectif" : some ? "partiel" : r.pattern.tooFar && !r.levels ? "loin" : "ouvert";
      return Object.assign({}, plan, { status });
    }
  }
  if (r.levels) {
    const tps = r.levels.tps && r.levels.tps.length ? r.levels.tps : [{ price: r.levels.tp, reward: r.levels.reward, rr: r.levels.rr, hit: false, kind: "mesure" }];
    return Object.assign({}, r.levels, { tps, status: "ouvert" });
  }
  return null;
}
function resultOf(r, plan) {
  const dir = r.dir || (plan.entry < plan.sl ? -1 : 1);
  const start = r.pattern && Number.isFinite(r.origin) ? Math.max(0, r.pattern.i2 - r.origin) : 0;
  const bars = (r.candles || []).slice(start);
  let slAt = -1;
  const tpAt = plan.tps.map(() => -1);
  const see = (b, i) => {
    if (slAt < 0 && (dir > 0 ? b.l <= plan.sl : b.h >= plan.sl)) slAt = i;
    plan.tps.forEach((t, k) => {
      if (tpAt[k] < 0 && (dir > 0 ? b.h >= t.price : b.l <= t.price)) tpAt[k] = i;
    });
  };
  bars.forEach(see);
  if (r.price != null) see({ h: r.price, l: r.price }, bars.length);
  const sl = slAt >= 0 || !!plan.slHit;
  const tp = plan.tps.map((t, k) => tpAt[k] >= 0 || !!t.hit);
  if (plan.slHit && slAt < 0) slAt = bars.length + 1;
  plan.tps.forEach((t, k) => { if (t.hit && tpAt[k] < 0) tpAt[k] = bars.length + 1; });
  const events = [];
  if (slAt >= 0) events.push({ kind: "sl", at: slAt });
  tpAt.forEach((at, k) => { if (at >= 0) events.push({ kind: "tp", i: k, at }); });
  events.sort((a, b) => a.at - b.at);
  return { sl, tp, events };
}
function verdictText(plan, res) {
  const name = (i) => `TP ${plan.tps.length > 1 ? i + 1 : 1}`;
  const first = res.events[0];
  if (!first) return "Aucun niveau touché.";
  const same = res.events.some((e) => e.at === first.at && e !== first);
  if (same && res.sl && res.tp.some(Boolean)) return "SL et TP touchés sur la même bougie. On ne sait pas lequel en premier.";
  if (first.kind === "sl") {
    const later = [];
    res.tp.forEach((hit, i) => { if (hit) later.push(name(i)); });
    return later.length
      ? `SL touché en premier. ${later.join(" et ")} vu après : ça ne compte pas.`
      : `SL touché. ${plan.tps.map((_, i) => `${name(i)} pas atteint`).join(". ")}.`;
  }
  return res.sl
    ? `${name(first.i)} atteint en premier. Le SL est arrivé après : ça ne compte pas.`
    : `${name(first.i)} atteint. SL pas touché.`;
}
function slWord(res) {
  const first = res.events[0];
  if (!res.sl) return "pas touché";
  if (!first || first.kind === "sl") return "touché";
  return "après, pas pris";
}
function tpWord(res, i) {
  const first = res.events[0];
  if (!res.tp[i]) return "pas atteint";
  if (first && first.kind === "sl" && first.at !== (res.events.find((e) => e.kind === "tp" && e.i === i) || {}).at) return "après, pas pris";
  return "atteint";
}
function tpTitle(t, i, n) {
  const name = `TP ${n > 1 ? i + 1 : 1}`;
  return t.hit ? `${name} atteint` : name;
}
function tpHint(t) {
  if (t.kind === "cou") return "le cou";
  if (t.kind === "2r") return "2 fois la protection";
  return "hauteur du motif";
}
function moneyText(x, ccy) {
  const sign = x >= 0 ? "+" : "−";
  const body = num(Math.abs(x), 2);
  return ccy === "USD" ? `${sign}${body} $` : `${sign}${body} ${ccy}`;
}

function openNow(r) {
  if (!r || r.state !== "avis" || !r.pattern) return false;
  const plan = planOf(r);
  if (!plan || plan.status === "loin" || plan.status === "stop" || plan.status === "objectif") return false;
  const res = resultOf(r, plan);
  if (res.events[0] && res.events[0].kind === "sl") return false;
  if (res.tp.length && res.tp[res.tp.length - 1]) return false;
  return true;
}

function tick() {
  const n = Date.now();
  $("#clock").innerHTML = `${hm(n)}<br>${esc(new Date(n).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }))}`;
}

let derivWs = null;
let derivOpen = null;

function openDeriv() {
  if (derivWs && derivWs.readyState === 1) return Promise.resolve(derivWs);
  if (derivOpen) return derivOpen;
  derivOpen = new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://api.derivws.com/trading/v1/options/ws/public");
    const timer = setTimeout(() => { ws.close(); reject(new Error("délai")); }, 8000);
    ws.onopen = () => { clearTimeout(timer); derivWs = ws; resolve(ws); };
    ws.onclose = () => { if (derivWs === ws) derivWs = null; };
    ws.onerror = () => { clearTimeout(timer); reject(new Error("websocket")); };
  }).finally(() => { derivOpen = null; });
  return derivOpen;
}

function askDeriv(symbol, granularity) {
  return openDeriv().then((ws) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ws.removeEventListener("message", onMsg); reject(new Error("délai")); }, 8000);
    function onMsg(ev) {
      let j;
      try { j = JSON.parse(ev.data); } catch (e) { return; }
      const asked = j.echo_req && j.echo_req.ticks_history;
      if (asked && asked !== symbol) return;
      if (j.error) { clearTimeout(timer); ws.removeEventListener("message", onMsg); reject(new Error(j.error.message || "Deriv")); return; }
      if (j.msg_type === "candles" && j.candles && j.candles.length) {
        clearTimeout(timer);
        ws.removeEventListener("message", onMsg);
        resolve(j.candles.map((c) => ({ t: c.epoch, o: +c.open, h: +c.high, l: +c.low, c: +c.close })));
      }
    }
    ws.addEventListener("message", onMsg);
    ws.send(JSON.stringify({
      ticks_history: symbol, adjust_start_time: 1, count: 240, end: "latest", start: 1, style: "candles", granularity,
    }));
  }));
}

async function fetchOHLC(symbol, granularity) {
  for (let attempt = 1; ; attempt++) {
    try { return await askDeriv(symbol, granularity); }
    catch (e) {
      if (derivWs) { try { derivWs.close(); } catch (err) {} derivWs = null; }
      if (attempt >= 2) throw e;
      await sleep(400);
    }
  }
}

function winPct(r) { return r.record.n ? (100 * r.record.wins) / r.record.n : 0; }
function riskOf(r) {
  let score = 0;
  if (!r.pattern) score++;
  if (r.pattern && (!r.pattern.slow || !r.pattern.reintegrated || r.pattern.tooFar)) score++;
  if (r.vr != null && (r.vr > 1.6 || r.vr < 0.45)) score++;
  if (r.record.n >= 8 && winPct(r) < 40) score++;
  if (r.levels && r.levels.rr < 2) score++;
  if (!r.levels) score++;
  if (score <= 1) return ["mod", "Risque modéré"];
  if (score === 2) return ["haut", "Risque élevé"];
  return ["tres", "Risque très élevé"];
}
function choiceFor(r) {
  const spec = styleById(styleId);
  const bucket = r.pattern?.key ?? Math.floor(scannedAt / 1000 / spec.step);
  return choices[`${r.id}:${styleId}:${manual ? "m" : "a"}:${bucket}`];
}
function quoteOf(ccy) {
  const hit = reports.find((r) => r.id === `${ccy}USD` && r.price);
  return hit ? hit.price : null;
}

function chart(r) {
  const bars = r.candles;
  if (!bars || bars.length < 2 || r.price == null) return "";
  const W = 300, H = 92;
  const plan = planOf(r);
  const marks = plan ? plan.tps.map((t) => t.price) : [];
  const hi = Math.max(...bars.map((b) => b.h), r.pattern ? r.pattern.neck : -Infinity, ...(marks.length ? marks : [-Infinity]));
  const lo = Math.min(...bars.map((b) => b.l), r.pattern ? Math.min(r.pattern.ext1, r.pattern.ext2) : Infinity, ...(marks.length ? marks : [Infinity]));
  const span = hi - lo || 1;
  const x = (i) => (i / (bars.length - 1)) * W;
  const y = (p) => 6 + ((hi - p) / span) * (H - 14);
  const bodies = bars.map((b, i) => {
    const up = b.c >= b.o;
    const color = up ? "var(--color-buy)" : "var(--color-sell)";
    const y1 = y(Math.max(b.o, b.c));
    const h = Math.max(1.2, Math.abs(y(b.o) - y(b.c)));
    return `<line x1="${x(i)}" x2="${x(i)}" y1="${y(b.h)}" y2="${y(b.l)}" stroke="${color}" stroke-width="1"/><rect x="${x(i) - 2.2}" y="${y1}" width="4.4" height="${h}" fill="${color}" opacity="0.9"/>`;
  }).join("");
  let guides = "";
  if (r.pattern) {
    const neck = y(r.pattern.neck);
    const extP = r.pattern.dir > 0 ? Math.min(r.pattern.ext1, r.pattern.ext2) : Math.max(r.pattern.ext1, r.pattern.ext2);
    const targets = plan ? plan.tps.map((t) => `<line x1="0" x2="${W}" y1="${y(t.price)}" y2="${y(t.price)}" stroke="${t.hit ? "var(--color-muted)" : "var(--color-buy)"}" stroke-dasharray="4 3" stroke-width="1"/>`).join("") : "";
    guides = `<line x1="0" x2="${W}" y1="${neck}" y2="${neck}" stroke="var(--color-focus)" stroke-dasharray="4 3" stroke-width="1"/><line x1="0" x2="${W}" y1="${y(extP)}" y2="${y(extP)}" stroke="var(--color-warn)" stroke-dasharray="2 3" stroke-width="1"/>${targets}`;
  }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Dernières bougies">${bodies}${guides}</svg>`;
}

function card(r, i) {
  const mk = MARKETS.find((m) => m.id === r.id);
  const sell = r.dir < 0;
  const w = winPct(r);
  const [rk, rl] = riskOf(r);
  const ringc = r.record.n < 8 ? "var(--color-muted)" : w >= 45 ? "var(--color-buy)" : "var(--color-warn)";
  const ch = choiceFor(r);
  const plan = planOf(r);
  const res = plan ? resultOf(r, plan) : null;
  const finished = plan && (plan.status === "objectif" || plan.status === "stop" || (res && res.sl && res.tp.every(Boolean)));
  const hitN = res ? res.tp.filter(Boolean).length : 0;
  const closed = finished || (plan && plan.status === "partiel");
  const first = res && res.events[0];
  const kind = !r.pattern ? "W/M non détecté" : first && first.kind === "sl" && closed ? "SL touché" : first && first.kind === "tp" && closed ? "TP atteint" : plan && plan.status === "partiel" ? `TP ${hitN} atteint` : r.pattern.slow && r.pattern.secondPart && r.pattern.reintegrated && !r.pattern.tooFar ? `${r.pattern.side} à juger` : `${r.pattern.side} possible`;
  const kindOk = !finished && r.pattern && r.pattern.reintegrated && r.pattern.secondPart && !r.pattern.slHit;
  const move = plan && r.price != null ? r.dir * (r.price - plan.entry) : 0;
  const levels = plan ? `<dl class="lv">
      <div><dt>Entrée</dt><dd>${fmt(plan.entry, mk.dp)}</dd><span>${plan.entryKind === "cou" ? "au cou" : "au cours"}</span></div>
      <div><dt>SL</dt><dd class="sl">${fmt(plan.sl, mk.dp)}</dd><span>${closed ? slWord(res) : esc(distText(mk, plan.dist))}</span></div>
      ${plan.tps.map((t, i) => `<div><dt>TP ${plan.tps.length > 1 ? i + 1 : 1}</dt><dd class="${res.tp[i] && !(res.events[0] && res.events[0].kind === "sl") ? "tp" : ""}">${fmt(t.price, mk.dp)}</dd><span>${closed || res.tp[i] ? tpWord(res, i) : esc(distText(mk, t.reward))}</span></div>`).join("")}
    </dl>` + (!closed && plan.tps.length < 2 ? `<p class="taken">Un seul TP : le motif ne va pas plus loin.</p>` : "") + (closed
      ? `<p class="taken">${esc(verdictText(plan, res))}${finished ? " Ce n'est plus une nouvelle entrée." : ""}</p>`
      : plan.status === "loin"
        ? `<p class="taken">Prix trop éloigné du cou. Les niveaux restent ceux du motif, sans nouvelle entrée.</p>`
        : "") : `<p class="taken">Pas de niveaux proposés : la géométrie du motif manque.</p>`;
  const notes = r.notes.filter((n) => (plan ? !/Géométrie incomplète/.test(n) : true) && (!closed || !/déjà touché|mauvais côté du cou/.test(n))).slice(0, 3).map((n) => `<li>${esc(n)}</li>`).join("");
  const past = r.record.n
    ? `${r.record.n} passages sur ~${r.days} j. Résultat moyen ${r.record.avg >= 0 ? "+" : "−"}${num(Math.abs(r.record.avg), 2)} R.`
    : "Trop peu de géométries passées pour un bilan.";
  const spec = specOf(mk);
  const choices = lotChoices(spec);
  const used = lotFor(mk);
  const sim = plan ? `<details class="sim" data-id="${esc(r.id)}"><summary>Simuler un lot</summary>
      <div class="lots" role="group" aria-label="Lot">
        ${choices.map((v) => `<button type="button" class="${Math.abs(used - v) < 1e-9 ? "on" : ""}" data-lot="${v}">${num(v, lotDigits(spec.min))}</button>`).join("")}
      </div>
      <label class="lot-in">Lot, minimum ${num(spec.min, lotDigits(spec.min))}<input type="number" inputmode="decimal" min="${spec.min}" step="${spec.min < 0.01 ? 0.001 : 0.01}" value="${used}" data-sim="lot"></label>
      <dl class="sim-r" data-sim="out"></dl>
      <p class="sim-n" data-sim="note"></p>
    </details>` : "";
  const actions = finished
    ? ""
    : ch && ch.c === "pris"
    ? `<p class="taken">Vous avez pris ce cas. Placez-le vous-même, avec ces niveaux, si la figure vous convient.</p><div class="choice"><button class="btn" type="button" data-undo="${esc(r.id)}">Annuler mon choix</button></div>`
    : ch && ch.c === "passe"
      ? `<p class="taken">Vous avez passé ce cas.</p><div class="choice"><button class="btn" type="button" data-undo="${esc(r.id)}">Revoir</button></div>`
      : `<div class="choice"><button class="btn go" type="button" data-take="${esc(r.id)}">Je prends</button><button class="btn" type="button" data-skip="${esc(r.id)}">Je passe</button></div>`;
  return `<article class="card glass rise" id="m-${esc(r.id)}" data-dir="${r.dir}" data-choice="${ch ? ch.c : ""}" style="--i:${i}">
    <div class="head"><div><p class="name">${esc(mk.name)}${mk.aka ? `<span class="buf">${esc(mk.aka)}</span>` : ""}<span class="buf">${esc(r.tf)}</span></p><div class="px">${r.price != null ? fmt(r.price, mk.dp) : "—"}</div></div>
      <div class="ring" style="--p:${r.record.n ? Math.round(w) : 0};--ringc:${ringc}" role="img" aria-label="${r.record.n ? Math.round(w) + " % de cas gagnants" : "Peu de cas"}"><b>${r.record.n ? Math.round(w) + " %" : "—"}<small>${r.record.n ? "gagnants" : "peu de cas"}</small></b></div>
    </div>
    <div><span class="call">${finished ? (sell ? "Vente terminée" : "Achat terminé") : sell ? "Vendre" : "Acheter"}</span><span class="${kindOk ? "kind ok" : "kind"}">${esc(kind)}</span><span class="buf">buffer ${r.buffer > 0 ? "+" + r.buffer : r.buffer}</span><span class="subcall">${closed && res ? esc(verdictText(plan, res)) : r.manual ? "Sens à examiner, pas une entrée automatique." : "Mode historique : le motif filtre le sens."}</span></div>
    ${chart(r)}
    ${levels}
    <div class="risk" data-r="${rk}"><b class="lvl">${rl}</b><ul><li>${esc(r.reason)}</li>${notes}<li>${esc(past)}</li></ul></div>
    ${sim}
    ${actions}
  </article>`;
}

function simulate(box) {
  const id = box.dataset.id;
  const r = reports.find((x) => x.id === id);
  const plan = planOf(r);
  if (!plan) return;
  const mk = MARKETS.find((m) => m.id === id);
  const spec = specOf(mk);
  const lots = lotFor(mk);
  const price = r.price ?? plan.entry;
  const loss = moneyFor(mk, price, plan.dist, lots);
  const gains = plan.tps.map((t, i) => {
    const g = moneyFor(mk, price, t.reward, lots);
    return `<div><dt>${esc(tpTitle(t, i, plan.tps.length))}</dt><dd class="g">${moneyText(g.v, g.ccy)}</dd></div>`;
  }).join("");
  const avg = r.record.n ? r.record.avg * loss.v : 0;
  box.querySelector("[data-sim=out]").innerHTML = `${gains}<div><dt>SL touché</dt><dd class="l">${moneyText(-loss.v, loss.ccy)}</dd></div><div><dt>En moyenne</dt><dd>${r.record.n ? moneyText(avg, loss.ccy) : "—"}</dd></div>`;
  const metal = mk.cls === "gold" || /^frxX(AU|AG|PD|PT)/.test(mk.id);
  const unit = metal
    ? `1,00 $ de cours = ${num(spec.contract, 0)} $ pour 1 lot`
    : mk.cls === "fx"
      ? `1 lot = ${spec.contract.toLocaleString("fr-FR")} ${spec.ccy}`
      : `1 lot = ${spec.contract} ${spec.ccy === "USD" ? "$" : spec.ccy} par point`;
  box.querySelector("[data-sim=note]").textContent = `Lot minimum Deriv ${num(spec.min, lotDigits(spec.min))}. ${unit}.`;
}

function render(fresh) {
  const avis = reports.filter((r) => r.state === "avis");
  const live = avis.filter(openNow);
  const ordered = live.concat(avis.filter((r) => !openNow(r)));
  const rest = reports.filter((r) => r.state !== "avis");
  const grid = $("#grid");
  grid.className = fresh ? "grid fresh" : "grid";
  grid.innerHTML = ordered.length ? ordered.map(card).join("") : `<div class="glass empty">${!reports.length || busy ? "Lecture en cours." : manual ? "Aucun marché ne passe les filtres encore actifs." : "Aucun motif ne passe les anciens critères."}</div>`;
  $("#others").innerHTML = rest.length ? rest.map((r) => {
    const mk = MARKETS.find((m) => m.id === r.id);
    return `<li id="m-${esc(r.id)}"><b>${esc(mk.name)}</b><b>${r.price != null ? fmt(r.price, mk.dp) : "?"}</b><span>${esc(r.reason)}</span></li>`;
  }).join("") : `<li><span>${reports.length ? "Tous les marchés lus ont un sens à examiner." : "Pas encore de lecture."}</span></li>`;
  const order = new Map(MARKETS.map((m, i) => [m.id, i]));
  const listed = reports.slice().sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  $("#names").innerHTML = listed.map((r) => {
    const mk = MARKETS.find((m) => m.id === r.id);
    return `<a class="namechip${r.state === "avis" ? " on" : ""}" href="#m-${esc(r.id)}">${esc(mk.name)}</a>`;
  }).join("");
  const withPattern = ordered.filter((r) => r.pattern).length;
  $("#headline").textContent = !reports.length ? "Lecture des marchés…" : reports.every((r) => r.state === "erreur") ? "Prix illisibles." : live.length ? `${live.length} occasion${live.length > 1 ? "s" : ""} ouverte${live.length > 1 ? "s" : ""}` : ordered.length ? "Aucune occasion encore ouverte." : "Rien à proposer pour l'instant.";
  $("#sub").textContent = !reports.length ? "Les fiches arrivent dès que les prix sont lus." : reports.every((r) => r.state === "erreur") ? "La source des prix ne répond pas. Réessayez." : live.length ? "Elles sont en haut. L'alerte part dans ntfy tout de suite." : manual ? `${withPattern ? withPattern + " W ou M déjà terminé" + (withPattern > 1 ? "s" : "") + ". " : ""}Aucun ordre n'est envoyé.` : "Mode historique : sans W/M lent, confirmé et réintégré, le sens reste refusé.";
  document.querySelectorAll(".sim[open]").forEach(simulate);
}

function paintChrome() {
  $("#styles").innerHTML = STYLES.map((s) => `<button type="button" aria-pressed="${styleId === s.id}" data-style="${s.id}">${esc(s.label)}<span class="buf">${esc(s.tf)}</span></button>`).join("");
  $("#families").innerHTML = FAMILIES.map((f) => `<button type="button" aria-pressed="${family === f}" data-family="${esc(f)}">${esc(f)}</button>`).join("");
  const b = $("#manual");
  b.className = manual ? "btn on" : "btn";
  b.setAttribute("aria-pressed", String(manual));
  b.textContent = manual ? "W/M jugé à l'œil" : "W/M filtre automatique";
}

async function scan() {
  const token = ++gen;
  busy = true;
  const btn = $("#refresh");
  btn.disabled = true;
  btn.textContent = "Lecture…";
  const spec = styleById(styleId);
  const list = MARKETS.filter((m) => m.aka === family);
  $("#status").textContent = `Lecture des prix : 0 sur ${list.length}`;
  const out = [];
  for (let i = 0; i < list.length; i += 3) {
    if (token !== gen) return;
    const batch = list.slice(i, i + 3);
    await Promise.all(batch.map(async (mk, k) => {
      const idx = i + k;
      try { out[idx] = evaluate(mk, await fetchOHLC(mk.id, spec.step), Date.now() / 1000, spec, manual); }
      catch (e) { out[idx] = evaluate(mk, null, Date.now() / 1000, spec, manual); }
    }));
    reports = out.filter(Boolean);
    scannedAt = Date.now();
    $("#status").textContent = `Lecture des prix : ${Math.min(i + batch.length, list.length)} sur ${list.length}`;
    render(i === 0);
  }
  if (token !== gen) return;
  busy = false;
  btn.disabled = false;
  btn.textContent = "Actualiser";
  const failed = reports.filter((r) => r.state === "erreur").length;
  $("#status").textContent = failed === list.length ? "Aucun prix reçu. Deriv ne répond pas." : `Prix Deriv à ${hm(scannedAt)}, ${family}, en ${spec.tf}.`;
  render(true);
  alertLive();
}

function pctText(r) {
  if (!r.record?.n) return "peu de cas";
  return `${Math.round((100 * r.record.wins) / r.record.n)} %`;
}

function grade(r) {
  const p = r.pattern;
  const rr = r.levels?.rr || 0;
  if (!p) return "NUL";
  const complete = p.slow && p.secondPart && p.reintegrated && !p.tooFar && !p.slHit && !p.tpHit && !r.opposed;
  if (complete && rr >= 2) return "MEILLEUR";
  if (rr >= 1 && p.reintegrated && !p.tooFar && !p.slHit && !p.tpHit) return "MOYEN";
  return "NUL";
}

function alertLive() {
  const seen = store.get("ct.ntfy", {});
  const spec = styleById(styleId);
  let changed = false;
  for (const r of reports) {
    if (!openNow(r)) continue;
    const key = `${r.id}:${styleId}:${r.pattern.key}`;
    if (seen[key]) continue;
    seen[key] = Date.now();
    changed = true;
    const mk = MARKETS.find((m) => m.id === r.id);
    const plan = planOf(r);
    const sens = r.dir < 0 ? "SELL" : "BUY";
    const rang = grade(r);
    const pct = pctText(r);
    const title = `${rang} ${pct} ${sens} ${mk.name}`;
    const body = [rang, pct, sens, `${spec.label} ${spec.tf}`, `Entrée ${fmt(plan.entry, mk.dp)}`, `SL ${fmt(plan.sl, mk.dp)}`, ...plan.tps.map((t, i) => `TP ${i + 1} ${fmt(t.price, mk.dp)}`)].join("\n");
    if (store.get("ct.notif", false) && "Notification" in window && Notification.permission === "granted") {
      try { new Notification(title, { body, tag: key }); } catch (e) {}
    }
    fetch("https://ntfy.sh/catrade-a8e3f19c4d", {
      method: "POST",
      headers: { Title: title, Priority: "5", Tags: "rotating_light", Click: "https://cathep.github.io/catrade/" },
      body,
    }).catch(() => {});
  }
  if (changed) store.set("ct.ntfy", seen);
}

function choose(id, c) {
  const spec = styleById(styleId);
  const r = reports.find((x) => x.id === id);
  const bucket = r?.pattern?.key ?? Math.floor(scannedAt / 1000 / spec.step);
  const key = `${id}:${styleId}:${manual ? "m" : "a"}:${bucket}`;
  if (c) choices[key] = { c, at: Date.now() };
  else delete choices[key];
  store.set("ct.choices", choices);
  render(false);
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.id === "refresh") scan();
  else if (b.id === "copyTopic") {
    const topic = $("#topic").textContent;
    const done = () => { b.textContent = "Sujet copié"; };
    if (navigator.clipboard) navigator.clipboard.writeText(topic).then(done, done);
    else done();
  }
  else if (b.dataset.style) { styleId = b.dataset.style; store.set("ct.style", styleId); paintChrome(); scan(); }
  else if (b.dataset.family) { family = b.dataset.family; store.set("ct.family", family); paintChrome(); scan(); }
  else if (b.id === "manual") { manual = !manual; store.set("ct.manual", manual); paintChrome(); scan(); }
  else if (b.dataset.lot) {
    const card = b.closest("article");
    const mk = MARKETS.find((m) => m.id === (card && card.id.slice(2)));
    const spec = mk ? specOf(mk) : { min: 0, max: Infinity };
    const v = parseFloat(b.dataset.lot);
    if (v + 1e-12 < spec.min) return;
    simLot = v; store.set("ct.simLot", simLot); render(false);
  }
  else if (b.dataset.take) choose(b.dataset.take, "pris");
  else if (b.dataset.skip) choose(b.dataset.skip, "passe");
  else if (b.dataset.undo) choose(b.dataset.undo, null);
  else if (b.id === "notif") {
    const note = $("#notif-note");
    if (!("Notification" in window)) {
      if (note) note.textContent = "Ce navigateur n'accepte pas l'alerte de la page. Écran verrouillé : la veille Grok part à 8 h, 13 h et 18 h.";
      return;
    }
    Notification.requestPermission().then((perm) => {
      const ok = perm === "granted";
      store.set("ct.notif", ok);
      b.textContent = ok ? "Alertes actives" : "Activer les alertes";
      b.className = ok ? "btn on" : "btn";
      if (note) note.textContent = ok
        ? "Alertes actives. Un nouveau W ou M seulement, tant que cette page reste ouverte."
        : "Alerte refusée. Écran verrouillé : la veille Grok part à 8 h, 13 h et 18 h.";
      if (ok) alertLive();
    });
  }
});
document.addEventListener("input", (e) => {
  const box = e.target.closest(".sim");
  if (!box) return;
  if (e.target.dataset.sim === "lot") {
    const mk = MARKETS.find((m) => m.id === box.dataset.id);
    const spec = mk ? specOf(mk) : { min: 0, max: Infinity };
    const v = Math.max(0, parseFloat(e.target.value) || 0);
    if (v && v + 1e-12 < spec.min) return;
    simLot = v; store.set("ct.simLot", simLot);
  }
  simulate(box);
});
document.addEventListener("toggle", (e) => { if (e.target.classList && e.target.classList.contains("sim") && e.target.open) simulate(e.target); }, true);

paintChrome();
tick();
setInterval(tick, 30000);
const notifOk = store.get("ct.notif", false) && "Notification" in window && Notification.permission === "granted";
$("#notif").textContent = notifOk ? "Alertes actives" : "Activer les alertes";
$("#notif").className = notifOk ? "btn on" : "btn";
scan();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !busy) scan();
});
setInterval(() => { if (document.visibilityState === "visible" && !busy) scan(); }, 90 * 1000);
