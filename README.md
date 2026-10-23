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

## Deploy

The GitHub Actions Pages workflow runs checks and builds on `main`. Enable **Settings → Pages → Build and deployment → GitHub Actions**. Then the app is published at https://ni-zav.github.io/truth-table/.
