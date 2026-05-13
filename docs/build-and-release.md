# Build & release

This is the runbook for taking a Stok build from local dev to the App Store and Play Store. It assumes the legal docs from Batch 2 have been reviewed and the placeholders replaced.

## One-time setup

### 1. Pick real bundle identifiers

In `app.json`, replace the placeholders:

```json
"ios":     { "bundleIdentifier": "REPLACE_ME" },
"android": { "package":          "REPLACE_ME" }
```

Reverse-DNS, ideally based on a domain you own (e.g. `com.<your-domain>.stok`). Once a build is uploaded to either store under a given identifier, **it can never be changed**. Pick deliberately.

### 2. Hook up an Expo / EAS account

```bash
npx expo login            # one-time, links the local CLI
npx eas init              # creates a project on EAS, writes the ID into app.json
```

`eas init` will set `expo.owner` (the account or organization slug) and `expo.extra.eas.projectId`. The dynamic config in `app.config.js` reads `EAS_PROJECT_ID` from the env when present, so locally you can also `export EAS_PROJECT_ID=...` instead of editing app.json.

### 3. Sentry (optional but recommended before store submission)

1. Create a project at https://sentry.io (React Native platform).
2. Copy the DSN from project settings (it looks like `https://<key>@<org>.ingest.sentry.io/<id>`).
3. Store the DSN and matching org/project slugs as EAS secrets so they're injected during cloud builds:
   ```bash
   eas secret:create --name SENTRY_DSN          --value "https://...@...ingest.sentry.io/..."
   eas secret:create --name SENTRY_ORG          --value "your-org-slug"
   eas secret:create --name SENTRY_PROJECT      --value "stok"
   eas secret:create --name SENTRY_AUTH_TOKEN   --value "sntrys_..."   # for source-map upload
   ```
4. For local development against a real device build, copy `.env.example` to `.env.local` and fill the same names. (Local `npm start` still runs without these — Sentry init is a no-op when `SENTRY_DSN` is missing.)

**Note:** `@sentry/react-native` requires a development build (not Expo Go). After adding the SDK, the next `eas build --profile development` produces a dev client that has Sentry compiled in.

## Build profiles (`eas.json`)

| Profile | Distribution | Use it for |
| --- | --- | --- |
| `development` | internal (dev client) | Day-to-day on a real device with full hot-reload. Sentry, native deps, etc. all work. |
| `preview` | internal | Build a production-shaped binary you can install on testers' devices without going through the store. |
| `production` | store | Final binary for App Store Connect / Play Console upload. `autoIncrement: true` bumps the build number on every cloud build. |

Run:

```bash
eas build --profile development --platform ios     # or android, or all
eas build --profile preview     --platform all
eas build --profile production  --platform all
```

## Store submission checklist

Before clicking "Submit" in App Store Connect or Play Console:

- [ ] Bundle identifiers in `app.json` are the real ones (no `gy.stok.app` placeholder).
- [ ] `expo.version` in app.json bumped if this is a new public version (separate from the EAS-managed build number).
- [ ] Legal docs in `src/data/legal.ts` reviewed by counsel; `[CONTACT_EMAIL]` and `[JURISDICTION]` replaced.
- [ ] `docs/{privacy,terms,disclosure}.md` published at a public URL (GitHub Pages on this repo works) and that URL pasted into App Store Connect's "Privacy Policy URL" field and Play Console's "Privacy policy" field.
- [ ] `ACCEPTANCE_VERSION` in `src/data/legal.ts` bumped if any of the three documents changed materially since the last release.
- [ ] Sentry DSN set as an EAS secret if you want crash reports from production users.
- [ ] App Store screenshots generated (use the production build on simulators).
- [ ] Age rating set to "17+" (finance-adjacent apps consistently fail review at lower ratings).
- [ ] App Privacy questionnaire in App Store Connect filled out: declare local-only data (no collection by Stok), declare GASCI as a third-party network call, declare nothing as linked to identity (since Stok has no accounts).

## After submission

If a reviewer pushes back on the disclosure language ("Apple Guideline 5.0 — Legal"), the fix is almost always in `src/data/legal.ts` `DISCLOSURE` document; bump `ACCEPTANCE_VERSION` so existing testers see the new copy on next launch.
