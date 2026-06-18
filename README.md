# WM 2026 Fan-Portal

Inoffizielle Fan-Seite zur WM 2026 — als Webseite (GitHub Pages) und als Android-App
(über Capacitor + GitHub Actions gebaut). Nicht verbunden mit FIFA.

## Architektur (wichtig zu verstehen, bevor du etwas änderst)

Der Browser bzw. die App ruft `api.football-data.org` **nicht mehr direkt** auf.
Gründe: CORS blockiert den direkten Aufruf aus dem Browser, und ein API-Key im
Client-Code (egal ob Webseite oder APK) ist für jeden auslesbar.

Stattdessen:

1. Ein GitHub-Actions-Workflow (`.github/workflows/fetch-data.yml`) läuft stündlich,
   ruft die API **serverseitig** mit deinem Key auf (liegt nur als GitHub Secret vor)
   und committet das Ergebnis als `www/data/matches.json` und `www/data/standings.json`.
2. Die Webseite liest diese beiden Dateien vom eigenen Origin (`data/matches.json`) —
   kein CORS-Problem, kein Key im Client.
3. Die Android-App bündelt diese Dateien zwar beim Bauen mit, holt sich aber beim
   Start zusätzlich die aktuelle Version direkt von der live gehosteten GitHub-Pages-
   Seite (siehe `GITHUB_PAGES_URL` in `www/script.js`), damit sie nicht auf dem
   Daten-Stand des letzten App-Builds einfriert.

## Einmaliges Setup

1. **Repository anlegen** und diesen gesamten Ordnerinhalt hochladen (`android/`,
   `docs/`, `.github/`, `scripts/`, `package.json`, `capacitor.config.ts`, `.gitignore`).
2. **API-Key als Secret hinterlegen:** Repo → Settings → Secrets and variables →
   Actions → "New repository secret" → Name `FOOTBALL_DATA_API_KEY`, Wert = dein
   football-data.org-Key. Der Key landet dadurch **nirgendwo** im Code.
3. **GitHub Pages aktivieren:** Settings → Pages → "Deploy from a branch" → Branch
   `main`, Ordner `/docs` (genau dieser Ordnername ist absichtlich gewählt, weil
   GitHub Pages beim Branch-Deploy nur `/` oder `/docs` als Ordner anbietet).
4. **`GITHUB_PAGES_URL` in `www/script.js` prüfen/anpassen.** Aktuell steht dort
   `https://d3adstuff.github.io/wm2026-fanportal/` — das ist eine Annahme zum
   Repo-Namen. Stimmt der tatsächliche Pages-Link nicht damit überein, die App holt
   sonst keine Live-Daten. Im Zweifel: Wert in den Settings → Pages nachschauen und
   eintragen.
5. **Workflows einmal manuell anstoßen:** Repo → Actions → "Daten aktualisieren" →
   Run workflow. Danach liegen echte Daten in `docs/data/*.json` statt der Platzhalter.
6. **APK bauen lassen:** Repo → Actions → "Android-APK bauen" → Run workflow.
   Nach Abschluss unter dem Workflow-Lauf → Artifacts → `WM2026-FanPortal-apk`
   herunterladen, entpacken, `app-debug.apk` aufs Handy übertragen und installieren
   (Android fragt ggf. nach Erlaubnis für "Installation aus unbekannten Quellen").

## Laufender Betrieb

- Daten aktualisieren sich automatisch stündlich über den Cron-Workflow — kein
  manueller Schritt nötig.
- Ein neuer APK-Build wird automatisch ausgelöst, wenn Code in `docs/`, `android/`
  o. ä. geändert und auf `main` gepusht wird (Datenänderungen allein lösen **keinen**
  Rebuild aus — die App holt sich aktuelle Daten ja ohnehin live nach).

## Lokale Entwicklung

```
npm install
npm run fetch-data      # braucht FOOTBALL_DATA_API_KEY als lokale Umgebungsvariable
npm run sync            # kopiert docs/ in das Android-Projekt
npm run open:android    # öffnet das Projekt in Android Studio (falls installiert)
```

## Play Store

Nicht eingerichtet. Würde zusätzlich einen einmaligen Signing-Key, die 25 $
Google-Play-Console-Gebühr und einen Store-Eintrag mit Screenshots erfordern.
