# Truth Table contributor contract

- Keep this a static client-only app with zero runtime dependencies. No accounts, servers, analytics, tracking, AI, external font requests, or user expression transmission.
- Parsing, operator precedence, and evaluation belong in pure functions in `src/logic.ts`; never evaluate arbitrary JS or place untrusted expression text in HTML.
- Add regression tests for semantics, syntax errors, table order, formatting and exports.
- Maintain a LaTeX-like, typographically precise interface without secondary explanatory labels, gradients, dashboards, marketing copy or onboarding overlays.
- Maintain keyboard support, accessible controls, high contrast, small-screen usability and reduced-motion behavior.
- Do not silently alter truth-table conventions or precedence; update tests and README.
- Deploy with Cloudflare Workers Static Assets: `wrangler.jsonc` serves `dist/`; do not introduce the Cloudflare Vite plugin or a Worker script without an actual runtime use case.
- Worker name `truth-table` matches the Cloudflare dashboard project. Vite base must remain `/` for the Worker root.
- Run `npm run check`, `npm run build`, and `npx wrangler deploy --dry-run` before release. Never require production Cloudflare credentials in PR CI.
