# ACI Web — AI Communication Inspector site

Static marketing site: plain HTML / CSS / vanilla JS, **no build step, no framework**.
Homepage `index.html` + 4 module sub-pages (`comm-inspector.html`, `ai-call-inspector.html`,
`ai-quality-assurance.html`, `ai-coach.html`) + `comm-inspector-onepager.html`.
Shared `styles.css` and `script.js`. Bull / DataSentics brand.

Local preview: `python -m http.server 8087` from the repo root → http://localhost:8087/
(also defined in `.claude/launch.json`). Line endings are CRLF (`core.autocrlf=true`).

## Copy & typography — line-wrapping rules

Marketing copy must not break in ways that read as broken. Enforce these **in the copy and
via CSS, never with hard `<br>`** (hard breaks look wrong at other viewport widths).

- **A line must never end with an arrow `→`.** The arrow points to the next item, so it has
  to stay with the word it points to. Bind each arrow to the following word with a
  **non-breaking space (U+00A0)** — i.e. write `→` + NBSP + `word` — and leave the space
  *before* the arrow a normal (breakable) space. Applied in the `#stack` "14 weeks discovery
  to go-live" card (`Discovery → Integration → Testing → …`).
- **Never split a hyphenated compound across two lines** (e.g. "Go-live", "black-box").
  Use a **non-breaking hyphen (U+2011)** instead of a plain `-`.
- **Card bodies use `text-wrap: pretty`, not `balance`.** `balance` shortens the first line to
  equalize line lengths and orphans words that would otherwise fit; `pretty` keeps lines full
  and only prevents a lone last word. Scope such rules (e.g. `#stack .stack__body`) so shared
  classes on other pages aren't affected.
- **Across the module / stack cards use en dashes `–` (U+2013), not em dashes `—`.**
- **Spell out ambiguous abbreviations** on first use (e.g. "IP" → "intellectual property" —
  "IP" reads as *IP address* next to "security perimeter").

## Listicles

- **Body text is regular weight (400), never 500/bold.**
- **Checkmarks are an orange stroke check, never a check inside a filled circle.** Same glyph
  as claimsense.app's comparison list — inline SVG, `viewBox="0 0 20 20"`,
  `path d="M4 10.5L8.5 15L16 5.5"`, `stroke="currentColor"`, `stroke-width="2.6"`, round caps.
  Colour it with `color: var(--orange)`.
- **All checkmarks are the same fixed size (`22px`) everywhere** — hero outcomes
  (`.hero__tick`), sub-page feature lists (`.feature-list__tick`), and the "THE SHIFT"
  before/after comparison (`.ba__tick`). Use a fixed px, not `em`, so the check reads
  identically across sections whose body text differs (14px hero vs 16px lists).
