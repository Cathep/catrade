const DEMO_ID = "DOT92209210";
const BLOCKED = new Set(["ROT91048305"]);
const STAKE = 1;
const MAX = Number(process.env.DEMO_MAX || 8);

async function api(token, appId, path, method = "GET") {
  const res = await fetch(`https://api.derivws.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Deriv-App-ID": appId,
      Accept: "application/json",
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || `Deriv ${res.status}`);
  return body;
}

function closest(list, ideal) {
  return list.reduce((best, n) => (Math.abs(n - ideal) < Math.abs(best - ideal) ? n : best));
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export async function startDemo() {
  const token = process.env.DERIV_TOKEN || "";
  const appId = process.env.DERIV_APP_ID || "";
  if (!token || !appId) return null;
  const accounts = (await api(token, appId, "/trading/v1/options/accounts")).data || [];
  if (accounts.some((a) => BLOCKED.has(a.account_id) && a.account_id === DEMO_ID)) {
    throw new Error("compte bloqué");
  }
  const demo = accounts.find((a) => a.account_id === DEMO_ID && a.account_type === "demo");
  if (!demo) throw new Error("compte démo introuvable, aucun ordre");

  let ws;
  const pending = new Map();
  let req = 1;
  let opened = 0;
  const multipliers = new Map();

  function bind(socket) {
    socket.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      const wait = data.req_id && pending.get(data.req_id);
      if (!wait) return;
      pending.delete(data.req_id);
      wait(data);
    };
  }

  async function connect() {
    const otp = await api(token, appId, `/trading/v1/options/accounts/${DEMO_ID}/otp`, "POST");
    const url = otp.data?.url || "";
    if (!url.includes("/ws/demo") || url.includes("/ws/real")) throw new Error("refus du compte réel");
    ws = new WebSocket(url);
    bind(ws);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = () => reject(new Error("socket démo"));
      setTimeout(() => reject(new Error("socket démo")), 8000);
    });
  }

  function send(msg) {
    const id = req++;
    msg.req_id = id;
    return new Promise((resolve, reject) => {
      pending.set(id, resolve);
      ws.send(JSON.stringify(msg));
      setTimeout(() => {
        if (!pending.has(id)) return;
        pending.delete(id);
        reject(new Error("délai démo"));
      }, 15000);
    });
  }

  async function proposal(symbol, sell, multiplier, stopLoss, takeProfit) {
    const data = await send({
      proposal: 1,
      amount: STAKE,
      basis: "stake",
      contract_type: sell ? "MULTDOWN" : "MULTUP",
      currency: "USD",
      multiplier,
      underlying_symbol: symbol,
      limit_order: { stop_loss: stopLoss, take_profit: takeProfit },
    });
    if (data.error) {
      const err = new Error(data.error.message || "proposition refusée");
      err.code = data.error.code;
      throw err;
    }
    return data.proposal;
  }

  await connect();

  return {
    async open({ symbol, sell, dist, reward }) {
      if (opened >= MAX) return { ok: false, reason: "limite" };
      if (!(dist > 0) || !(reward > 0)) return { ok: false, reason: "niveaux" };
      try {
        let mults = multipliers.get(symbol);
        if (!mults) {
          try {
            await proposal(symbol, sell, 1, 1, 1);
            mults = [1];
          } catch (e) {
            const found = [...String(e.message).matchAll(/\d+/g)].map((m) => Number(m[0]));
            if (!found.length) throw new Error("marché sans multiplicateur");
            mults = found;
          }
          multipliers.set(symbol, mults);
        }
        const probe = await proposal(symbol, sell, mults[0], 0.5, 0.5);
        const spot = Number(probe.spot);
        const v = probe.validation_params || {};
        const slMin = Number(v.stop_loss?.min ?? 0.1);
        const slMax = Number(v.stop_loss?.max ?? 1);
        const tpMin = Number(v.take_profit?.min ?? 0.1);
        const tpMax = Number(v.take_profit?.max ?? 50);
        const mult = closest(mults, spot / dist);
        const sl = clamp((STAKE * mult * dist) / spot, slMin, slMax);
        const tp = clamp((STAKE * mult * reward) / spot, tpMin, tpMax);
        const quote = await proposal(symbol, sell, mult, Number(sl.toFixed(2)), Number(tp.toFixed(2)));
        if (process.env.DRY === "1") {
          return { ok: true, dry: true, tight: (STAKE * mult * dist) / spot > 1 };
        }
        const bought = await send({ buy: quote.id, price: Number(quote.ask_price) });
        if (bought.error) throw new Error(bought.error.message || "achat refusé");
        opened += 1;
        return {
          ok: true,
          contractId: bought.buy.contract_id,
          tight: (STAKE * mult * dist) / spot > 1.001,
        };
      } catch (e) {
        if (String(e.message).includes("délai") || String(e.message).includes("socket")) {
          try { await connect(); } catch {}
        }
        return { ok: false, reason: e.message };
      }
    },
    close() {
      try { ws.close(); } catch {}
    },
  };
}

export const demoAccountId = DEMO_ID;
