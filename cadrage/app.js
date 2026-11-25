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
  date: parisDate(0),
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

function parisDate(offset) {
  const now = new Date(Date.now() + offset * 86400000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
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

function pathSport(sport) {
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
  detailEl.hidden = true;
  const ymd = state.date.replaceAll("-", "");
  const boards = await Promise.all(
    LEAGUES[state.sport].map(async ([slug, name]) => {
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/${pathSport(state.sport)}/${slug}/scoreboard?dates=${ymd}`,
        );
        if (!res.ok) return [];
        const payload = await res.json();
        return parseBoard(payload, state.sport, slug, name);
      } catch {
        return [];
      }
    }),
  );
  state.fixtures = boards.flat().sort((a, b) => a.start.localeCompare(b.start));
  renderList();
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
    score: row.score ?? null,
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

function oddsOf(raw) {
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row) return null;
  const homeMl = num(dig(row, "moneyline.home.close.odds") ?? dig(row, "moneyline.home.odds"));
  const awayMl = num(dig(row, "moneyline.away.close.odds") ?? dig(row, "moneyline.away.odds"));
  const drawMl = num(
    dig(row, "moneyline.draw.close.odds") ?? row.drawOdds?.moneyLine ?? dig(row, "moneyline.draw.odds"),
  );
  const total = typeof row.overUnder === "number" ? row.overUnder : null;
  const spread = dig(row, "pointSpread.home.close.line") || dig(row, "pointSpread.home.line") || null;
  if (homeMl == null && awayMl == null && total == null) return null;
  return { homeMl, awayMl, drawMl, total, spread: spread ? String(spread) : null };
}

function implied(ml) {
  if (ml > 0) return 100 / (ml + 100);
  if (ml < 0) return -ml / (-ml + 100);
  return 0;
}

function market(fixture) {
  const odds = fixture.odds;
  if (!odds || odds.homeMl == null || odds.awayMl == null) return null;
  const homeRaw = implied(odds.homeMl);
  const awayRaw = implied(odds.awayMl);
  const drawRaw = fixture.sport === "football" && odds.drawMl != null ? implied(odds.drawMl) : 0;
  const sum = homeRaw + awayRaw + drawRaw || 1;
  const home = Math.round((homeRaw / sum) * 100);
  const away = fixture.sport === "basketball" || odds.drawMl == null ? 100 - home : Math.round((awayRaw / sum) * 100);
  const draw = fixture.sport === "football" && odds.drawMl != null ? Math.max(0, 100 - home - away) : null;
  return { home, draw, away };
}

function reads(fixture, probs) {
  if (!probs) return [];
  const out = [
    { label: fixture.sport === "football" ? "1X2" : "Vainqueur", pick: fixture.home.short, p: probs.home },
    { label: fixture.sport === "football" ? "1X2" : "Vainqueur", pick: fixture.away.short, p: probs.away },
  ];
  if (probs.draw != null) {
    out.splice(1, 0, { label: "1X2", pick: "Nul", p: probs.draw });
    out.push(
      { label: "Double chance", pick: `${fixture.home.short} ou nul`, p: Math.min(99, probs.home + probs.draw) },
      { label: "Double chance", pick: `Nul ou ${fixture.away.short}`, p: Math.min(99, probs.draw + probs.away) },
      { label: "Double chance", pick: "12", p: Math.min(99, probs.home + probs.away) },
    );
  }
  if (fixture.odds?.spread) {
    out.push({
      label: "Handicap",
      pick: `${fixture.home.short} ${fixture.odds.spread}`,
      p: null,
    });
  }
  if (fixture.odds?.total != null) {
    out.push({
      label: "Total",
      pick: `Ligne ${fixture.odds.total}`,
      p: null,
    });
  }
  return out;
}

function bestOf(items) {
  const priced = items.filter((item) => item.p != null);
  const band = priced.filter((item) => item.p >= 58 && item.p <= 76);
  const pool = band.length ? band : priced.filter((item) => item.p < 90);
  return [...pool].sort((a, b) => Math.abs(a.p - 66) - Math.abs(b.p - 66))[0] || null;
}

function when(fixture) {
  if (fixture.status !== "pre") return fixture.statusText;
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(fixture.start));
}

function formText(form) {
  return (form || "")
    .replace(/[^WDL]/gi, "")
    .slice(-5)
    .split("")
    .map((c) => (c === "W" ? "V" : c === "L" ? "D" : "N"))
    .join(" ");
}

function visible() {
  return state.fixtures.filter((fixture) => {
    if (state.league !== "all" && fixture.slug !== state.league) return false;
    if (!state.query) return true;
    return `${fixture.home.name} ${fixture.away.name}`.toLowerCase().includes(state.query);
  });
}

function renderList() {
  const rows = visible();
  if (!rows.length) {
    listEl.innerHTML = `<p class="empty">Aucun match pour ce jour.</p>`;
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
        .map((fixture) => {
          const probs = market(fixture);
          const pct = probs ? `${probs.home}% · ${probs.draw != null ? `${probs.draw}% · ` : ""}${probs.away}%` : "Cote absente";
          return `<button type="button" class="match${state.selected === fixture.id ? " on" : ""}" data-id="${fixture.id}">
            <div class="row"><span class="faint">${when(fixture)}</span><span class="faint">${pct}</span></div>
            <div class="teams">
              <div class="team"><span>${fixture.home.name}</span><span class="form">${formText(fixture.home.form)} ${fixture.home.score ?? ""}</span></div>
              <div class="team"><span>${fixture.away.name}</span><span class="form">${formText(fixture.away.form)} ${fixture.away.score ?? ""}</span></div>
            </div>
          </button>`;
        })
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
  if (!fixture) {
    detailEl.hidden = true;
    return;
  }
  const probs = market(fixture);
  const items = reads(fixture, probs);
  const best = bestOf(items);
  const bars = probs
    ? `<p class="muted">${fixture.home.short} ${probs.home}%${probs.draw != null ? ` · Nul ${probs.draw}%` : ""} · ${fixture.away.short} ${probs.away}%</p>`
    : `<p class="muted">Pas de cote dans le dossier.</p>`;
  const cards = items
    .map(
      (item) => `<article class="card${best && item.label === best.label && item.pick === best.pick ? " best" : ""}">
        <div class="lab"><span>${item === best ? "Meilleure option · " : ""}${item.label}</span><span>${item.p == null ? "ligne" : `${item.p}%`}</span></div>
        <p class="pick">${item.pick}</p>
      </article>`,
    )
    .join("");
  detailEl.hidden = false;
  detailEl.innerHTML = `<p class="faint">${fixture.league} · ${when(fixture)}</p>
    <h2>${fixture.home.name} – ${fixture.away.name}</h2>
    ${bars}
    <div class="grid">${cards || `<p class="empty">Grille indisponible sans cote.</p>`}</div>`;
  if (window.innerWidth < 900) detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

renderChips();
load();
