# Truth Table contributor contract

- Keep this a static client-only app with zero runtime dependencies. No accounts, servers, analytics, tracking, AI, external font requests, or user expression transmission.
- Parsing, operator precedence, and evaluation belong in pure functions in `src/logic.ts`; never evaluate arbitrary JS or place untrusted expression text in HTML.
- Add regression tests for semantics, syntax errors, table order, formatting and exports.
- Maintain a LaTeX-like, typographically precise interface without secondary explanatory labels, gradients, dashboards, marketing copy or onboarding overlays.
- Maintain keyboard support, accessible controls, high contrast, small-screen usability and reduced-motion behavior.
- Do not silently alter truth-table conventions or precedence; update tests and README.
- Build for static GitHub Pages with the project-relative base path; run `npm run check` and `npm run build` before release.
