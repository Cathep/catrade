import fs from "fs";
import vm from "vm";

const TOPIC = process.env.NTFY_TOPIC || "catrade-a8e3f19c4d";
const DRY = process.env.DRY === "1";
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL("./engine.js", import.meta.url), "utf8"), ctx);
const { MARKETS, STYLES, evaluate, distText, coursePlan, gestionAt } = ctx.CT;

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
          ticks_history: symbol, adjust_start_time: 1, count: 240, end: "latest", start: 1, style: "candles", granularity,
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

const markets = MARKETS;
const cache = new Map();
const ws = await openDeriv();
const now = Date.now() / 1000;
let sent = 0;

try {
  for (const style of styles) {
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
      const plan = coursePlan(r, style);
      if (!plan) continue;
      const id = `${plan.kind}:${mk.id}:${style.id}:${plan.key}`;
      if (seen.has(id)) continue;
      const sell = plan.dir < 0;
      const sens = sell ? "SELL" : "BUY";
      const pct = pctText(r);
      const title = `${sens} ${plan.kind} ${pct} ${mk.name}`;
      const at = (q) => fmt(gestionAt(plan, q), mk.dp);
      const lines = [
        sens,
        plan.kind,
        pct,
        `${style.label} ${style.tf}`,
        style.stack,
        `Entrée ${fmt(plan.ref, mk.dp)}`,
        `SL ${fmt(plan.sl, mk.dp)} (${distText(mk, plan.dist)})`,
        `Sortie ${fmt(plan.tp, mk.dp)} (${distText(mk, plan.reward)})`,
        plan.note,
        `40 % (${at(0.4)}) : stop à l'entrée`,
        `60 % (${at(0.6)}) : stop en profit`,
        `80 % (${at(0.8)}) : tu peux fermer`,
        `Fermer au plus tard ${deadline(now, style)}.`,
      ];
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
