# Changelog

Notable changes per release. Dates are calendar (YYYY-MM-DD); versions follow `app.json → version`. When `ACCEPTANCE_VERSION` (in `src/data/legal.ts`) bumps, every install re-prompts for legal acceptance — call that out under the version it ships in.

## Unreleased

### Added
- First-launch 3-page tour (`OnboardingScreen`) that explains the broker-mediated order flow. Replayable from Settings → Help → Replay intro.
- Local backup & restore (`src/data/backup.ts` + `src/utils/backupIo.ts`). Versioned JSON written via `expo-file-system` and shared via `expo-sharing`; imported via `expo-document-picker`.
- Factory-reset action in Backup & restore that wipes every persisted store and returns the app to first-launch.
- App-level `ErrorBoundary` with a "Try again" recovery screen. Reports to Sentry only when a real DSN is configured.
- Stale-prices banner (`StaleDataHint`) on Portfolio, Watchlist, and Stock Detail when the priceFeed is missing or older than 3 days.
- Market list sort (A–Z / Gainers / Losers / Price) with a horizontal sector pill filter; same sort added to Watchlist.
- Pending-orders badge on the Portfolio tab.
- News tab: RSS/Atom aggregation of Guyana + Caribbean sources with per-source failure reporting.
- ESLint with `eslint-config-expo` and a CI lint step; project root README.

### Fixed
- Conditional `useMemo` after an early return in `OrderTicketScreen` (caught by ESLint react-hooks rule).
- A few hand-rolled column-header matches in `marketReportParser` weren't case-tolerant — `findCol` now lowercases before matching.

### Notes
- Bundle IDs (`gy.stok.app`) and the app name in `app.json` are still placeholders. Update them with the product owner before submitting to either store.
- The GASCI parser fixtures (`src/data/__fixtures__/session-sample.html`) are hand-crafted. Use Settings → Developer → Parser debug on a real device to capture a live response and update the fixtures.
