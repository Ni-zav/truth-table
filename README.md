# Truth Table

A static, client-side Boolean truth table with mathematical typography, instant evaluation, and no runtime dependencies.

## Run

Node.js 22.12+:

```sh
npm install
npm run dev
npm run check
npm run build
```

## Expressions

Single-letter variables A–Z (case-insensitive), up to eight variables and 256 rows. Operators:

- NOT: `¬`, `!`, `~`, `NOT`
- AND: `∧`, `&`, `&&`, `*`, `AND`
- NAND: `↑`, `⊼`, `NAND`
- OR (inclusive): `∨`, `|`, `||`, `+`, `OR`
- NOR: `↓`, `⊽`, `NOR`
- XOR: `⊕`, `^`, `XOR`
- XNOR: `⊙`, `XNOR`
- Implication: `→`, `⇒`, `->`, `=>`, `IMPLIES`
- Equivalence: `↔`, `⇔`, `≡`, `<->`, `<=>`, `IFF`
- Constants: `⊤`, `⊥`, `1`, `0`, `TRUE`, `FALSE`

Precedence, highest to lowest: NOT, AND/NAND, XOR/XNOR, OR/NOR, implication, equivalence. Implication is right-associative. Use parentheses for grouping. Alphabetical variables; assignments sorted all true to all false. Intermediate steps are optional.

Copy TSV, export CSV, and share URL query links. No analytics, tracking, external fonts, login, or application backend. Evaluation happens locally. The usual static files are fetched from the hosting provider. **A shared link contains your expression in its URL** and may be visible to the hosting provider, browser history, and anyone you share it with; avoid sharing sensitive expressions.

## Cloudflare Workers

The repository is configured for **Cloudflare Workers Static Assets**, not Cloudflare's Vite framework integration. `wrangler.jsonc` binds the Worker name `truth-table` to the production `dist/` directory. No Worker script, plugin, or server is necessary.

For the existing Git-connected Cloudflare Worker, use:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | repository root |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Build output directory | `dist` |

The build command runs once in Cloudflare Builds. Wrangler deploy uploads the already-built static assets; **do not put another build in the Cloudflare deploy command**. Wrangler is a pinned local dev dependency, not dynamically installed during deployment. The Worker name in Cloudflare and `wrangler.jsonc` must match.

Local preview of Cloudflare routing: `npm run preview:workers`. To build and deploy yourself after authenticating with Cloudflare: `npm run deploy:workers`. Pull-request CI verifies typechecks, tests, production build, and Wrangler configuration using `wrangler deploy --dry-run` without uploading anything or needing deployment credentials.

The application is intended for the Worker's root URL, normally `https://truth-table.<your-account-subdomain>.workers.dev/` or a mapped custom domain. Avoid GitHub Pages' `/truth-table/` asset base.
