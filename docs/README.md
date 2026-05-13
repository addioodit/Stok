# Stok legal documents

These three files are the canonical legal documents for the Stok app and are meant to be hosted at a public URL (App Store and Play Store both require this for finance-adjacent apps).

- [Privacy Policy](privacy.md)
- [Terms of Use](terms.md)
- [Important Disclosure](disclosure.md)

## Source of truth

The text in `src/data/legal.ts` and the markdown in this folder must stay in sync. When you change one, update the other in the same commit. Bump `ACCEPTANCE_VERSION` in `src/data/legal.ts` when the change is material — that re-prompts every existing installation to accept on next launch.

## These are starter templates

**Have a lawyer licensed in the publishing jurisdiction review every document before submitting the app to either store.** Replace every `[PLACEHOLDER]` (`[CONTACT_EMAIL]`, `[JURISDICTION]`) with real values.

## Hosting

Suggested setup: enable GitHub Pages on this repository pointing at the `docs/` folder of the default branch. The public URLs then become:

- `https://<owner>.github.io/<repo>/privacy.html`
- `https://<owner>.github.io/<repo>/terms.html`
- `https://<owner>.github.io/<repo>/disclosure.html`

(GitHub Pages renders `.md` files to HTML automatically.) Those URLs are what App Store Connect's "Privacy Policy URL" field and Google Play Console's "Privacy policy" field should point to.
