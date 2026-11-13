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
if (!FAMILIES.includes(family)) family = FAMILIES[0] || "Volatility";
let manual = true;
let reports = [];
let busy = false;
const BUILD = "53";
let scannedAt = 0;
let choices = store.get("ct.choices", {});
let simLot = store.get("ct.simLot", null);
let gen = 0;

const LOT_SPEC = {
  "Volatility 10 (1s) Index": { min: 0.5, max: 810, contract: 1, ccy: "USD" },
  "Volatility 10 Index": { min: 0.5, max: 1280, contract: 1, ccy: "USD" },
  "Volatility 100 (1s) Index": { min: 1, max: 900, contract: 1, ccy: "USD" },
  "Volatility 100 Index": { min: 1, max: 1000, contract: 1, ccy: "USD" },
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

function chart(r, plan) {
  const bars = r.candles;
  if (!bars || bars.length < 2 || r.price == null) return "";
  const zones = (r.zones || []).filter((z) => z.role === "directeur" || (plan && plan.kind === "W" && z.role === "entree"));
  const W = 300, H = 128;
  const marks = [];
  if (plan) marks.push(plan.ref, plan.sl, plan.tp, plan.objective);
  if (plan && plan.kind === "W" && r.pattern) marks.push(r.pattern.neck);
  for (const z of zones) marks.push(z.top, z.bottom);
  const hi = Math.max(...bars.map((b) => b.h), ...(marks.length ? marks : [-Infinity]));
  const lo = Math.min(...bars.map((b) => b.l), ...(marks.length ? marks : [Infinity]));
  const span = hi - lo || 1;
  const x = (i) => (i / (bars.length - 1)) * W;
  const y = (p) => 8 + ((hi - p) / span) * (H - 16);
  const x0 = (from) => {
    const local = from - (r.origin || 0);
    if (local <= 0) return 0;
    if (local >= bars.length - 1) return W;
    return x(local);
  };
  const bands = zones.map((z, n) => {
    const yy = y(z.top);
    const h = y(z.bottom) - yy;
    if (!(h > 0) || !Number.isFinite(yy)) return "";
    const left = x0(z.from);
    const color = z.role === "entree" ? "var(--color-focus)" : "var(--color-sell)";
    return `<rect x="${left}" y="${yy}" width="${Math.max(1, W - left)}" height="${h}" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-opacity="0.85" stroke-width="1"/>`;
  }).join("");
  const bodies = bars.map((b, i) => {
    const up = b.c >= b.o;
    const color = up ? "var(--color-buy)" : "var(--color-sell)";
    const y1 = y(Math.max(b.o, b.c));
    const h = Math.max(1.2, Math.abs(y(b.o) - y(b.c)));
    return `<line x1="${x(i)}" x2="${x(i)}" y1="${y(b.h)}" y2="${y(b.l)}" stroke="${color}" stroke-width="1"/><rect x="${x(i) - 2.2}" y="${y1}" width="4.4" height="${h}" fill="${color}" opacity="0.9"/>`;
  }).join("");
  const line = (px, color, dash) => {
    const yy = y(px);
    if (!Number.isFinite(yy)) return "";
    return `<line x1="0" x2="${W}" y1="${yy}" y2="${yy}" stroke="${color}" stroke-dasharray="${dash}" stroke-width="1.25"/>`;
  };
  let guides = "";
  if (plan) {
    guides = line(plan.ref, "var(--color-warn)", "2 3") + line(plan.sl, "var(--color-sell)", "1 3") + line(plan.tp, "var(--color-buy)", "4 3");
    if (plan.kind !== "W" && Math.abs(plan.objective - plan.tp) > plan.dist * 0.02) guides += line(plan.objective, "var(--color-focus)", "1 4");
  }
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Bougies, zone du W et niveaux">${bands}${bodies}${guides}</svg>`;
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

function courseCard(r, plan, i) {
  const mk = MARKETS.find((m) => m.id === r.id);
  const spec = styleById(styleId);
  const sell = plan.dir < 0;
  const ch = choiceFor(r);
  const span = plan.tp - plan.ref || 1;
  const q = r.price == null ? 0 : (r.price - plan.ref) / span;
  const pct = Math.max(0, Math.min(100, q * 100));
  const actions = ch && ch.c === "pris"
    ? `<p class="taken">Noté. Tu places l'ordre toi-même.</p><div class="choice"><button class="btn" type="button" data-undo="${esc(r.id)}">Annuler</button></div>`
    : ch && ch.c === "passe"
      ? `<p class="taken">Tu as passé ce cas.</p><div class="choice"><button class="btn" type="button" data-undo="${esc(r.id)}">Revoir</button></div>`
      : `<div class="choice"><button class="btn go" type="button" data-take="${esc(r.id)}">Je prends</button><button class="btn" type="button" data-skip="${esc(r.id)}">Je passe</button></div>`;
  return `<article class="card glass rise" id="m-${esc(r.id)}" data-dir="${plan.dir}" data-choice="${ch ? ch.c : ""}" style="--i:${i}">
    <div class="head"><div><p class="name">${esc(mk.name)}<span class="buf">${esc(spec.tf)}</span></p><div class="px">${r.price != null ? fmt(r.price, mk.dp) : "—"}</div></div>
      <div class="ring" style="--p:65;--ringc:var(--color-buy)"><b>cou<small>la sortie</small></b></div>
    </div>
    <div><span class="call">${sell ? "Vendre" : "Acheter"}</span><span class="kind" data-k="${esc(plan.kind)}">${plan.kind === "ZONE" ? "Zone" : esc(plan.kind)}</span><span class="subcall">${esc(plan.note)}</span></div>
    ${chart(r, plan)}
    <p class="legend"><span><i class="zn entz"></i>zone du W</span><span><i class="zn dirz"></i>niveau</span><span><i class="ln ent"></i>entrée</span><span><i class="ln sln"></i>stop</span><span><i class="ln tpn"></i>cou</span></p>
    <div class="rail" aria-hidden="true"><i style="width:${pct}%"></i></div>
    <dl class="lv">
      <div><dt>Entrée</dt><dd>${fmt(plan.ref, mk.dp)}</dd></div>
      <div><dt>Stop</dt><dd class="sl">${fmt(plan.sl, mk.dp)}</dd><span>${esc(distText(mk, plan.dist))}</span></div>
      <div><dt>Sortie</dt><dd class="tp">${fmt(plan.tp, mk.dp)}</dd><span>le cou</span></div>
    </dl>
    <p class="stack">${plan.kind === "ZONE" ? "Stop de l'autre côté de la zone. Sortie sur la zone d'après." : "On tient jusqu'au cou, sans rapprocher le stop."} ${esc(spec.stack)}</p>
    ${actions}
  </article>`;
}

function zoneCard(r, i) {
  const mk = MARKETS.find((m) => m.id === r.id);
  const spec = styleById(styleId);
  return `<article class="card glass" id="m-${esc(r.id)}" style="--i:${i}">
    <div class="head"><div><p class="name">${esc(mk.name)}<span class="buf">${esc(spec.tf)}</span></p><div class="px">${r.price != null ? fmt(r.price, mk.dp) : "—"}</div></div></div>
    <p class="subcall">${esc(r.reason || "Pas de W mûr.")}</p>
    ${chart(r, null)}
    <p class="legend"><span><i class="zn entz"></i>zone du W</span><span><i class="zn dirz"></i>niveau</span><span><i class="ln tpn"></i>cou</span></p>
  </article>`;
}

function render(fresh) {
  const spec = styleById(styleId);
  const plans = reports.map((r) => ({ r, plan: CT.coursePlan(r, spec) })).filter((x) => x.plan);
  plans.sort((a, b) => winPct(b.r) - winPct(a.r));
  const rest = reports.filter((r) => !plans.some((p) => p.r.id === r.id));
  const grid = $("#grid");
  grid.className = fresh ? "grid fresh" : "grid";
  const cards = plans.map((x, i) => courseCard(x.r, x.plan, i)).concat(rest.map((r, i) => zoneCard(r, plans.length + i)));
  grid.innerHTML = cards.length ? cards.join("") : `<div class="glass empty">${!reports.length || busy ? "Lecture en cours." : "Aucun prix reçu."}</div>`;
  const othersTitle = document.querySelector("summary.sec");
  if (othersTitle) othersTitle.textContent = rest.length ? `Les autres · ${rest.length}` : "Les autres";
  $("#others").innerHTML = rest.length ? rest.map((r) => {
    const mk = MARKETS.find((m) => m.id === r.id);
    return `<li><b>${esc(mk.name)}</b><b>${r.price != null ? fmt(r.price, mk.dp) : "?"}</b><span>${esc(r.reason)}</span></li>`;
  }).join("") : `<li><span>${reports.length ? "Tous les marchés lus ont un setup mûr." : "Pas encore de lecture."}</span></li>`;
  const order = new Map(MARKETS.map((m, i) => [m.id, i]));
  const listed = reports.slice().sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  $("#names").innerHTML = listed.map((r) => {
    const mk = MARKETS.find((m) => m.id === r.id);
    const ripe = plans.some((p) => p.r.id === r.id);
    return `<a class="namechip${ripe ? " on" : ""}" href="#m-${esc(r.id)}">${esc(mk.name)}</a>`;
  }).join("");
  $("#headline").textContent = !reports.length ? "Lecture des marchés…" : reports.every((r) => r.state === "erreur") ? "Prix illisibles." : plans.length ? `${plans.length} W mûr${plans.length > 1 ? "s" : ""}.` : "Aucun W mûr pour l'instant.";
  $("#sub").textContent = !reports.length ? "Les fiches arrivent dès que les prix sont lus." : reports.every((r) => r.state === "erreur") ? "La source des prix ne répond pas. Réessayez." : "Entrée dans le premier cinquième, sortie au cou.";
}

function paintChrome() {
  $("#styles").innerHTML = STYLES.map((s) => `<button type="button" aria-pressed="${styleId === s.id}" data-style="${s.id}">${esc(s.label)}<span class="buf">${esc(s.tf)}</span></button>`).join("");
  $("#families").innerHTML = FAMILIES.map((f) => `<button type="button" aria-pressed="${family === f}" data-family="${esc(f)}">${esc(f)}</button>`).join("");
  const stack = $("#stack");
  if (stack) stack.textContent = styleById(styleId).stack;
}

async function scan() {
  const token = ++gen;
  busy = true;
  const btn = $("#refresh");
  btn.disabled = true;
  btn.textContent = "Lecture…";
  try {
    const res = await fetch("./index.html?ts=" + Date.now(), { cache: "no-store" });
    const html = await res.text();
    const found = html.match(/app\.js\?v=(\d+)/);
    if (found && found[1] !== BUILD) {
      location.replace("./?v=" + found[1]);
      return;
    }
  } catch (e) {}
  const spec = styleById(styleId);
  const list = MARKETS.filter((m) => m.aka === family);
  $("#status").textContent = `Lecture des prix : 0 sur ${list.length}`;
  const out = [];
  for (let i = 0; i < list.length; i += 3) {
    if (token !== gen) return;
    const batch = list.slice(i, i + 3);
    await Promise.all(batch.map(async (mk, k) => {
      const idx = i + k;
      try {
        const bars = await fetchOHLC(mk.id, spec.step);
        const row = evaluate(mk, bars, Date.now() / 1000, spec, manual);
        row.bars = bars;
        out[idx] = row;
      }
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

function maxwellPlan(r) {
  const p = r.pattern;
  if (!p || !p.slow || !p.secondPart || r.price == null) return null;
  const span = p.dir > 0 ? p.neck - p.ext1 : p.ext1 - p.neck;
  if (!(span > 0)) return null;
  const progress = p.dir > 0 ? (r.price - p.ext1) / span : (p.ext1 - r.price) / span;
  if (!(progress >= 0 && progress <= 0.2)) return null;
  const pad = (r.atr || 0) * 0.12;
  const sl = p.dir > 0 ? Math.min(p.ext1, p.ext2) - pad : Math.max(p.ext1, p.ext2) + pad;
  if (p.dir > 0 ? r.price <= sl : r.price >= sl) return null;
  const dist = Math.abs(p.ext1 - sl);
  if (!(dist > 0)) return null;
  return { ref: p.ext1, neck: p.neck, sl, dist };
}

function youngTrend(k, dir) {
  const highs = [];
  const lows = [];
  const wing = 3;
  const start = Math.max(wing, k.length - 160);
  for (let i = start; i < k.length - wing; i++) {
    let hi = true;
    let lo = true;
    for (let j = i - wing; j <= i + wing; j++) {
      if (j === i) continue;
      if (k[j].h >= k[i].h) hi = false;
      if (k[j].l <= k[i].l) lo = false;
    }
    if (hi) highs.push(i);
    if (lo) lows.push(i);
  }
  if (dir > 0) {
    for (let n = lows.length - 2; n >= 1; n--) {
      const prev = lows[n - 1];
      const turn = lows[n];
      const next = lows[n + 1];
      if (!(k[prev].l > k[turn].l && k[next].l > k[turn].l)) continue;
      const before = highs.filter((i) => i < turn && i > turn - 120);
      if (!before.length || !highs.some((i) => i > turn)) continue;
      const origin = before.reduce((a, b) => (k[a].h >= k[b].h ? a : b));
      const floor = k[turn].l;
      const objective = k[origin].h;
      if (!(objective > floor)) continue;
      const levels = lows.filter((i) => i > origin && i < turn).map((i) => k[i].l).filter((px) => px > floor && px < objective);
      return { floor, objective, levels };
    }
  } else {
    for (let n = highs.length - 2; n >= 1; n--) {
      const prev = highs[n - 1];
      const turn = highs[n];
      const next = highs[n + 1];
      if (!(k[prev].h < k[turn].h && k[next].h < k[turn].h)) continue;
      const before = lows.filter((i) => i < turn && i > turn - 120);
      if (!before.length || !lows.some((i) => i > turn)) continue;
      const origin = before.reduce((a, b) => (k[a].l <= k[b].l ? a : b));
      const floor = k[turn].h;
      const objective = k[origin].l;
      if (!(objective < floor)) continue;
      const levels = highs.filter((i) => i > origin && i < turn).map((i) => k[i].h).filter((px) => px < floor && px > objective);
      return { floor, objective, levels };
    }
  }
  return null;
}

function trendPlan(r) {
  const simple = maxwellPlan(r);
  const p = r.pattern;
  if (!simple || !p || !r.bars || r.bars.length < 40) return null;
  const trend = youngTrend(r.bars, p.dir);
  if (!trend) return null;
  const span = Math.abs(trend.objective - trend.floor);
  const progress = p.dir > 0 ? (r.price - trend.floor) / span : (trend.floor - r.price) / span;
  if (!(progress >= 0 && progress < 0.8)) return null;
  if (p.dir > 0 ? trend.objective <= simple.ref : trend.objective >= simple.ref) return null;
  const reward = Math.abs(trend.objective - simple.ref);
  if (!(reward > simple.dist)) return null;
  const band = span * 0.08;
  let near = false;
  let passed = 0;
  for (const lv of trend.levels) {
    if (Math.abs(simple.ref - lv) <= band) near = true;
    else if (p.dir > 0 ? lv < simple.ref - band : lv > simple.ref + band) passed++;
  }
  const base = { ref: simple.ref, sl: simple.sl, dist: simple.dist, tp: trend.objective, reward, progress, key: p.key };
  if (near) return { ...base, kind: "PALIER", step: passed + 1, dir: p.dir };
  if (progress <= 0.3) return { ...base, kind: "TENDANCE", step: 1, dir: p.dir };
  return null;
}

function breakoutPlan(r) {
  const k = r.bars;
  if (!k || k.length < 50 || r.price == null || !(r.atr > 0)) return null;
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
      if (k[i].c > top) { dir = 1; break; }
      if (k[i].c < bot) { dir = -1; break; }
    }
    if (!dir) continue;
    const level = dir > 0 ? top : bot;
    const sl = dir > 0 ? bot : top;
    const mid = (top + bot) / 2;
    if (Math.abs(r.price - level) > 0.35 * height) continue;
    if (dir > 0 ? r.price < mid || r.price <= sl : r.price > mid || r.price >= sl) continue;
    let tp = null;
    const wing = 3;
    for (let i = wing; i < start; i++) {
      if (dir > 0) {
        let hi = true;
        for (let j = i - wing; j <= i + wing; j++) if (j !== i && k[j].h >= k[i].h) hi = false;
        if (hi && k[i].h > level + height * 0.5 && (tp == null || k[i].h < tp)) tp = k[i].h;
      } else {
        let lo = true;
        for (let j = i - wing; j <= i + wing; j++) if (j !== i && k[j].l <= k[i].l) lo = false;
        if (lo && k[i].l < level - height * 0.5 && (tp == null || k[i].l > tp)) tp = k[i].l;
      }
    }
    if (tp == null) continue;
    const reward = Math.abs(tp - level);
    const dist = Math.abs(level - sl);
    if (!(reward > dist * 0.5 && dist > 0)) continue;
    return { kind: "BREAKOUT", dir, ref: level, sl, dist, tp, reward, key: `${dir}:${level.toFixed(6)}` };
  }
  return null;
}

function gestion(plan, mk) {
  const span = plan.tp - plan.ref;
  const at = (q) => fmt(plan.ref + span * q, mk.dp);
  return [`40 % (${at(0.4)}) : stop à l'entrée`, `60 % (${at(0.6)}) : stop en profit`, `80 % (${at(0.8)}) : tu peux fermer`];
}

function alertLive() {
  const spec = styleById(styleId);
  const seen = store.get("ct.ntfy", {});
  let changed = false;
  for (const r of reports) {
    const plan = CT.coursePlan(r, spec);
    if (!plan) continue;
    const key = `${plan.kind}:${r.id}:${styleId}:${plan.key}`;
    if (seen[key]) continue;
    seen[key] = Date.now();
    changed = true;
    const mk = MARKETS.find((m) => m.id === r.id);
    const sens = plan.dir < 0 ? "SELL" : "BUY";
    const pct = pctText(r);
    const title = `${sens} ${plan.kind} ${pct} ${mk.name}`;
    const at = (q) => fmt(CT.gestionAt(plan, q), mk.dp);
    const body = [
      sens, plan.kind, pct, `${spec.label} ${spec.tf}`, spec.stack,
      `Entrée ${fmt(plan.ref, mk.dp)}`,
      `SL ${fmt(plan.sl, mk.dp)}`,
      `Sortie ${fmt(plan.tp, mk.dp)}`,
      plan.note,
      "On tient jusqu'au cou. On ne rapproche pas le stop avant.",
    ].join("\n");
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
