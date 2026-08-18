# Contributing

Thank you for considering contributing to `dsh-failure-lens`. This is a deliberately narrow, deterministic DeepSeek Harness Web client plugin; keep changes small and focused.

## Ground rules

- **One signature.** V0.1 recognizes exactly the four-condition Windows `spawn EPERM` conjunction documented in the README. A future classifier registry is allowed only after real demand; do not add signature classes speculatively.
- **No side effects.** The plugin never calls a model, never approves anything, never writes the session log, never patches the DOM, and never copies raw long output.
- **Official APIs only.** Compose through `conversationEvents.register`, `slots.inject('conversation.chat.node', …)`, and `locale.register`. Do not import private client internals or patch the DOM.
- **Bilingual copy.** Every user-facing string must have a matching `zh` and `en` entry with the same key set (zh is the source of truth).

## Development

```sh
npm install          # install dependencies
npm run typecheck    # TypeScript strict check
npm test             # unit tests (classifier, definition, locales, component)
npm run build        # node half + client bundle
npm run pack:check   # verify the published tarball contents
```

The test suite includes a positive case derived from a real exported Harness session (`tool/result` seq `24071`) and negative lookalikes. Keep the classifier's behavior changes covered by new test cases.

## Pull requests

1. Open an issue describing the problem or feature before a large change.
2. Branch from `main`, keep commits focused, and run the full local check ladder above.
3. Mention the exported session or a minimal reproduction for any signature change.
4. CI runs typecheck, tests, build, and package dry-run against Node LTS.

## Issue template

Please use the shipped issue template (`.github/ISSUE_TEMPLATE`). For false-positive reports, include the exported session (`.jsonl`) or a minimal reproduction, and note whether the sandbox was active.

## License

By contributing you agree your contributions are licensed under Apache-2.0 (see [LICENSE](LICENSE)).
