const CACHE_DURATION_MS = 60 * 1000;
const REFRESH_INTERVAL_MS = 90 * 1000;

const state = {
  matches: [],
  standings: [],
  matchesTimestamp: 0,
  standingsTimestamp: 0,
  lastSuccessfulUpdate: null,
};

const TEAM_DATA = [
  { code: "MEX", name: "Mexiko", group: "A" },
  { code: "USA", name: "Vereinigte Staaten", group: "A" },
  { code: "CAN", name: "Kanada", group: "A" },
  { code: "CRC", name: "Costa Rica", group: "A" },
  { code: "BRA", name: "Brasilien", group: "B" },
  { code: "ARG", name: "Argentinien", group: "B" },
  { code: "URU", name: "Uruguay", group: "B" },
  { code: "CHI", name: "Chile", group: "B" },
  { code: "ENG", name: "England", group: "C" },
  { code: "FRA", name: "Frankreich", group: "C" },
  { code: "GER", name: "Deutschland", group: "C" },
  { code: "ITA", name: "Italien", group: "C" },
  { code: "NED", name: "Niederlande", group: "D" },
  { code: "ESP", name: "Spanien", group: "D" },
  { code: "POR", name: "Portugal", group: "D" },
  { code: "BEL", name: "Belgien", group: "D" },
  { code: "MAR", name: "Marokko", group: "E" },
  { code: "ALG", name: "Algerien", group: "E" },
  { code: "NGA", name: "Nigeria", group: "E" },
  { code: "SEN", name: "Senegal", group: "E" },
  { code: "JPN", name: "Japan", group: "F" },
  { code: "KOR", name: "Südkorea", group: "F" },
  { code: "AUS", name: "Australien", group: "F" },
  { code: "IRN", name: "Iran", group: "F" },
  { code: "TUN", name: "Tunesien", group: "G" },
  { code: "EGY", name: "Ägypten", group: "G" },
  { code: "GHA", name: "Ghana", group: "G" },
  { code: "CMR", name: "Kamerun", group: "G" },
  { code: "COL", name: "Kolumbien", group: "H" },
  { code: "PER", name: "Peru", group: "H" },
  { code: "ECU", name: "Ecuador", group: "H" },
  { code: "PAR", name: "Paraguay", group: "H" },
  { code: "SUI", name: "Schweiz", group: "I" },
  { code: "AUT", name: "Österreich", group: "I" },
  { code: "POL", name: "Polen", group: "I" },
  { code: "CZE", name: "Tschechien", group: "I" },
  { code: "CRO", name: "Kroatien", group: "J" },
  { code: "SRB", name: "Serbien", group: "J" },
  { code: "SVN", name: "Slowenien", group: "J" },
  { code: "ROU", name: "Rumänien", group: "J" },
  { code: "KSA", name: "Saudi-Arabien", group: "K" },
  { code: "UAE", name: "VAE", group: "K" },
  { code: "JOR", name: "Jordanien", group: "K" },
  { code: "IRQ", name: "Irak", group: "K" },
  { code: "NZL", name: "Neuseeland", group: "L" },
  { code: "FIJ", name: "Fidschi", group: "L" },
  { code: "PNG", name: "Papua-Neuguinea", group: "L" },
  { code: "VAN", name: "Vanuatu", group: "L" },
];

const VENUES = [
  { city: "Seattle", name: "Lumen Field", capacity: "69.000", travel: "Vom Flughafen SEA per Light Rail und Shuttle." },
  { city: "Vancouver", name: "BC Place", capacity: "54.500", travel: "SkyTrain vom Flughafen YVR direkt in die Innenstadt." },
  { city: "Toronto", name: "BMO Field", capacity: "30.000", travel: "Mit dem GO Train leicht erreichbar." },
  { city: "Boston", name: "Gillette Stadium", capacity: "65.000", travel: "Am besten mit dem MBTA bis Foxborough." },
  { city: "Philadelphia", name: "Lincoln Financial Field", capacity: "69.000", travel: "Regionalbahn und Busse sind gut verknüpft." },
  { city: "New York", name: "MetLife Stadium", capacity: "82.500", travel: "NJ Transit und Rail-Link vom Flughafen JFK." },
  { city: "Miami", name: "Hard Rock Stadium", capacity: "65.000", travel: "Mit dem Metrorail und Shuttle-Bussen gut erreichbar." },
  { city: "Atlanta", name: "Mercedes-Benz Stadium", capacity: "71.000", travel: "MARTA und Park-and-Ride bieten gute Optionen." },
  { city: "Dallas", name: "AT&T Stadium", capacity: "80.000", travel: "Direkt an der DART-Linie und am Flughafen." },
  { city: "Houston", name: "NRG Stadium", capacity: "72.000", travel: "Vom Flughafen IAH mit Shuttle oder Taxi." },
  { city: "Kansas City", name: "Arrowhead Stadium", capacity: "76.400", travel: "Viele Park-and-Ride-Optionen rund um die Anlage." },
  { city: "Denver", name: "Empower Field at Mile High", capacity: "76.000", travel: "RTD-Busse und Züge erleichtern den Zugang." },
  { city: "Los Angeles", name: "SoFi Stadium", capacity: "70.000", travel: "Metro und Shuttle vom Flughafen LAX sind praktisch." },
  { city: "San Francisco", name: "Levi's Stadium", capacity: "68.500", travel: "Caltrain und Shuttle vom Flughafen SFO." },
  { city: "Mexico City", name: "Estadio Azteca", capacity: "87.000", travel: "Metro-Linie 1 und Taxis sind gut nutzbar." },
  { city: "Guadalajara", name: "Estadio Akron", capacity: "49.000", travel: "Vom Flughafen mit Busse oder Taxi gut erreichbar." },
];

function formatDate(isoString) {
  if (!isoString) return "–";
  return new Date(isoString).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(isoString) {
  if (!isoString) return "–";
  return new Date(isoString).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel() {
  return state.lastSuccessfulUpdate
    ? `Zuletzt aktualisiert: ${formatDateTime(state.lastSuccessfulUpdate)}`
    : "Noch keine Aktualisierung erfolgt.";
}

function showStatus(messageText, isError = false) {
  const statusElement = document.getElementById("update-status");
  if (!statusElement) return;
  statusElement.textContent = messageText;
  statusElement.style.color = isError ? "var(--danger)" : "var(--muted)";
}

function hasFreshCache() {
  const matchesFresh = state.matches.length > 0 && Date.now() - state.matchesTimestamp < CACHE_DURATION_MS;
  const standingsFresh = state.standings.length > 0 && Date.now() - state.standingsTimestamp < CACHE_DURATION_MS;
  return matchesFresh && standingsFresh;
}

// Auf GitHub Pages liegen die JSON-Dateien auf demselben Origin wie die
// Seite selbst ("data/matches.json" reicht). In der gebauten Android-App
// sind sie nur als Stand-vom-Build eingefroren, deshalb holt die App die
// aktuelle Version stattdessen direkt von der live gehosteten Webseite.
// WICHTIG: GITHUB_PAGES_URL unten anpassen, sobald das Repo online ist.
const GITHUB_PAGES_URL = "https://d3adstuff.github.io/wm2026-fanportal/";

function getDataBaseUrl() {
  const isNativeApp = typeof window.Capacitor !== "undefined" && window.Capacitor.isNativePlatform?.();
  return isNativeApp ? `${GITHUB_PAGES_URL}data/` : "data/";
}

async function fetchJson(filename) {
  const response = await fetch(`${getDataBaseUrl()}${filename}?t=${Date.now()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

async function loadData(force = false) {
  const now = Date.now();

  if (!force && hasFreshCache()) {
    renderAll();
    showStatus(`Daten aus Cache: ${formatDateTime(state.lastSuccessfulUpdate)}`);
    return;
  }

  try {
    const [matchesData, standingsData] = await Promise.all([
      fetchJson("matches.json"),
      fetchJson("standings.json"),
    ]);

    state.matches = matchesData.matches || [];
    state.matchesTimestamp = now;
    state.standings = standingsData.standings || [];
    state.standingsTimestamp = now;
    // generatedAt kommt vom GitHub-Actions-Lauf, nicht vom Gerät — das ist
    // der ehrliche Zeitpunkt, zu dem die Daten wirklich aktuell waren.
    state.lastSuccessfulUpdate = matchesData.generatedAt || new Date().toISOString();

    renderAll();
    showStatus(getStatusLabel());
  } catch (error) {
    if (state.lastSuccessfulUpdate) {
      showStatus(
        `Aktualisierung fehlgeschlagen, zuletzt aktualisiert: ${formatDateTime(state.lastSuccessfulUpdate)}`,
        true
      );
    } else {
      showStatus("Die Daten konnten nicht geladen werden. Bitte prüfe die Internetverbindung.", true);
    }
  }
}

function renderHome() {
  const nextMatches = document.getElementById("next-matches");
  const latestResult = document.getElementById("latest-result");
  if (!nextMatches && !latestResult) return;

  const sortedMatches = [...state.matches].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
  const upcoming = sortedMatches.filter(
    (match) => match.score?.fullTime?.home == null || match.score?.fullTime?.away == null
  );
  const recent = sortedMatches
    .filter((match) => match.score?.fullTime?.home != null && match.score?.fullTime?.away != null)
    .slice(-1);

  if (nextMatches) {
    const items = upcoming.slice(0, 3).map((match) => `
      <div class="match-item">
        <span class="match-date">${formatDate(match.utcDate)}</span>
        <div class="match-teams">
          <span class="team-name">${match.homeTeam.name}</span>
          <span>vs</span>
          <span class="team-name">${match.awayTeam.name}</span>
        </div>
        <span class="pill">${match.stage}</span>
      </div>
    `).join("");
    nextMatches.innerHTML = items || '<p>Keine kommenden Spiele verfügbar.</p>';
  }

  if (latestResult) {
    const result = recent[0];
    if (result) {
      latestResult.innerHTML = `
        <div class="card">
          <p class="group-tag">Letztes Ergebnis</p>
          <h3>${result.homeTeam.name} ${result.score.fullTime.home}:${result.score.fullTime.away} ${result.awayTeam.name}</h3>
          <p>${formatDate(result.utcDate)}</p>
        </div>
      `;
    } else {
      latestResult.innerHTML = '<div class="card"><p>Noch keine Ergebnisse vorhanden.</p></div>';
    }
  }
}

// Die API liefert Gruppen nicht als reinen Buchstaben ("A"), sondern z. B.
// als "GROUP_A" oder "Group A". Diese Funktion zieht daraus den reinen
// Buchstaben, damit ein Vergleich mit dem Dropdown-Wert ("A", "B", ...) klappt.
function extractGroupLetter(value) {
  if (!value) return null;
  const match = String(value).toUpperCase().match(/([A-L])\s*$/);
  return match ? match[1] : null;
}

function renderSchedule() {
  const container = document.getElementById("schedule-list");
  const filter = document.getElementById("groupFilter");
  if (!container) return;

  const list = [...state.matches].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
  const selectedGroup = filter ? filter.value : "all";

  const filtered = selectedGroup === "all"
    ? list
    : list.filter((match) => extractGroupLetter(match.group) === selectedGroup);

  container.innerHTML = filtered.map((match) => `
    <div class="match-item">
      <span class="match-date">${formatDateTime(match.utcDate)}</span>
      <div class="match-teams">
        <span class="team-name">${match.homeTeam?.name ?? "TBD"}</span>
        <span class="score-pill">${match.score?.fullTime?.home ?? "–"}:${match.score?.fullTime?.away ?? "–"}</span>
        <span class="team-name">${match.awayTeam?.name ?? "TBD"}</span>
      </div>
      <span class="pill">${match.group || match.stage}</span>
    </div>
  `).join("");
}

function renderStandings() {
  const container = document.getElementById("standings-container");
  if (!container) return;

  const groups = state.standings.filter((group) => group.table && group.table.length);
  container.innerHTML = groups.map((group) => `
    <div class="card">
      <h3 class="section-title">Gruppe ${extractGroupLetter(group.group) || group.group}</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pl.</th>
              <th>Mannschaft</th>
              <th>Pkt.</th>
              <th>Sp.</th>
              <th>G</th>
              <th>U</th>
              <th>V</th>
            </tr>
          </thead>
          <tbody>
            ${group.table.map((team) => `
              <tr>
                <td>${team.position}</td>
                <td>${team.team.name}</td>
                <td>${team.points}</td>
                <td>${team.playedGames}</td>
                <td>${team.won}</td>
                <td>${team.draw}</td>
                <td>${team.lost}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `).join("");
}

function renderTeams() {
  const container = document.getElementById("teams-grid");
  if (!container) return;

  container.innerHTML = TEAM_DATA.map((team) => `
    <article class="team-card">
      <small>${team.code}</small>
      <h3>${team.name}</h3>
      <span class="group-tag">Gruppe ${team.group}</span>
      <p>Inoffizielle 2026-Fan-Preview</p>
    </article>
  `).join("");
}

function renderVenues() {
  const container = document.getElementById("venues-grid");
  if (!container) return;

  container.innerHTML = VENUES.map((venue) => `
    <article class="stadium-card">
      <small>${venue.city}</small>
      <h3>${venue.name}</h3>
      <p><strong>Kapazität:</strong> ${venue.capacity}</p>
      <p><small>${venue.travel}</small></p>
    </article>
  `).join("");
}

function renderAll() {
  renderHome();
  renderSchedule();
  renderStandings();
  renderTeams();
  renderVenues();
}

function initControls() {
  const filter = document.getElementById("groupFilter");
  if (filter) {
    filter.addEventListener("change", renderSchedule);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initControls();
  renderAll();
  loadData(true);
  setInterval(() => loadData(false), REFRESH_INTERVAL_MS);
});
