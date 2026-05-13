// Dynamic Expo config. Loads the static app.json and layers env-driven
// values on top — anything that should differ between local dev, preview,
// and store builds goes here.
//
// Required env for production builds (set as EAS secrets, never committed):
//   SENTRY_DSN          — Sentry project DSN, e.g. https://<key>@<org>.ingest.sentry.io/<id>
//   SENTRY_AUTH_TOKEN   — only needed at build time for source-map upload
//   SENTRY_ORG          — Sentry organization slug
//   SENTRY_PROJECT      — Sentry project slug
//
// All four are optional in dev; without SENTRY_DSN, Sentry init is a no-op.

module.exports = ({ config }) => {
  const sentryDsn = process.env.SENTRY_DSN || null;
  const sentryOrg = process.env.SENTRY_ORG || null;
  const sentryProject = process.env.SENTRY_PROJECT || null;

  const plugins = [...(config.plugins ?? [])];
  if (sentryDsn && sentryOrg && sentryProject) {
    plugins.push([
      '@sentry/react-native/expo',
      {
        organization: sentryOrg,
        project: sentryProject,
        url: 'https://sentry.io/',
      },
    ]);
  }

  return {
    ...config,
    plugins,
    extra: {
      ...(config.extra ?? {}),
      sentryDsn,
      eas: { projectId: process.env.EAS_PROJECT_ID || null },
    },
  };
};
