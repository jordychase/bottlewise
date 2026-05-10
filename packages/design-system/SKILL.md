---
name: bottlewise-design
description: Use this skill to generate well-branded interfaces and assets for Bottlewise (the AI formula concierge for parents of bottle-fed babies), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick start for an agent

1. **Read `README.md`** — it has CONTENT FUNDAMENTALS (voice, tone, words to use/avoid), VISUAL FOUNDATIONS (color, type, motion, etc.), and ICONOGRAPHY rules.
2. **Pull in tokens via `colors_and_type.css`** — every CSS variable you'll need is there. Don't reinvent.
3. **Use the UI kit at `ui_kits/app/`** — it has the canonical components (buttons, cards, formula cards, chat bubbles, safety interstitial, formula detail) and an `index.html` showing the working flow.
4. **Icons** are Lucide via CDN. Don't draw your own.
5. **Fonts** are Newsreader (display) + Hanken Grotesk (body) from Google Fonts. Substitution is flagged in the README.

## Non-negotiables (from the product CLAUDE.md)

- Never remove or weaken "not medical advice" framing on a recommendation surface.
- Safety triggers are non-dismissable. The interstitial in the UI kit is the canonical pattern.
- Never invent formula brands. Use the names already in the kit/examples or generic placeholders ("Brand A").
- No emoji. No baby photography. No bluish-purple gradients.

## Voice in one line
Calm authority, plain language, no marketing varnish. Sentence case. "You" + "we." Never claim a formula treats a condition.
