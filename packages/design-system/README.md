# Bottlewise — Design System

> **First-pass visual + content system for the AI formula concierge.** Brand direction is currently an explicit Open Decision in the product PRD (§ 9, item 8 — "Branding / copy tone"). Everything in this folder is a working hypothesis the team can react to, not a final mark.

---

## What Bottlewise is

Bottlewise is the world's first **AI formula concierge** for parents of bottle-fed babies. It pairs a curated, FDA-aware formula knowledge base with a recommendation + similarity engine so a parent can:

- Get **3 personalized formula picks** (with reasons) from a guided baby-profile intake.
- Find the **next-closest available formula** when their pick is out of stock or stops working — the killer feature that would have mattered most in the 2022 crisis.
- See **landed cost transparency** including duty + clearance delay for European imports.
- Log **trial outcomes** at 7 and 30 days; aggregated, anonymized data becomes a public good.
- Get **calibration settings** for the major formula makers (Baby Brezza, Tommee Tippee Perfect Prep, Dr. Brown's Insta-Feed).
- Bridge **breast-to-formula** transitions with a calmer, lower-density UX.

It is positioned as **Tier 1 — Information & Decision-Support**. It is not medical advice, not a marketplace, not a clinical tool. Every recommendation surface carries non-dismissable "talk to your pediatrician" framing, and a hard safety pre-screen routes allergic-reaction / bleeding / severe-symptom language to a pediatrician interstitial before any formula content renders.

## Sources this system was built from

- **Repo:** `jordychase/bottlewise` (pre-implementation, May 2026)
  - `README.md` — vision, stack, repo layout
  - `CLAUDE.md` — project operating rules (compliance is non-negotiable)
  - `docs/PRD.md` — full V1 spec (read this first)
  - `docs/AI_DESIGN.md`, `docs/DATA_MODEL.md`, `docs/DATA_SOURCING.md` — referenced but not pulled in
  - `packages/db/` — adapter + seed framework (no UI yet)
- **No app code yet.** No screens, no components, no logo, no font files, no color tokens. Stack target is Expo (React Native + Expo Router) for web/PWA + iOS + Android.
- **No Figma file** was provided.

> If a Figma file or brand exploration exists elsewhere, share it — this system will be more grounded with it.

## Products represented

There is **one product** in V1: the Bottlewise app, shipped as a web/PWA first via Expo Router web export, with native iOS/Android wrappers later. So this system contains a single UI kit (`ui_kits/app/`) covering the mobile-first surface. Marketing site, docs site, and pediatrician portal are explicitly out of scope until later phases.

---

## CONTENT FUNDAMENTALS

The voice has to do real work. Parents arrive at Bottlewise anxious — the 2022 recall, tariff turbulence, conflicting Reddit threads, a pediatrician who said "any formula is fine." Copy is the difference between feeling reassured and feeling sold to.

### Voice in one line
**Calm authority, plain language, no marketing varnish.** A knowledgeable friend who happens to be a pediatric nutrition nerd, not a brand mascot.

### Person & address
- **"You" for the parent.** ("You can pause at any point.")
- **"We" for Bottlewise** when the product is acting on the parent's behalf. ("We compared 47 formulas against your baby's profile.")
- **Baby is named when known**, otherwise "your baby" — never "the infant", never "your little one."
- Never refer to the AI as a person ("Aria thinks…"). It's a tool. Say "Bottlewise" or "we."

### Casing
- **Sentence case for everything**: headings, buttons, nav, card titles. Title Case feels marketing-y and clinical at the same time.
- Brand name is always **Bottlewise** — one word, capital B.
- Acronyms stay caps: FDA, DHA, ARA, MSRP, HTS.

### Tone rules
- **Lead with the answer, then the reasoning.** Parents are tired. Don't make them read three sentences to find the recommendation.
- **Name the trade-off out loud.** "More expensive, but no palm oil." "Easier on digestion, but harder to find in stock right now."
- **Quantify when you can, hedge when you can't.** "12% more expensive after duty" beats "noticeably pricier." "Reports vary" beats faking precision.
- **Never claim a formula will treat a condition.** "Often chosen by parents managing reflux" — never "treats reflux."
- **Surface uncertainty, don't hide it.** Stock signals decay; cost is "as of [timestamp]"; recommendations are "based on what you told us about [baby]."

### Words we say / words we don't
| Use | Don't use |
|---|---|
| "Formula" | "Food" |
| "Reaction" | "Allergy" (unless confirmed by a clinician) |
| "Out of stock right now" | "Unavailable" (sounds permanent) |
| "Talk to your pediatrician" | "Consult a healthcare professional" (corporate) |
| "We don't know" | "Limited data is available" |
| "Switch" | "Wean" (loaded, especially in breast-to-formula) |
| "European import" | "Foreign formula" |
| "Ingredient" | "Nutritional component" |

### Emoji
**No.** Not in product copy, not in marketing, not in onboarding. Parents reading at 3am do not want to be cheered up by a 🍼. Reserved exception: a small set of **inline iconography from Lucide** (see ICONOGRAPHY below) used for category and status, never for emotion.

### Sample copy (for the smell test)

**Recommendation card lead:**
> Best match for Maya: **Bobbie Original Infant Formula**
> Cow milk, organic, no palm oil. Matches the gentle-introduction profile you flagged, and the family's eczema history doesn't rule it out. About $1.78 per reconstituted ounce — the most expensive of your three matches, but the only one with no palm oil at this stage.

**Out of stock cascade:**
> Bobbie is sold out at the two stores within 5 miles of you, and online stock looks thin (last confirmed 6 hours ago).
> The closest alternative we'd suggest is **ByHeart Whole Nutrition** — same protein source, similar fat blend, no palm oil, currently in stock on Amazon. It's about 9% cheaper per ounce.
> [See why we picked this] [Show all alternatives]

**Safety interstitial:**
> A few words before we go further.
> You mentioned **blood in the stool**. That's something a pediatrician should look at today, not something Bottlewise can help you reason about.
> When you're ready, we'll be here.
> [Call your pediatrician] [I've already spoken to them]

**Trial outcome prompt (Day 7):**
> A week in. How is Bobbie working for Maya?
> [Going well] [Mixed] [Not great] [Too early to tell]

### Anti-patterns
- ❌ "Discover the perfect formula!" (marketing)
- ❌ "Our AI-powered engine analyzes…" (techbro)
- ❌ "Hey mama!" (presumptuous about identity, role, mood)
- ❌ "🎉 You're all set!" (no.)
- ❌ "This formula is best for babies with reflux" (claim of efficacy)

---

## VISUAL FOUNDATIONS

> Brand direction is an Open Decision. This is a defensible v1 grounded in product values (calm, transparent, anxiety-reducing) — not a creative leap meant to be precious about.

### Mood

Apothecary calm meets modern utility. **Off-white paper, soft sage green, warm clay accent.** Closer to the visual register of *Headspace* or *Oura* than to *Babylist* or *Pampers*. We avoid: pastel-baby palettes (pink/blue), candy gradients, pediatrician-office sterile white-and-cobalt, and anything that looks like a marketing landing page.

### Color

- **Surface (oat):** `#F6F1E8` — primary background. Warm, low-glare, not white. This is the page.
- **Surface raised (paper):** `#FBF7EE` — cards, sheets sitting on the oat background.
- **Ink (deep eucalyptus):** `#1F2A26` — body text and primary UI. Dark, slightly green-shifted; reads black but feels softer.
- **Ink-2 (muted):** `#5A6862` — secondary text, captions.
- **Ink-3 (placeholder):** `#94A09B` — placeholder text, disabled.
- **Sage (primary):** `#6B8E7F` — primary actions, selected states, the "Bottlewise green."
- **Sage-deep:** `#4A6B5D` — hover/pressed for primary.
- **Sage-soft:** `#DCE6DF` — selected backgrounds, chips, fills.
- **Clay (accent):** `#C77E5C` — accent / highlight / "tariff impact" badge / cost emphasis. Used sparingly.
- **Clay-soft:** `#F2DECE` — accent fills.
- **Honey (info):** `#D4A24C` — informational badges (e.g. "European import").
- **Mist (rule):** `#E6DFCF` — hairlines, dividers, card borders.
- **Semantic:**
  - **Success / in stock:** `#5C8A6E` (deeper sage)
  - **Warning / low stock:** `#C77E5C` (clay)
  - **Danger / safety / recall:** `#A94B3B` (terracotta-red, never pure red)
  - **Information:** `#5C7A8A` (slate-blue)

Hierarchy is built **with type weight and spacing first, color second.** Color is reserved for state (selected, active, available) and for the small set of meanings above.

### Type

- **Display: Newsreader** (Google Fonts) — variable serif with slight literary warmth. Used for hero numbers, formula names on detail pages, slide titles. Optical-size axis enabled.
- **Body: Hanken Grotesk** (Google Fonts) — humanist sans, clean and a touch friendlier than Inter. Used for everything else.
- **Mono: JetBrains Mono** — code, IDs, raw values (HTS codes, batch numbers).

> ⚠ **Substitution flag.** No font files exist in the Bottlewise repo. Newsreader and Hanken Grotesk are loaded from Google Fonts as a working default. If the brand picks something different, swap them in `colors_and_type.css` and drop TTFs into `fonts/`.

Type scale uses a 1.2 ratio rooted at 16px body. Display sizes lean tighter line-height (1.05–1.15); body uses 1.5 with `text-wrap: pretty`.

### Spacing

A **4px base scale** — `0, 4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96`. Most card paddings are 20–24px. Section gaps 40–56px. Mobile-first; nothing tighter than 16px from a screen edge.

### Backgrounds

- Default surface is **flat oat** (`#F6F1E8`) — no gradient, no pattern, no texture by default.
- Some hero / empty-state moments use a **single hand-illustrated bottle line drawing** placed at low opacity (asset placeholders provided — see ICONOGRAPHY).
- **No full-bleed photography in V1.** Stock baby photos are a brand minefield (representation, AI-look, parental projection). When real product photography lands later, it should be: natural light, neutral background, formula tin centered, no human models.
- **No gradients** on backgrounds, buttons, or cards. The only gradient permitted is a 16px protection fade at the bottom of scrollable sheets.

### Animation

- **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` ("calm-out") for almost everything. Never bounce, never overshoot.
- **Durations:** 120ms (small state changes), 200ms (sheet open / page transition), 320ms (the hero recommendation reveal). Nothing over 400ms.
- **Fades > slides.** Sheets and modals fade-and-rise 8px. Cards fade in. Selection is a fade of the chip background, not a scale.
- **The recommendation reveal is the only "designed" animation moment.** When the 3 picks come in, they cascade in with 80ms staggers. Everything else is calm.
- Motion respects `prefers-reduced-motion: reduce` — fades stay, distance and stagger collapse to zero.

### Hover / press states

- **Hover:** background shifts to the next-deeper tint of the same hue (sage → sage-soft on a sage chip, oat → mist on a card). Never opacity dimming. Never raise-on-hover shadow.
- **Press:** 96% scale + 80ms calm-out, plus the next-deeper tint. No ripple.
- **Focus:** 2px sage outline at 2px offset, never default browser blue.

### Borders

- **1px hairlines** in `mist` for dividers and card edges.
- Cards prefer **border + flat surface** over shadow. We use shadow sparingly; this is a low-elevation system.

### Shadows / elevation

- **e1 — resting card:** `0 1px 0 #E6DFCF` (a one-pixel mist line, no blur).
- **e2 — sheet / popover:** `0 8px 24px -12px rgba(31, 42, 38, 0.18)`.
- **e3 — modal:** `0 24px 48px -16px rgba(31, 42, 38, 0.24)`.
- No inner shadows. No glows. No colored shadows.

### Protection gradients vs capsules

- Use a **capsule chip** (filled pill, full radius) for status: "In stock", "Low stock", "European import".
- Use a **protection gradient** (16px oat-to-transparent fade) at the bottom of scrollable sheets where content runs off the edge — never as a background flourish.

### Layout rules

- Mobile column is **clamped 360–480px** with 20px gutters. Content never goes edge-to-edge on tablet/desktop; the column floats centered on oat.
- A persistent **bottom sheet handle** + tab bar on mobile; desktop swaps to a left rail at ≥720px.
- The "not medical advice" framing is **always present at the bottom of any recommendation surface** — fixed, hairline-separated, not dismissable.

### Transparency & blur

- **Overlays:** scrim is `rgba(31, 42, 38, 0.32)` — no blur. Blur on a content scrim implies "the content behind matters" and we want the user to focus on the modal.
- **Top app bar** uses a 24px backdrop-blur with `rgba(246, 241, 232, 0.72)` only when content scrolls under it. Static screens don't blur.

### Imagery vibe

If/when imagery enters: **warm, natural, slightly grainy.** Beige-neutral backgrounds, soft window light. No saturated brand color. No babies (see above). Product photography only — bottles, formula tins, scoops, water, wood surfaces.

### Corner radii

- `2px` — input focus rings, hairlines.
- `8px` — chips, small buttons.
- `12px` — buttons, inputs.
- `16px` — cards.
- `24px` — bottom sheets.
- `999px` — capsule pills, status chips, avatars.

### Cards

A Bottlewise card is: **paper surface, 16px radius, 1px mist border, 20–24px padding, no shadow.** Stack of cards on the oat background separates by 12–16px gap, never by box-shadow. Selected state adds a 2px sage inner ring.

---

## ICONOGRAPHY

There is no in-repo icon set. We use **[Lucide](https://lucide.dev)** as the V1 icon system and link it from CDN.

> ⚠ **Substitution flag.** Lucide is the closest-match library for the visual register we want (1.5px stroke, rounded line caps, geometric but humanist, large library). If/when Bottlewise commissions custom iconography, swap `assets/icons/` accordingly and document in this section.

### Rules
- **Stroke weight 1.5px**, rounded caps and joins, 24px default size.
- **Single color** — inherit currentColor; tint by setting `color` on the parent.
- **Pair with text labels** wherever possible. Standalone icons get an `aria-label`.
- **Reserved icon meanings** (a tiny vocabulary, kept consistent):
  - `baby` — baby profile
  - `milk` — formula / feed
  - `package-2` — formula tin
  - `globe-2` — imported / European
  - `shield-check` — FDA-registered
  - `alert-triangle` — caution / low stock
  - `octagon-alert` — safety interstitial
  - `info` — info badge
  - `sparkles` — AI / Bottlewise picks (used sparingly)
  - `message-circle` — chat
  - `arrow-right` — primary forward action
- **Brand glyph:** a custom drop-in-bottle wordmark, see `assets/logo/`.
- **No emoji**, no Unicode pictographs, no flag emoji for "country of origin" (use `globe-2` + a country code label).

### Files

- `assets/logo/bottlewise-mark.svg` — bottle/drop glyph (placeholder, hand-drawn line)
- `assets/logo/bottlewise-wordmark.svg` — wordmark + glyph lockup
- `assets/illustration/bottle-line.svg` — single low-contrast hero line drawing (placeholder for empty states)
- Icons are loaded **from CDN** at runtime via Lucide's web component or React package. Examples in the UI kit.

---

## Index

```
README.md                          ← you are here
BRAND_RATIONALE.md                 ← reasoning for accent + type pairing (read this second)
SKILL.md                           ← agent skill manifest (cross-compatible with Claude Code)
colors_and_type.css                ← all design tokens (CSS custom properties + semantic styles)
tokens.json                        ← same tokens, JSON shape, ready for Expo + Tailwind
fonts/                             ← (empty for now — Google Fonts CDN; flagged for replacement)
assets/
  logo/                            ← bottlewise-mark.svg, bottlewise-wordmark.svg
  illustration/                    ← bottle-line.svg
  icons/                           ← (uses Lucide CDN — no local copies)
preview/                           ← cards rendered in the Design System tab
  components-badges.html             — full badge system (stock, FDA, match, attribute)
  components-recall-vs-interstitial  — two safety surfaces, compared
  components-cost-transparency.html  — per-oz / per-feed / landed (with tariff)
  …plus colors-, type-, spacing-, components- cards
ui_kits/
  app/                             ← Bottlewise mobile/PWA UI kit
    README.md
    index.html                     ← interactive click-thru of the core flow
    anchor-screens.html            ← 3 mobile (390×844) + desktop (1280) hi-fi anchors
    *.jsx                          ← components (Button, Card, FormulaCard, etc.)
explorations/
  brand-directions.html            ← 4 directions side-by-side (A current, B/C/D alternates)
```

### Where to start reading

1. **`BRAND_RATIONALE.md`** — why sage and why Newsreader + Hanken, and what's reversible.
2. **`ui_kits/app/anchor-screens.html`** — the three load-bearing screens at production fidelity.
3. **Design System tab** — atomized cards (badges, safety, cost transparency, etc.) — where iteration happens.
4. **`tokens.json`** — hand to engineering for Expo + Tailwind consumption.

## Caveats & open questions for Jordan

1. **Brand direction is open** (PRD § 9 #8). The sage / oat / clay direction in this system is opinionated; please react.
2. **No font files in repo** — Newsreader + Hanken Grotesk are Google Fonts substitutes.
3. **No logo exists** — placeholder bottle-drop glyph + wordmark provided. Worth a real mark before any beta launch.
4. **Lucide is a substitution** for an icon set that doesn't exist yet.
5. **No real product photography or illustration assets.** UI kit uses neutral placeholder rectangles labeled accordingly.
6. **One product surface (the app).** No marketing site / docs site / pediatrician portal — those are out of V1 scope.
