# ACI Web — AI Communication Inspector site

Static marketing site: plain HTML / CSS / vanilla JS, **no build step, no framework**.
Homepage `index.html` + 4 module sub-pages + supporting pages + `comm-inspector-onepager.html`, plus
`index-v2.html`, a long-term unlisted test variant of the homepage (see below).
Shared `styles.css` and `script.js` (blog pages also load `blog.css`). Bull / DataSentics brand.

| File | Page |
|---|---|
| `index.html` | Homepage — "AI Comms Inspector — Read Every Conversation" (new design, analytics variant `v3`) |
| `index-v2.html` | Unlisted long-term test variant of the homepage (own CSS `home-v2.css`, `noindex`) |
| `faq.html` | Common questions (the 12 Q&As that used to sit on the homepage) |
| `ai-customer-insights.html` | Module: AI Customer Insights (formerly `comm-inspector.html`) |
| `ai-call-inspector.html` | Module: AI Call Inspector |
| `ai-quality-assurance.html` | Module: AI Quality Assurance |
| `ai-coach.html` | Module: AI Coach |
| `architecture.html` | Architecture |
| `pricing.html` | Pricing |
| `case-studies.html` | Case Studies |
| `blog.html` | Blog index |
| `blog-500000-in-tokens.html` | Blog post: "A business question should not cost €500,000 in tokens" |
| `blog-one-prompt-away.html` | Blog post: "Every conversation … is now one prompt away" |
| `blog-paying-consultants-to-guess.html` | Blog post: "I spent years paying consultants to guess …" |
| `privacy-policy.html` | Privacy Policy |
| `comm-inspector-onepager.html` | One-pager (print/PDF companion: `AI-Communication-Inspector-1-pager.pdf`) |

`sitemap.xml` and `robots.txt` live at the repo root; add new pages to the sitemap.

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

## Homepage (live since 2026-11, analytics variant `v3`)

`index.html` is the redesigned homepage: pain-led and short. Order: hero, Built by Bull, "The impact",
"What a sample hides" (`#pains`), Enterprise proof, "Who it's for", Modules, founder card
(`#founder-note`), How it works, gated demo video (`#demo-video`), Proven results, Build vs. partner vs. buy,
team (`#team`), How we work together (`#together`), contact form (`#demo`). The old worked example,
business-value, deployment (`#stack`) and FAQ sections left the page; the FAQ is now `faq.html`, and the
footer "Deployment" link goes to `architecture.html`. Anchors that other pages still use and that exist:
`#demo`, `#how`, `#delivers`.

- Reuses `styles.css` and `script.js` (the video gate, `data-vid-*`, and the form handlers live in
  `script.js`; both forms submit with `fetch`, so visitors never land on a Web3Forms page).
- Every `<section>` and the footer carry `data-section` / `data-step` for the analytics layer.
- Main action label across the site is "Book a use-case session" (the internal form id `demo_walkthrough`
  in analytics stays for continuity).
- The previous homepage is kept only in git: tag `homepage-v1-backup`.

## Homepage v2 (unlisted long-term test variant for ad traffic)

`index-v2.html` + `home-v2.css` + `Assets/v2/` are a test homepage: a faithful port of the shared draft
"Customer intelligence for European companies" (the draft's own markup and CSS, so colours, type and layout
match it). It is **not** the live homepage:

- `noindex, nofollow` + canonical to `https://comms-inspector.com/`; **not** in `sitemap.xml`, **not**
  linked from any page or nav. Reached only by direct URL (paid-campaign UTM links).
- **Standalone design:** loads only `home-v2.css` (the draft's CSS, Tosh A from `Assets/Fonts`), not
  `styles.css` or `script.js`. Site additions sit at the bottom of the CSS and in the inline script at the
  end of the HTML (menu, reveal, sticky CTA, contact form, GA4).
- The draft's own nav and footer, with links into the site added (Pricing, Case studies, Blog, the four
  module pages, Architecture). The draft's partner-programme page is not ported on purpose (commission
  terms, unconfirmed figures).
- Contact form: Web3Forms via fetch, GA4 `generate_lead` with the same `form_id` as the live form (variants
  are told apart by page path) and a hidden `variant=homepage-v2` field. The webinar gate posts natively to
  Web3Forms and redirects to the recording.
- People cards carry local corrections the draft may lack: Jiřina's current role and badges, LinkedIn links
  for David and Jiřina. Re-check them if the draft is ported again.
- Known issue: the webinar gate's `redirect` to YouTube is ignored by the free Web3Forms plan (cross-domain
  redirects are paid), so visitors see Web3Forms' default success page and no recording. Fix by unlocking the
  recording on the page instead of redirecting.
- **Swap procedure (if v2 ever wins over the live homepage):** replace `index.html` with `index-v2.html`'s content (it brings its own
  CSS), drop the noindex + canonical lines, move the content that left the homepage (worked example, "how it
  works", deployment detail) onto `ai-customer-insights.html` / `architecture.html`, and leave a meta-refresh
  stub at `index-v2.html` if ad links still point at it. Other pages keep `styles.css`, so the site's look
  changes only on the homepage unless they are restyled too.

## Analytics layer (`analytics.js`)

Loaded synchronously on every page right after the Cookiebot script (Cookiebot must stay first). Bump the
`?v=` on its `<script>` tag in all pages when it changes. All calls are wrapped, so a blocked or missing
`gtag` (no cookie consent) never breaks a page. Test pages locally with the Browser pane only after
checking that `styles.css` loaded (a second stale server on port 8087 once reset it); the pane does not run
`requestAnimationFrame` / `IntersectionObserver`, so stub both when testing scroll events.

- **`homepage_variant`**: `v3` on `index.html` (the current homepage), `v2` on `index-v2.html` or any page opened
  with `?hp=v2`, else `none`. `v1` was the old homepage and is retired (history stays in GA4). Set on the GA4 `config` call (so `page_view` carries it) and on every custom event.
- **Keeping V2 visitors on V2**: on V2 pages internal links get `?hp=v2`, links to `index.html` become
  `index-v2.html`, and homepage anchors are mapped (`#demo` to `#contact`, `#delivers` to `#questions`,
  `#faq` to `#webinar`, `#stack` to `architecture.html`). Never put `utm_*` on internal links: GA4 would start a
  new session and overwrite the real source. Ad links carry `utm_*` only.
- **Events**: `scroll_depth` (`percent` 10/25/50/75/90/100), `section_view` (`section_id`, `section_step`,
  `section_order`), `scroll_summary` (furthest section and `max_percent` on exit), `cta_click` (`cta_type`
  book/webinar/linkedin, `cta_location`, `cta_text`), `internal_click` (`target_page`, `link_location`),
  `form_start` (`form_id`, same ids as `generate_lead`: `demo_walkthrough`, `quote_request`, `video_gate`,
  `webinar_gate_v2`). `generate_lead` is unchanged.
- **Sections**: tag a block with `data-section="<id>"` and `data-step="<step>"`. Steps shared by `v2` and
  `v3`: `hero`, `proof`, `problem`, `offer`, `how`, `people`, `contact` (+ `footer`); `v3` also uses
  `evidence` and `fit`; `v2` also uses `mission` and `webinar`; `faq` is the step of `faq.html`.
- **Lead attribution**: every Web3Forms form gets hidden fields `utm_*`, `gclid`, `li_fat_id`, `landing_page`,
  `landing_variant`, `referrer`, `homepage_variant`, `page_url` at submit time. First-touch values are kept in
  `sessionStorage` only after Cookiebot statistics consent; without consent only the current URL is used.
- Every page now has a `canonical` (absolute, no query), so `?hp=v2` URLs never compete in search.
