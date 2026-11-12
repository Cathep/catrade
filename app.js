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
let manual = store.get("ct.manual", true);
let reports = [];
let busy = false;
let scannedAt = 0;
let choices = store.get("ct.choices", {});
let simAmt = store.get("ct.simAmt", 10);
let simMode = store.get("ct.simMode", "risk");
let gen = 0;

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
      ticks_history: symbol, adjust_start_time: 1, count: 400, end: "latest", start: 1, style: "candles", granularity,
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
  const hi = Math.max(...bars.map((b) => b.h), r.pattern ? r.pattern.neck : -Infinity);
  const lo = Math.min(...bars.map((b) => b.l), r.pattern ? Math.min(r.pattern.ext1, r.pattern.ext2) : Infinity);
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
    guides = `<line x1="0" x2="${W}" y1="${neck}" y2="${neck}" stroke="var(--color-focus)" stroke-dasharray="4 3" stroke-width="1"/><line x1="0" x2="${W}" y1="${y(extP)}" y2="${y(extP)}" stroke="var(--color-warn)" stroke-dasharray="2 3" stroke-width="1"/>`;
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
  const kind = !r.pattern ? "W/M non détecté" : r.pattern.slow && r.pattern.secondPart && r.pattern.reintegrated && !r.pattern.tooFar ? `${r.pattern.side} à juger` : `${r.pattern.side} possible`;
  const kindOk = r.pattern && r.pattern.reintegrated && r.pattern.secondPart && !r.pattern.slHit;
  const quote = mk.id.startsWith("USD") ? null : quoteOf(mk.id.slice(3));
  const loss = r.levels ? lotLoss(mk, r.price ?? r.levels.entry, r.levels.dist, quote) : null;
  const levels = r.levels ? `<dl class="lv">
      <div><dt>${r.levels.entryKind === "cou" ? "Entrée au cou" : "Entrée"}</dt><dd>${fmt(r.levels.entry, mk.dp)}</dd></div>
      <div><dt>Stop</dt><dd class="sl">${fmt(r.levels.sl, mk.dp)}</dd><span>${esc(distText(mk, r.levels.dist))}</span></div>
      <div><dt>Objectif</dt><dd class="tp">${fmt(r.levels.tp, mk.dp)}</dd><span>${esc(distText(mk, r.levels.reward))} · ${num(r.levels.rr, 2)} R</span></div>
    </dl>` + (r.pattern ? `<dl class="meta">
      <div><dt>Cou</dt><dd>${fmt(r.pattern.neck, mk.dp)}</dd><span>trait bleu</span></div>
      <div><dt>${r.pattern.side === "W" ? "2e creux" : "2e sommet"}</dt><dd>${fmt(r.pattern.ext2, mk.dp)}</dd><span>trait ambre${loss != null ? ` · ${num(loss, 2)} $ / 0,01 lot` : ""}</span></div>
    </dl>` : "") : `<p class="taken">Pas de niveaux proposés : la géométrie du motif manque, ou elle est déjà invalidée.</p>`;
  const notes = r.notes.slice(0, 3).map((n) => `<li>${esc(n)}</li>`).join("");
  const past = r.record.n
    ? `${r.record.n} passages sur ~${r.days} j. Résultat moyen ${r.record.avg >= 0 ? "+" : "−"}${num(Math.abs(r.record.avg), 2)} R.`
    : "Trop peu de géométries passées pour un bilan.";
  const sim = r.levels ? `<details class="sim" data-id="${esc(r.id)}"><summary>Simuler un gain</summary>
      <div class="sim-f">
        <label>Montant en $<input type="number" inputmode="decimal" min="0" step="any" value="${simAmt}" data-sim="amt"></label>
        <label>Ce montant est…<select data-sim="mode">
          <option value="risk"${simMode === "risk" ? " selected" : ""}>Ce que je perds au stop</option>
          <option value="cash"${simMode === "cash" ? " selected" : ""}>Ma mise, sans levier</option>
          <option value="lev"${simMode === "lev" ? " selected" : ""}>Ma mise, avec levier</option>
        </select></label>
      </div>
      <dl class="sim-r" data-sim="out"></dl>
      <p class="sim-n" data-sim="note"></p>
    </details>` : "";
  const actions = ch && ch.c === "pris"
    ? `<p class="taken">Vous avez pris ce cas. Placez-le vous-même, avec ces niveaux, si la figure vous convient.</p><div class="choice"><button class="btn" type="button" data-undo="${esc(r.id)}">Annuler mon choix</button></div>`
    : ch && ch.c === "passe"
      ? `<p class="taken">Vous avez passé ce cas.</p><div class="choice"><button class="btn" type="button" data-undo="${esc(r.id)}">Revoir</button></div>`
      : `<div class="choice"><button class="btn go" type="button" data-take="${esc(r.id)}">Je prends</button><button class="btn" type="button" data-skip="${esc(r.id)}">Je passe</button></div>`;
  return `<article class="card glass rise" data-dir="${r.dir}" data-choice="${ch ? ch.c : ""}" style="--i:${i}">
    <div class="head"><div><p class="name">${esc(mk.name)}${mk.aka ? `<span class="buf">${esc(mk.aka)}</span>` : ""}<span class="buf">${esc(r.tf)}</span></p><div class="px">${r.price != null ? fmt(r.price, mk.dp) : "—"}</div></div>
      <div class="ring" style="--p:${r.record.n ? Math.round(w) : 0};--ringc:${ringc}" role="img" aria-label="${r.record.n ? Math.round(w) + " % de cas gagnants" : "Peu de cas"}"><b>${r.record.n ? Math.round(w) + " %" : "—"}<small>${r.record.n ? "gagnants" : "peu de cas"}</small></b></div>
    </div>
    <div><span class="call">${sell ? "Vendre" : "Acheter"}</span><span class="${kindOk ? "kind ok" : "kind"}">${esc(kind)}</span><span class="buf">buffer ${r.buffer > 0 ? "+" + r.buffer : r.buffer}</span><span class="subcall">${r.manual ? "Sens à examiner, pas une entrée automatique." : "Mode historique : le motif filtre le sens."}</span></div>
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
  if (!r || !r.levels) return;
  const mk = MARKETS.find((m) => m.id === id);
  const amt = Math.max(0, parseFloat(box.querySelector("[data-sim=amt]").value) || 0);
  const mode = box.querySelector("[data-sim=mode]").value;
  const pl = r.levels;
  let lossV, gain, note;
  if (mode === "risk") {
    lossV = amt; gain = amt * (pl.reward / pl.dist);
    note = `La taille est calculée pour perdre ${num(amt, 2)} $ au stop.`;
  } else {
    const lev = mode === "lev" ? (mk.cls === "fx" ? 30 : mk.cls === "gold" ? 20 : 1) : 1;
    const units = (amt * lev) / pl.entry;
    lossV = units * pl.dist; gain = units * pl.reward;
    note = mode === "lev" ? `Levier indicatif ${mk.cls === "fx" ? "×30" : mk.cls === "gold" ? "×20" : "aucun : c'est un indice"}.` : `${units.toLocaleString("fr-FR", { maximumSignificantDigits: 3 })} unités.`;
  }
  const avg = r.record.n ? r.record.avg * lossV : 0;
  const sg = (x) => `${x >= 0 ? "+" : "−"}${num(Math.abs(x), 2)} $`;
  box.querySelector("[data-sim=out]").innerHTML = `<div><dt>Objectif atteint</dt><dd class="g">${sg(gain)}</dd></div><div><dt>Stop touché</dt><dd class="l">${sg(-lossV)}</dd></div><div><dt>En moyenne</dt><dd>${r.record.n ? sg(avg) : "—"}</dd></div>`;
  box.querySelector("[data-sim=note]").textContent = `${note} « En moyenne » rejoue ces règles sur le passé, frais compris. Ce n'est pas une promesse.`;
}

function render(fresh) {
  const avis = reports.filter((r) => r.state === "avis").sort((a, b) => Number(!!b.pattern) - Number(!!a.pattern) || winPct(b) - winPct(a));
  const rest = reports.filter((r) => r.state !== "avis");
  const grid = $("#grid");
  grid.className = fresh ? "grid fresh" : "grid";
  grid.innerHTML = avis.length ? avis.map(card).join("") : `<div class="glass empty">${!reports.length || busy ? "Lecture en cours." : manual ? "Aucun marché ne passe les filtres encore actifs." : "Aucun motif ne passe les anciens critères."}</div>`;
  $("#others").innerHTML = rest.length ? rest.map((r) => {
    const mk = MARKETS.find((m) => m.id === r.id);
    return `<li><b>${esc(mk.name)}</b><b>${r.price != null ? fmt(r.price, mk.dp) : "?"}</b><span>${esc(r.reason)}</span></li>`;
  }).join("") : `<li><span>${reports.length ? "Tous les marchés lus ont un sens à examiner." : "Pas encore de lecture."}</span></li>`;
  const withPattern = avis.filter((r) => r.pattern).length;
  $("#headline").textContent = !reports.length ? "Lecture des marchés…" : reports.every((r) => r.state === "erreur") ? "Prix illisibles." : avis.length ? `${avis.length} marché${avis.length > 1 ? "s" : ""} à examiner.` : "Rien à proposer pour l'instant.";
  $("#sub").textContent = !reports.length ? "Les fiches arrivent dès que les prix sont lus." : reports.every((r) => r.state === "erreur") ? "La source des prix ne répond pas. Réessayez." : manual ? `${withPattern ? withPattern + " W ou M détecté" + (withPattern > 1 ? "s" : "") + ". " : "Aucun W/M détecté. "}Le sens vient des autres filtres. La figure, c'est à vous de la juger. Aucun ordre n'est envoyé.` : "Mode historique : sans W/M lent, confirmé et réintégré, le sens reste refusé.";
  document.querySelectorAll(".sim[open]").forEach(simulate);
}

function paintChrome() {
  $("#styles").innerHTML = STYLES.map((s) => `<button type="button" aria-pressed="${styleId === s.id}" data-style="${s.id}">${esc(s.label)}<span class="buf">${esc(s.tf)}</span></button>`).join("");
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
  $("#status").textContent = `Lecture des prix : 0 sur ${MARKETS.length}`;
  const out = [];
  for (let i = 0; i < MARKETS.length; i++) {
    if (token !== gen) return;
    const mk = MARKETS[i];
    try { out[i] = evaluate(mk, await fetchOHLC(mk.id, spec.step), Date.now() / 1000, spec, manual); }
    catch (e) { out[i] = evaluate(mk, null, Date.now() / 1000, spec, manual); }
    reports = out.filter(Boolean);
    scannedAt = Date.now();
    $("#status").textContent = `Lecture des prix : ${i + 1} sur ${MARKETS.length}`;
    render(i === 0);
  }
  if (token !== gen) return;
  busy = false;
  btn.disabled = false;
  btn.textContent = "Actualiser";
  const failed = reports.filter((r) => r.state === "erreur").length;
  $("#status").textContent = failed === MARKETS.length ? "Aucun prix reçu. Deriv ne répond pas." : `Prix Deriv à ${hm(scannedAt)}, en ${spec.tf}. Ce ne sont pas les FX Vol Weltrade.`;
  render(true);
  notify();
}

function notify() {
  if (!store.get("ct.notif", false) || !("Notification" in window) || Notification.permission !== "granted") return;
  const seen = store.get("ct.seen", {});
  for (const r of reports) {
    if (!r.pattern) continue;
    const key = `${r.id}:${r.pattern.key}`;
    if (seen[key]) continue;
    seen[key] = 1;
    const mk = MARKETS.find((m) => m.id === r.id);
    try { new Notification(`CATRADE : ${r.pattern.side} sur ${mk.sym}`, { body: r.reason, tag: key }); } catch (e) {}
  }
  store.set("ct.seen", seen);
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
  else if (b.dataset.style) { styleId = b.dataset.style; store.set("ct.style", styleId); paintChrome(); scan(); }
  else if (b.id === "manual") { manual = !manual; store.set("ct.manual", manual); paintChrome(); scan(); }
  else if (b.dataset.take) choose(b.dataset.take, "pris");
  else if (b.dataset.skip) choose(b.dataset.skip, "passe");
  else if (b.dataset.undo) choose(b.dataset.undo, null);
  else if (b.id === "notif") {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then((perm) => {
      const ok = perm === "granted";
      store.set("ct.notif", ok);
      b.textContent = ok ? "Alertes actives" : "Activer les alertes";
      b.className = ok ? "btn on" : "btn";
      if (ok) notify();
    });
  }
});
document.addEventListener("input", (e) => {
  const box = e.target.closest(".sim");
  if (!box) return;
  if (e.target.dataset.sim === "amt") { simAmt = parseFloat(e.target.value) || 0; store.set("ct.simAmt", simAmt); }
  if (e.target.dataset.sim === "mode") { simMode = e.target.value; store.set("ct.simMode", simMode); }
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
setInterval(() => { if (!busy) scan(); }, 15 * 60 * 1000);
