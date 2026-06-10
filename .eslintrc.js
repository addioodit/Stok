// Stok project ESLint config. Extends eslint-config-expo and pares back
// a handful of rules that are noisy in this codebase. Run via `npm run
// lint`; CI gates pushes through .github/workflows/check.yml.
module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    'web-build',
    '.expo',
    'assets',
  ],
  rules: {
    // The codebase uses inline curly-quote characters in user-facing copy.
    'no-irregular-whitespace': 'error',
    // React Native components frequently use `accessibilityElementsHidden`
    // alongside `importantForAccessibility` — both are valid; suppress the
    // double-attribute heuristic.
    'react/no-unescaped-entities': 'off',
  },
};
