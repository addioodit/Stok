# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Stok is an Expo (React Native + TypeScript) **order-prep and portfolio app** for the Guyana Stock Exchange (GSE). It does **not** execute trades — GSE has no public retail trading API. The order flow composes an email or phone-call to a licensed broker (Beharry, Hand-in-Hand, GAMBI, TCGL) and lets the user record fills locally once the broker confirms execution. Treat that distinction as the product boundary: anything claiming to "buy" or "sell" must go through the email/phone/record-fill flow.

## Commands

| Task | Command |
| --- | --- |
| Run on device (Expo) | `npm start`, then `i` / `a` / `w` |
| Typecheck | `npm run typecheck` |
| All tests | `npm test` |
| Single test file | `npm test -- src/store/usePortfolio.test.ts` |
| Single test by name | `npm test -- -t "weights the average cost"` |
| Watch tests | `npm test -- --watch` |
| CI gate locally | `npm run typecheck && npm test -- --ci` |
| Regenerate brand assets | `python3 scripts/generate-icons.py` (needs Pillow + Liberation Sans Bold) |
| EAS dev build | `eas build --profile development --platform ios` (or `android` / `all`) |
| EAS preview / prod build | `eas build --profile preview` / `eas build --profile production` |

CI runs typecheck + tests on every push and PR (`.github/workflows/check.yml`). EAS / Sentry setup is in `docs/build-and-release.md`.

## Architecture

**App gate** (`App.tsx`): before the navigator renders, the app walks an onboarding gate — blank (while `useAcceptance` + `useProfile` rehydrate) → `AcceptScreen` (legal acceptance) → `ProfileSetupScreen` (username) → `RootNavigator`. Each gate store exposes a `hasHydrated` flag so there's no flash of an onboarding screen for an already-onboarded user.

**Navigation** (`src/navigation/RootNavigator.tsx`): a single `NavigationContainer` with a native stack at the root. The stack has the bottom-tab navigator as its first screen plus pushed routes: `StockDetail`, `OrderTicket` (modal), `Orders` (Activity log), `Legal`, and `DebugParser`. Tabs: Market, Watchlist, Portfolio, Dividends, News, Settings. Use `TabScreenProps<'Tab'>` for tab screens (it composites the tab nav and the parent stack so `navigation.navigate('StockDetail', ...)` typechecks).

**State — zustand + AsyncStorage**: every store in `src/store/` uses `persist(createJSONStorage(() => AsyncStorage))`. Stores are independent and only orchestrate each other at well-defined seams:

- `usePriceFeed.refresh()` is the only thing that calls the network. On success it merges new prices over old (preserving unupdated symbols) **and** calls `useHistory.getState().recordReport(...)` to append a snapshot.
- Components never read raw `priceFeed.prices`; they go through `useEffectiveCompanies` / `useEffectiveCompany` in `src/hooks/useCompanies.ts`, which overlays the live prices on the bundled defaults in `src/data/companies.ts`. This is what guarantees the UI keeps working when the parser only matches some symbols.

**Pricing data flow** is the most important read-path:

```
Market pull-to-refresh
  → usePriceFeed.refresh()
      → fetchLatestReport()            (src/data/marketReport.ts — IO only)
          → fetchText(ROOT_URLS)       (discovers latest Session<N>.htm)
          → fetchText(sessionUrl(N))
          → parseHtmlReport(html)      (src/data/marketReportParser.ts — pure)
      → merge into prices, set lastUpdated/sessionLabel
      → useHistory.recordReport(...)   (deduped by ISO day)
  → useEffectiveCompanies() reads from priceFeed.prices
  → screens render
```

**The parser is split deliberately**: `marketReportParser.ts` is pure (no fetch, no zustand) so it can be unit-tested against fixture HTML. `marketReport.ts` only owns the fetch orchestration. When you change parsing logic, update `src/data/__fixtures__/session-sample.html` and the tests in `marketReportParser.test.ts` — don't touch the network code.

**News** follows the exact same split: `newsParser.ts` is pure (RSS 2.0 + Atom → `NewsItem[]`, tested against `__fixtures__/rss-sample.xml` and `atom-sample.xml`), `news.ts` owns the parallel fetch (`Promise.allSettled` over `NEWS_SOURCES`; a feed that fails is skipped and named in `errors`, never fatal), and `useNews` is the store powering the News tab. Both the GASCI scraper and the news reader share `src/utils/fetchText.ts`.

**Failure UX**: `usePriceFeed` persists `lastError` + `lastErrorAt` across restarts. `src/utils/errorMessage.ts.classifyFetchError()` maps raw exception messages to a `{ title, body, canRetry }` shape; the Market banner uses that. `canRetry: false` is meaningful — page-format drift and 404s won't fix themselves on retry, so the UI hides the retry button in those cases.

**History**: `useHistory.byTicker[symbol]` is the persisted timeseries powering the Stock Detail chart. Two write paths: passive (every `priceFeed.refresh()`) and active (`useHistory.backfill(N)` walks `Session<currentN-1>.htm` … `Session<currentN-N>.htm`). Backfill skips any session that fails to fetch or parse rather than aborting the whole run.

**Orders** (`useOrders`) are an append-only audit log. The OrderTicket actions log every submission: emailing the broker → `'emailed'`, calling → `'called'`, Record fill → `'filled'` plus a `usePortfolio.addLot()` write. The Orders screen ("Activity") lets the user transition pending → filled (which also adds the lot) or cancelled. Treat `createdAt` as immutable; mutate `updatedAt` and `status` only via `setStatus()`.

## Config: app.json vs app.config.js

`app.json` is the static Expo manifest. `app.config.js` wraps it and layers env-driven values on top — currently `extra.sentryDsn`, `extra.eas.projectId`, and (when all Sentry env vars are present) the `@sentry/react-native/expo` plugin. When you add config that varies by environment (DSN-shaped secrets, project IDs, anything from `process.env`), put it in `app.config.js`; when it's a static constant for the app, put it in `app.json`.

## Sentry

`@sentry/react-native` is wired in `App.tsx`. `Sentry.init` is only called when `Constants.expoConfig.extra.sentryDsn` looks like a real DSN (`https://...`), and the default `App` export is only `Sentry.wrap(App)` in that case — so the app continues to run without Sentry compiled in (e.g. Expo Go, no .env.local) and CI tests don't need any Sentry config. The package requires native modules, so the in-app Sentry instrumentation only activates against a development or production build, not Expo Go.

## Conventions and gotchas

- **Cost basis only re-weights on buys.** `usePortfolio.addLot(symbol, qty, price)` accepts negative quantities for sells but does **not** shift the avg cost in that case. This was a real bug caught by tests — don't reintroduce it.
- **Broker emails are intentionally not bundled.** `src/data/brokers.ts` has names, phones, websites only. The user fills broker emails in Settings per-broker; the OrderTicket "Email order" button is disabled until one exists. Do not hard-code broker emails.
- **GSE company prices and dividend declarations in `src/data/` are seeded, illustrative defaults**, not live data. `companies.ts.COMPANIES` is overridden at runtime by the priceFeed overlay. `dividends.ts.DIVIDENDS` has no overlay yet and is the canonical source for the Dividends screen — needs a real source eventually.
- **The parser has never been tested against a live GASCI response.** All sandboxes hit by this repo's tooling get 403. The fixture HTML in `src/data/__fixtures__/` is hand-crafted to look like what GASCI likely serves. On a real device, open Settings → Developer → Parser debug to fetch live: that screen shows the raw HTML, every detected table's headers, and per-symbol status (`parsed` / `in-text-not-parsed` / `not-in-text`). Use the "Share raw HTML" button to send the page off the device, paste into `src/data/__fixtures__/session-sample.html`, and `marketReportParser.test.ts` will drive parser updates against the real response. When tweaking the parser, the column aliases live in `findCol` calls inside `parseFromTables` and `summarizeTables`; the symbol-matching in `matchCompany`.
- **Currency is GYD.** Amounts are stored as plain numbers; formatting (`G$1,234` for ≥100, `G$1.23` for <100) lives in `src/utils/format.ts`. Don't sprinkle ad-hoc formatting in components.
- **Time-of-day sensitivity**: `useHistory` dedupes points by `new Date(ts).toISOString().slice(0,10)` — multiple refreshes on the same UTC date collapse to one snapshot. Tests that exercise history pass an explicit `now` to keep them deterministic.
- **Bundle IDs (`gy.stok.app`) and app name (`Stok`) in `app.json` are placeholders** until the real product owner sets them.
- **News feed URLs in `src/data/newsSources.ts` are unverified** (same sandbox 403 as GASCI). On a real device a feed that 404s or changes format is skipped, not fatal — `useNews.failedSources` lists the misses. Adjust feed URLs there as needed.
- **There is no backend.** `useProfile` (username, display name) is local-only — it's the identity foundation for future community features, but Stok has no accounts, server, or sync. Anything genuinely "social" (a feed of other users, following, sharing) needs a backend that does not exist yet; don't scaffold fake versions of it.

## Generated assets

`scripts/generate-icons.py` produces `assets/icon.png`, `assets/adaptive-icon.png` (Android adaptive — transparent foreground, blue bg comes from `app.json`), `assets/splash-icon.png` (transparent foreground, composited on splash backgroundColor), and `assets/favicon.png`. To change colors or the mark, edit the script and re-run rather than editing the PNGs directly.

## Tests worth knowing about

- `src/store/usePortfolio.test.ts` — cost-basis math on every code path
- `src/store/useOrders.test.ts` — lifecycle + immutability of `createdAt`
- `src/data/dividends.test.ts` — windowing + expected-income reductions
- `src/data/marketReportParser.test.ts` — header-aware column matching, blank/zero last-sale skipping, loose-text fallback, session metadata extraction
- `src/utils/errorMessage.test.ts` — every classifier branch (timeout / no-network / 403 / 404 / 5xx / parser drift / fallback)
- `src/utils/format.test.ts` — GYD cent-cutoff at 100, signed pct, priceChange div-by-zero
