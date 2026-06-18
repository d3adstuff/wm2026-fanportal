// Läuft NUR in GitHub Actions, niemals im Browser oder in der App.
// Der API-Key kommt aus einem GitHub Secret (process.env.FOOTBALL_DATA_API_KEY),
// landet also nie im Client-Code.
import { writeFile, mkdir } from "node:fs/promises";

const API_BASE = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const OUT_DIR = "docs/data";

if (!API_KEY) {
  console.error("FOOTBALL_DATA_API_KEY ist nicht gesetzt (GitHub Secret fehlt).");
  process.exit(1);
}

async function fetchJson(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "X-Auth-Token": API_KEY },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} bei ${endpoint}`);
  }
  return response.json();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();

  const [matchesData, standingsData] = await Promise.all([
    fetchJson("/competitions/2000/matches"),
    fetchJson("/competitions/2000/standings"),
  ]);

  await writeFile(
    `${OUT_DIR}/matches.json`,
    JSON.stringify({ generatedAt, matches: matchesData.matches || [] }, null, 2)
  );
  await writeFile(
    `${OUT_DIR}/standings.json`,
    JSON.stringify({ generatedAt, standings: standingsData.standings || [] }, null, 2)
  );

  console.log(`Daten aktualisiert: ${generatedAt}`);
}

main().catch((error) => {
  console.error("Fehler beim Abrufen der Daten:", error.message);
  process.exit(1);
});
