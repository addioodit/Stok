# Stok

An Expo (React Native + TypeScript) order-prep and portfolio app for the **Guyana Stock Exchange (GSE)**. Stok does not execute trades — the GSE has no public retail trading API. The app composes emails or phone calls to one of the licensed brokers (Beharry, Hand-in-Hand, GAMBI, TCGL) and lets you record fills locally once the broker confirms.

## Quickstart

```bash
npm install
npm start         # then press i (iOS), a (Android), w (web)
```

The app boots into onboarding the first time: legal acceptance → profile → 3-page tour. After that it lands on the Market tab.

## Scripts

| Script | Use |
| --- | --- |
| `npm start` | Launch Expo dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint over `src/` + `App.tsx` |
| `npm test` | Jest |
| `npm test -- --watch` | Watch mode |
| `npm test -- src/store/usePortfolio.test.ts` | A single suite |

CI (`.github/workflows/check.yml`) runs `lint`, `typecheck`, and `test` on every push and PR.

## What's in the box

| Surface | What it does |
| --- | --- |
| **Market** | Live GSE prices from the latest GASCI session report. Search, sort (A-Z / Gainers / Losers / Price), sector pill filter. |
| **Watchlist** | Symbols you've flagged from a stock's detail page. |
| **Portfolio** | Holdings with cost basis and unrealised P/L. Stale-prices banner when the feed is >3 days old. |
| **Dividends** | Upcoming and recent declarations; expected income from your positions; mark-received toggle. |
| **News** | RSS / Atom aggregation of Guyana + Caribbean sources. |
| **Settings** | Profile, contact, default broker + per-broker email & account number, replay intro, backup & restore, legal, developer parser-debug. |
| **Stock Detail** | Price + change, line chart with weekly closes (backfillable), dividends, holding card, Buy/Sell/Watch actions. |
| **Order Ticket** | Composes an email or phone-call to the broker, plus a Record-fill action that writes to the portfolio. |
| **Activity** | Append-only log of every order; transition pending → filled or cancelled. |

## Architecture in one screen

- **Stores** (`src/store/`) — zustand + AsyncStorage. Each store is independent and uses `persist`. Stores orchestrate at well-defined seams (e.g. `usePriceFeed.refresh()` calls `useHistory.recordReport()` after a successful pull).
- **Pricing data flow** — Market pull-to-refresh → `usePriceFeed.refresh()` → `fetchLatestReport()` (IO) → `parseHtmlReport(html)` (pure) → merge into prices → `useHistory.recordReport()` → screens read via `useEffectiveCompanies()`.
- **Pure parsers** — `marketReportParser.ts` and `newsParser.ts` are pure and unit-tested against HTML/XML fixtures in `src/data/__fixtures__/`. The fetch orchestrators next to them are deliberately thin.
- **Failure UX** — `usePriceFeed` persists `lastError`. `errorMessage.ts.classifyFetchError()` turns raw errors into a user-facing title/body/canRetry. Market shows the banner; non-retryable cases (parser drift, 404) hide the retry button.
- **Backup** — `backup.ts` snapshots the seven user-data stores into a versioned JSON file (shared via `expo-sharing`); `applyBackup` is per-section defensive so malformed sections are skipped, not fatal.
- **Onboarding gate** — `App.tsx` walks `Acceptance → Profile → Tour → app`. Each store has a `hasHydrated` flag to prevent the gate from flashing.

For deeper architecture notes and conventions, see `CLAUDE.md`.

## Builds and release

- **Dev build:** `eas build --profile development --platform ios|android`
- **Preview / production:** see `docs/build-and-release.md` for Sentry, EAS project setup, and store submission.
- **Legal docs** are in `docs/` and must stay in sync with `src/data/legal.ts`. Bump `ACCEPTANCE_VERSION` on material change to re-prompt acceptance.

## Caveats to know

- **Bundle IDs (`gy.stok.app`) and the app name are placeholders** in `app.json` until the real product owner sets them.
- **Broker emails are not bundled.** Names, phones, websites only — the user fills emails per-broker in Settings.
- **The parser has never been tested against a live GASCI response** from this repo's sandboxes (they get 403). On-device, use Settings → Developer → Parser debug to fetch live and share the raw HTML back into `src/data/__fixtures__/session-sample.html`.
- **News feed URLs are unverified** for the same reason. `useNews` skips a feed that fails to fetch; failures show up in `failedSources`.
- **There is no backend.** Profile is local-only. Anything truly "social" needs a server that doesn't exist yet.
