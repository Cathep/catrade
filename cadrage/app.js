const LEAGUES = {
  football: [
    ["fra.1", "Ligue 1"],
    ["eng.1", "Premier League"],
    ["esp.1", "LaLiga"],
    ["ita.1", "Serie A"],
    ["ger.1", "Bundesliga"],
    ["uefa.champions", "Ligue des champions"],
    ["uefa.europa", "Ligue Europa"],
    ["ned.1", "Eredivisie"],
    ["por.1", "Liga Portugal"],
    ["bel.1", "Pro League"],
    ["tur.1", "Süper Lig"],
    ["usa.1", "MLS"],
  ],
  basketball: [
    ["nba", "NBA"],
    ["euroleague", "Euroleague"],
    ["acb", "ACB"],
    ["nbl", "NBL"],
    ["wnba", "WNBA"],
    ["mens-college-basketball", "NCAA"],
  ],
};

const state = {
  sport: "football",
  date: parisToday(),
  league: "all",
  query: "",
  fixtures: [],
  selected: null,
};

const listEl = document.querySelector("#list");
const detailEl = document.querySelector("#detail");
const chipsEl = document.querySelector("#chips");
const dayEl = document.querySelector("#day-label");

document.querySelectorAll("[data-sport]").forEach((button) => {
  button.addEventListener("click", () => {
    state.sport = button.dataset.sport;
    state.league = "all";
    state.selected = null;
    document.querySelectorAll("[data-sport]").forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    renderChips();
    load();
  });
});
document.querySelector("#prev").addEventListener("click", () => shift(-1));
document.querySelector("#next").addEventListener("click", () => shift(1));
document.querySelector("#q").addEventListener("input", (event) => {
  state.query = event.target.value.trim().toLowerCase();
  renderList();
});

function parisToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shift(dir) {
  const base = new Date(`${state.date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dir);
  state.date = base.toISOString().slice(0, 10);
  state.selected = null;
  load();
}

function renderChips() {
  const items = [["all", "Toutes"], ...LEAGUES[state.sport]];
  chipsEl.innerHTML = items
    .map(
      ([slug, name]) =>
        `<button type="button" data-league="${slug}" aria-pressed="${state.league === slug}">${name}</button>`,
    )
    .join("");
  chipsEl.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.league = button.dataset.league;
      renderChips();
      renderList();
    });
  });
}

function sportPath(sport) {
  return sport === "football" ? "soccer" : "basketball";
}

async function load() {
  dayEl.textContent = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  }).format(new Date(`${state.date}T12:00:00Z`));
  listEl.innerHTML = `<p class="empty">Chargement des matchs…</p>`;
  detailEl.innerHTML = `<p class="quiet">Ouvre un match. La cote et l'option retenue s'affichent ici.</p>`;
  const ymd = state.date.replaceAll("-", "");
  const boards = await Promise.all(
    LEAGUES[state.sport].map(async ([slug, name]) => {
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/${sportPath(state.sport)}/${slug}/scoreboard?dates=${ymd}`,
        );
        if (!res.ok) return [];
        return parseBoard(await res.json(), state.sport, slug, name);
      } catch {
        return [];
      }
    }),
  );
  state.fixtures = boards.flat().sort((a, b) => a.start.localeCompare(b.start));
  document.querySelector(`#n-${state.sport}`).textContent = state.fixtures.length ? String(state.fixtures.length) : "";
  renderList();
  fillOdds(state.fixtures);
}

function parseBoard(payload, sport, slug, name) {
  const events = Array.isArray(payload?.events) ? payload.events : [];
  return events.flatMap((event) => {
    const comp = event.competitions?.[0];
    if (!comp) return [];
    const home = side(comp.competitors?.find((item) => item.homeAway === "home"));
    const away = side(comp.competitors?.find((item) => item.homeAway === "away"));
    if (!home || !away) return [];
    const type = comp.status?.type || {};
    const status = type.state === "in" || type.state === "post" ? type.state : "pre";
    return [
      {
        id: String(event.id),
        sport,
        league: name,
        slug,
        start: event.date,
        status,
        statusText: status === "post" ? "Terminé" : status === "in" ? type.shortDetail || "Direct" : "",
        home,
        away,
        odds: oddsOf(comp.odds),
        oddsChecked: Boolean(oddsOf(comp.odds)),
      },
    ];
  });
}

function side(row) {
  if (!row?.team) return null;
  const team = row.team;
  return {
    name: team.displayName || team.name,
    short: team.shortDisplayName || team.displayName || team.name,
    score: row.score ?? "",
    form: typeof row.form === "string" ? row.form : "",
  };
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function dig(row, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? null : acc[key]), row);
}

function mlOf(node) {
  if (typeof node === "number") return node;
  if (!node || typeof node !== "object") return null;
  return num(node.close?.odds ?? node.odds ?? node.moneyLine);
}

function oddsOf(raw) {
  const row = Array.isArray(raw) ? raw.find(Boolean) : raw;
  if (!row) return null;
  const homeMl = mlOf(dig(row, "moneyline.home")) ?? num(dig(row, "homeTeamOdds.moneyLine"));
  const awayMl = mlOf(dig(row, "moneyline.away")) ?? num(dig(row, "awayTeamOdds.moneyLine"));
  const drawMl = mlOf(dig(row, "moneyline.draw")) ?? num(dig(row, "drawOdds.moneyLine"));
  const total = num(row.overUnder);
  const spread = num(row.spread);
  const overOdds = num(row.overOdds ?? dig(row, "total.over.close.odds"));
  const underOdds = num(row.underOdds ?? dig(row, "total.under.close.odds"));
  const homeSpreadOdds = num(dig(row, "homeTeamOdds.spreadOdds") ?? dig(row, "pointSpread.home.close.odds"));
  const awaySpreadOdds = num(dig(row, "awayTeamOdds.spreadOdds") ?? dig(row, "pointSpread.away.close.odds"));
  if (homeMl == null && awayMl == null && total == null) return null;
  return { homeMl, awayMl, drawMl, total, spread, overOdds, underOdds, homeSpreadOdds, awaySpreadOdds };
}

async function fillOdds(fixtures) {
  const pending = fixtures.filter((fixture) => !fixture.odds);
  let cursor = 0;
  async function worker() {
    while (cursor < pending.length) {
      const fixture = pending[cursor++];
      if (state.fixtures !== fixtures) return;
      fixture.odds = await summaryOdds(fixture);
      fixture.oddsChecked = true;
      if (state.fixtures !== fixtures) return;
      renderList();
      if (state.selected === fixture.id) renderDetail();
    }
  }
  await Promise.all(Array.from({ length: 4 }, worker));
}

async function summaryOdds(fixture) {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${sportPath(fixture.sport)}/${fixture.slug}/summary?event=${fixture.id}`,
    );
    if (!res.ok) return null;
    const payload = await res.json();
    return oddsOf(payload.pickcenter) || oddsOf(payload.odds);
  } catch {
    return null;
  }
}

function american(ml) {
  if (ml > 0) return 100 / (ml + 100);
  if (ml < 0) return -ml / (-ml + 100);
  return 0;
}

function split(a, b) {
  if (a == null || b == null) return null;
  const left = american(a);
  const right = american(b);
  const sum = left + right;
  if (sum <= 0) return null;
  const home = Math.round((left / sum) * 100);
  return { left: home, right: 100 - home };
}

function market(fixture) {
  const odds = fixture.odds;
  if (!odds || odds.homeMl == null || odds.awayMl == null) return null;
  const homeRaw = american(odds.homeMl);
  const awayRaw = american(odds.awayMl);
  const drawRaw = fixture.sport === "football" && odds.drawMl != null ? american(odds.drawMl) : 0;
  const sum = homeRaw + awayRaw + drawRaw || 1;
  const home = Math.round((homeRaw / sum) * 100);
  const away = fixture.sport === "basketball" || odds.drawMl == null ? 100 - home : Math.round((awayRaw / sum) * 100);
  const draw = fixture.sport === "football" && odds.drawMl != null ? Math.max(0, 100 - home - away) : null;
  return { home, draw, away };
}

function decimal(ml) {
  if (ml == null) return "";
  const value = ml > 0 ? ml / 100 + 1 : 100 / Math.abs(ml) + 1;
  return value.toFixed(2);
}

function reads(fixture, probs) {
  if (!probs) return [];
  const out = [
    { label: fixture.sport === "football" ? "1X2" : "Vainqueur", pick: fixture.home.short, p: probs.home, price: decimal(fixture.odds.homeMl) },
    { label: fixture.sport === "football" ? "1X2" : "Vainqueur", pick: fixture.away.short, p: probs.away, price: decimal(fixture.odds.awayMl) },
  ];
  if (probs.draw != null) {
    out.splice(1, 0, { label: "1X2", pick: "Nul", p: probs.draw, price: decimal(fixture.odds.drawMl) });
    out.push(
      { label: "Double chance", pick: `${fixture.home.short} ou nul`, p: Math.min(99, probs.home + probs.draw) },
      { label: "Double chance", pick: `Nul ou ${fixture.away.short}`, p: Math.min(99, probs.draw + probs.away) },
      { label: "Double chance", pick: "Les deux équipes", p: Math.min(99, probs.home + probs.away) },
    );
  }
  const cover = split(fixture.odds.homeSpreadOdds, fixture.odds.awaySpreadOdds);
  if (cover && fixture.odds.spread != null) {
    const line = fixture.odds.spread;
    const awayLine = line === 0 ? 0 : -line;
    out.push(
      { label: "Handicap", pick: `${fixture.home.short} ${line > 0 ? "+" : ""}${line}`, p: cover.left },
      { label: "Handicap", pick: `${fixture.away.short} ${awayLine > 0 ? "+" : ""}${awayLine}`, p: cover.right },
    );
  }
  const total = split(fixture.odds.overOdds, fixture.odds.underOdds);
  if (total && fixture.odds.total != null) {
    out.push(
      { label: "Total", pick: `Plus de ${fixture.odds.total}`, p: total.left, price: decimal(fixture.odds.overOdds) },
      { label: "Total", pick: `Moins de ${fixture.odds.total}`, p: total.right, price: decimal(fixture.odds.underOdds) },
    );
  }
  return out;
}

function bestOf(items) {
  const band = items.filter((item) => item.p >= 58 && item.p <= 76);
  const pool = (band.length ? band : items.filter((item) => item.p < 88)).filter((item) => item.label !== "Double chance" || item.p <= 76);
  return [...pool].sort((a, b) => Math.abs(a.p - 66) - Math.abs(b.p - 66))[0] || null;
}

function when(fixture) {
  if (fixture.status !== "pre") return fixture.statusText;
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(
    new Date(fixture.start),
  );
}

function formText(form) {
  return (form || "")
    .replace(/[^WDL]/gi, "")
    .slice(-5)
    .split("")
    .map((c) => (c === "W" ? "V" : c === "L" ? "D" : "N"))
    .join("");
}

function visible() {
  return state.fixtures.filter((fixture) => {
    if (state.league !== "all" && fixture.slug !== state.league) return false;
    if (!state.query) return true;
    return `${fixture.home.name} ${fixture.away.name}`.toLowerCase().includes(state.query);
  });
}

function quote(fixture) {
  const probs = market(fixture);
  if (probs) {
    return `${probs.home}%${probs.draw != null ? ` · ${probs.draw}%` : ""} · ${probs.away}%`;
  }
  return fixture.oddsChecked ? "Cote absente" : "Cote…";
}

function renderList() {
  const rows = visible();
  if (!rows.length) {
    listEl.innerHTML = `<p class="empty">Aucun match ce jour-là. Essaie la veille ou le lendemain.</p>`;
    return;
  }
  const groups = new Map();
  for (const fixture of rows) {
    if (!groups.has(fixture.league)) groups.set(fixture.league, []);
    groups.get(fixture.league).push(fixture);
  }
  listEl.innerHTML = [...groups.entries()]
    .map(([league, fixtures]) => {
      const cards = fixtures
        .map(
          (fixture) => `<button type="button" class="match${state.selected === fixture.id ? " on" : ""}" data-id="${fixture.id}">
            <div class="row"><span class="faint">${when(fixture)}</span><span class="faint">${quote(fixture)}</span></div>
            <div class="teams">
              <div class="team"><span>${fixture.home.name}</span><span class="form">${formText(fixture.home.form)} ${fixture.home.score}</span></div>
              <div class="team"><span>${fixture.away.name}</span><span class="form">${formText(fixture.away.form)} ${fixture.away.score}</span></div>
            </div>
          </button>`,
        )
        .join("");
      return `<h2 class="league">${league} · ${fixtures.length}</h2>${cards}`;
    })
    .join("");
  listEl.querySelectorAll(".match").forEach((button) => {
    button.addEventListener("click", () => {
      state.selected = button.dataset.id;
      renderList();
      renderDetail();
    });
  });
}

function renderDetail() {
  const fixture = state.fixtures.find((item) => item.id === state.selected);
  if (!fixture) return;
  const probs = market(fixture);
  if (!probs && !fixture.oddsChecked) {
    detailEl.innerHTML = `<p class="faint">${fixture.league}</p><h2>${fixture.home.name} – ${fixture.away.name}</h2><p class="quiet">Lecture des cotes…</p>`;
    return;
  }
  const items = reads(fixture, probs);
  const best = bestOf(items);
  const bar = probs
    ? `<div class="barline" aria-hidden="true"><span style="width:${probs.home}%"></span>${probs.draw != null ? `<span style="width:${probs.draw}%"></span>` : ""}<span style="width:${probs.away}%"></span></div>
       <div class="probs"><p><span class="faint">${fixture.home.short}</span><br>${probs.home}%</p><p>${probs.draw != null ? `<span class="faint">Nul</span><br>${probs.draw}%` : ""}</p><p><span class="faint">${fixture.away.short}</span><br>${probs.away}%</p></div>`
    : `<p class="quiet">Le marché n'a pas publié de cote pour ce match.</p>`;
  const cards = items
    .map((item) => {
      const top = item === best;
      return `<article class="card${top ? " best" : ""}">
        <div class="lab"><span>${top ? "Meilleure option · " : ""}${item.label}</span><span>${item.p}%${item.price ? ` · ${item.price}` : ""}</span></div>
        <p class="pick">${item.pick}</p>
      </article>`;
    })
    .join("");
  detailEl.innerHTML = `<p class="faint">${fixture.league} · ${when(fixture)}</p><h2>${fixture.home.name} – ${fixture.away.name}</h2>${bar}<div class="grid">${cards}</div>`;
  if (window.innerWidth < 920) detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

renderChips();
load();
