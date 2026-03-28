# BLKB Jugend-App — Dokumentation
## "Was morgen zählt"

---

## 1. Projektübersicht

Die App ist ein interaktiver HTML-Prototyp einer BLKB Jugend-Banking-App für 12–30-Jährige. Sie läuft komplett im Browser, benötigt keinen Server und keine Datenbank.

**Technologie-Stack:**
- HTML5 / CSS3 / Vanilla JavaScript (keine Frameworks, kein Build-Tool)
- Alle Bilder lokal im `img/`-Ordner
- Eine einzige Datei: `index.html` (~2'600 Zeilen)

---

## 2. Dateistruktur

```
blkb-jugend-app/
├── index.html          → Die komplette App (HTML + CSS + JS in einer Datei)
├── img/
│   ├── logo.svg        → BLKB Logo (rot)
│   ├── logo-white.svg  → BLKB Logo (weiss, für dunkle Header)
│   ├── hero.jpg        → Hero-Bild Dashboard
│   ├── jugend1–6.jpg   → Bilder für Lifecycle-Phasen
│   └── ...             → weitere Bilder (Liestal etc.)
└── DOKUMENTATION.md    → Diese Datei
```

---

## 3. App-Struktur & Navigation

Die App hat 5 Bereiche (Views), die über eine Sidebar oder per Code aufgerufen werden:

| View-Name | Funktion |
|-----------|----------|
| `home`    | Dashboard mit Konten, Lifecycle, Schnellzugriff |
| `goals`   | Sparziele mit Wizard |
| `haxx`    | MoneyHaxx — 6 Finanztipps |
| `budget`  | Budgetrechner |
| `finlit`  | Finanzkompetenz / BLKB Angebote |

Navigation zwischen Views:
```javascript
switchView('home', 0);   // Dashboard
switchView('goals', 1);  // Sparziele
switchView('haxx', 2);   // MoneyHaxx
switchView('budget', 3); // Budget
switchView('finlit', 4); // Finanzkompetenz
```

---

## 4. Inhalte anpassen

### 4.1 Konten / Demo-Daten (Dashboard)

Im `home`-View, Abschnitt `<!-- BP Konten -->`:
- Kontonummern, Saldo und Kontobezeichnungen direkt im HTML anpassen
- Das `DEMO`-Badge kann entfernt werden sobald echte API-Daten fliessen

### 4.2 Sparziele

Die Standard-Sparziele sind in der JavaScript-Variable `goals` definiert (ca. Zeile 2500):
```javascript
var goals = [
  { name: 'Neue Beats', target: 280, saved: 140, emoji: '🎧', ... },
  ...
];
```
Neue Ziele können dort direkt hinzugefügt werden.

### 4.3 MoneyHaxx (Finanztipps)

Variable `haxxData` (ca. Zeile 2700):
```javascript
var haxxData = [
  { title: 'Das 3-Konto-System', emoji: '🏦', text: '...', steps: [...] },
  ...
];
```
- `title`: Titel des Hacks
- `emoji`: Icon
- `text`: Beschreibungstext
- `steps`: Array mit Schritten (wird als nummerierte Liste dargestellt)

### 4.4 Lifecycle-Phasen

Variable `phases` (ca. Zeile 2450):
```javascript
var phases = [
  { label: 'Entdecker', min: 12, max: 14, img: 'img/jugend1.jpg', ... },
  ...
];
```
Bilder, Texte und Altersgruppen dort anpassen.

### 4.5 Begrüssungs-Toast

Automatisch zeitabhängig, kein Anpassen nötig. Code am Anfang von `<body>`:
- ☀️ Guten Morgen (00–11 Uhr)
- 🌤 Guten Mittag (12–17 Uhr)
- 🌙 Guten Abend (18–23 Uhr)

---

## 5. Bilder ersetzen

Alle Bilder liegen im `img/`-Ordner. Einfach ersetzen:
- Gleicher Dateiname → automatisch übernommen
- Neuer Dateiname → im HTML entsprechende `src="img/..."` anpassen

Empfohlene Bildgrössen:
- `hero.jpg`: 800×300px (Dashboard-Banner)
- `jugend1–6.jpg`: ~600×400px (Lifecycle-Phasen)
- Logos: SVG (beliebig skalierbar)

---

## 6. Avaloq-Integration (nächste Schritte)

Aktuell laufen alle Daten als statische Demo-Werte im JavaScript. Für die echte Integration:

### 6.1 Was ersetzt werden muss

| Aktuell (Demo) | Avaloq-Integration |
|----------------|-------------------|
| Hardcodierte Kontonummern & Saldi | REST-API-Call an Avaloq Konto-Endpunkt |
| Statische Sparziele im `goals`-Array | Persistente Speicherung (Datenbank o. Avaloq) |
| Keine Authentifizierung | BLKB Login / OAuth / Token-Flow |

### 6.2 Empfohlene Architektur

```
Browser (HTML/JS)
    ↕ REST/JSON
Backend (Node.js / Java / .NET)
    ↕ Avaloq API / Webservices
Avaloq Core Banking
```

Die App kann als Frontend bestehen bleiben — die JS-Funktionen `apiInit()` und `loadAccounts()` sind bereits als Platzhalter vorbereitet und müssen nur auf echte Endpunkte zeigen.

### 6.3 Empfehlung für Entwickler

1. **Backend-Proxy** aufsetzen, der Avaloq-Calls kapselt (CORS, Auth)
2. `apiInit()` in `index.html` anpassen → echte Account-Daten laden
3. Sparziele in eigener Datenbank oder Avaloq-Positionen mappen
4. Login-Flow vor App-Zugriff schalten (BLKB SSO / OpenID Connect)

---

## 7. Lokaler Test

Keine Installation nötig:
```bash
# Option 1: Direkt im Browser öffnen
open index.html

# Option 2: Lokaler HTTP-Server (empfohlen)
npx serve .
# → http://localhost:3000
```

---

## 8. Deployment

Die App ist eine statische Single-Page-Application — kein Build-Prozess nötig.

**Mögliche Deployment-Ziele:**
- Interner Webserver / Intranet
- Azure Static Web Apps
- Nginx / Apache (einfach `index.html` + `img/` ins Root-Verzeichnis)

---

## 9. Known Limitations (Prototyp)

- Alle Daten sind Demo-Werte (kein echtes Banking)
- Keine Persistenz (Reload = Reset)
- Keine Authentifizierung
- Nicht für Mobile optimiert (responsive Basis vorhanden, aber kein native App-Feeling)

---

*Erstellt mit Nori · CAS Next Gen Banking & AI 2026*
