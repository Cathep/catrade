import fs from "fs";
import vm from "vm";

const TOPIC = process.env.NTFY_TOPIC || "catrade-a8e3f19c4d";
const DRY = process.env.DRY === "1";
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL("./engine.js", import.meta.url), "utf8"), ctx);
const { MARKETS, STYLES, evaluate, distText } = ctx.CT;

const wanted = process.env.STYLE;
const styles = wanted ? STYLES.filter((s) => s.id === wanted) : STYLES;
if (!styles.length) throw new Error(`style inconnu : ${wanted}`);
const seenPath = new URL("./notify-seen.json", import.meta.url);
const seen = new Set(fs.existsSync(seenPath) ? JSON.parse(fs.readFileSync(seenPath, "utf8")) : []);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function openDeriv() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://api.derivws.com/trading/v1/options/ws/public");
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error("délai"));
    }, 12000);
    ws.onopen = () => {
      clearTimeout(timer);
      resolve(ws);
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error("websocket"));
    };
  });
}

async function ask(ws, symbol, granularity) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          ws.removeEventListener("message", onMsg);
          reject(new Error("délai"));
        }, 12000);
        function onMsg(ev) {
          const j = JSON.parse(String(ev.data));
          const asked = j.echo_req && j.echo_req.ticks_history;
          if (asked && asked !== symbol) return;
          if (j.error) {
            clearTimeout(timer);
            ws.removeEventListener("message", onMsg);
            reject(new Error(j.error.message || "Deriv"));
            return;
          }
          if (j.msg_type === "candles" && j.candles && j.candles.length) {
            clearTimeout(timer);
            ws.removeEventListener("message", onMsg);
            resolve(j.candles.map((c) => ({ t: c.epoch, o: +c.open, h: +c.high, l: +c.low, c: +c.close })));
          }
        }
        ws.addEventListener("message", onMsg);
        ws.send(JSON.stringify({
          ticks_history: symbol, adjust_start_time: 1, count: 180, end: "latest", start: 1, style: "candles", granularity,
        }));
      });
    } catch (e) {
      const limited = /rate limit/i.test(String(e.message));
      if (attempt >= 5 || !limited) throw e;
      await sleep(12000);
    }
  }
}

const fmt = (v, dp) => v.toLocaleString("fr-FR", { minimumFractionDigits: dp, maximumFractionDigits: dp });

function deadline(now, style) {
  const t = new Date((now + style.maxBars * style.step) * 1000);
  const day = t.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short", timeZone: "Africa/Lagos" });
  const hm = t.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" });
  return `${day} ${hm}`;
}

async function publish(title, body, sell) {
  if (DRY) {
    console.log("DRY", title, body.replaceAll("\n", " | "));
    return;
  }
  const r = await fetch(`https://ntfy.sh/${TOPIC}`, {
    method: "POST",
    headers: {
      Title: title,
      Priority: "5",
      Tags: "rotating_light",
      Click: "https://cathep.github.io/catrade/",
    },
    body,
  });
  if (!r.ok) throw new Error(`ntfy ${r.status}`);
  await sleep(350);
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
  if (!(progress >= 0 && progress <= 0.3)) return null;
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

function trendPlan(r, bars) {
  const simple = maxwellPlan(r);
  const p = r.pattern;
  if (!simple || !p || !bars || bars.length < 40) return null;
  const trend = youngTrend(bars, p.dir);
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
  const base = { ref: simple.ref, sl: simple.sl, dist: simple.dist, tp: trend.objective, reward, progress };
  if (near) return { ...base, kind: "PALIER", step: passed + 1 };
  if (progress <= 0.3) return { ...base, kind: "TENDANCE", step: 1 };
  return null;
}

const markets = MARKETS;
const cache = new Map();
const ws = await openDeriv();
const now = Date.now() / 1000;
let sent = 0;

try {
  for (const style of styles) {
    if (!wanted && style.id === "swing") continue;
    for (const mk of markets) {
      let bars = cache.get(`${mk.id}:${style.step}`);
      if (!bars) {
        try {
          bars = await ask(ws, mk.id, style.step);
        } catch (e) {
          console.error("skip", mk.id, style.id, e.message);
          continue;
        }
        cache.set(`${mk.id}:${style.step}`, bars);
        await sleep(700);
      }
      const r = evaluate(mk, bars, now, style, true);
      const trend = style.id === "scalping" ? null : trendPlan(r, bars);
      const simple = style.id === "swing" ? null : maxwellPlan(r);
      const plan = trend || (simple ? { kind: "W", ref: simple.ref, sl: simple.sl, dist: simple.dist, tp: simple.neck, reward: Math.abs(simple.neck - simple.ref), step: 0 } : null);
      if (!plan || !r.pattern) continue;
      const id = `${plan.kind}:${mk.id}:${style.id}:${r.pattern.key}`;
      if (seen.has(id)) continue;
      const sell = r.dir < 0;
      const sens = sell ? "SELL" : "BUY";
      const pct = pctText(r);
      const title = `${sens} ${plan.kind} ${pct} ${mk.name}`;
      const lines = [sens, plan.kind, pct, `${style.label} ${style.tf}`, `Entrée ${fmt(plan.ref, mk.dp)}`, `SL ${fmt(plan.sl, mk.dp)} (${distText(mk, plan.dist)})`, `TP ${fmt(plan.tp, mk.dp)} (${distText(mk, plan.reward)})`];
      if (plan.kind === "W") lines.push("Sortir au cou. Pas d'objectif plus loin.");
      else if (plan.kind === "PALIER") lines.push(`Palier ${plan.step}. Lot inférieur ou égal au précédent.`, "Garder jusqu'à l'objectif. Fermer si le prix se retourne avant.");
      else lines.push("Une seule entrée sur cette tendance.", "Garder jusqu'à l'objectif.");
      lines.push(`Fermer au plus tard ${deadline(now, style)}.`);
      const body = lines.join("\n");
      await publish(title, body, sell);
      seen.add(id);
      sent++;
    }
  }
} finally {
  ws.close();
  if (!DRY) fs.writeFileSync(seenPath, JSON.stringify([...seen], null, 2));
}

console.log(`${styles.map((s) => s.id).join(",")} : envoyées ${sent}, mémoire ${seen.size}`);
