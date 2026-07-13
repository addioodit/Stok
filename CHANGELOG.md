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
- Portfolio empty state now has a Browse Market CTA that jumps to the tab.
- News tab: RSS/Atom aggregation of Guyana + Caribbean sources with per-source failure reporting.
- ESLint with `eslint-config-expo` and a CI lint step; project root README + CHANGELOG.
- `expo config` sanity check in CI so a broken manifest fails the push, not the next EAS build.
- `.nvmrc` + `engines.node` pinning Node 20.
- Sentry release + environment tags; `beforeSend` filter drops transient network exceptions.
- `fetchText` retries once on 5xx and network throws (with backoff); 4xx skips retry.

### Fixed
- Conditional `useMemo` after an early return in `OrderTicketScreen` (caught by ESLint react-hooks rule).
- Email/Call buttons on OrderTicket no longer silently fail on iOS: `LSApplicationQueriesSchemes` allows `mailto:` + `tel:`, and `Linking.openURL` is called directly (try/catch) instead of gating on `canOpenURL`.
- News article open uses the same try/catch pattern.
- Splash screen now held (`preventAutoHideAsync`) until every hydration store reports ready, then dismissed from an effect — no more splash → blank → app flash.
- A few hand-rolled column-header matches in `marketReportParser` weren't case-tolerant — `findCol` now lowercases before matching.

### Test coverage
- Bumped from ~104 to 147 tests across 20 suites. New suites: `backup`, `reset`, `marketView`, `StaleDataHint`, `useOnboarding`, `useWatchlist`, `useDividends`, `useProfile`, `useSettings`, `useHistory`, `fetchText`.

### Notes
- Bundle IDs (`gy.stok.app`) and the app name in `app.json` are still placeholders. Update them with the product owner before submitting to either store.
- The GASCI parser fixtures (`src/data/__fixtures__/session-sample.html`) are hand-crafted. Use Settings → Developer → Parser debug on a real device to capture a live response and update the fixtures.
