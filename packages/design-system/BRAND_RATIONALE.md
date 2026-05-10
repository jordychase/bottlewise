# Bottlewise — Brand Rationale

> Reasoning for the two highest-leverage choices in this system: the **accent color** and the **type pairing**. Both decisions are reversible — the rest of the system is built so they swap cleanly via tokens — but each is opinionated for a reason.

---

## 1. The accent color: soft sage (`#6B8E7F`)

The brief offers three candidates: **soft sage, terracotta, desaturated blush.** All three would test acceptably against parents — none of them screams "baby brand" — and all three avoid corporate cobalt. Sage wins for four reasons specific to Bottlewise's job-to-be-done.

### Why sage and not terracotta

Terracotta is a beautiful mark color. It's also a **warning hue**. In every credible safety system in the building (interstitials, FDA labels, recall banners, our own toxicology heuristics) red-orange means "slow down, look here." If terracotta becomes the *primary* CTA color, every safety surface has to fight against it — either by escalating to a redder red (which then reads as alarmist), or by being polite enough that parents miss it.

Sage gives us a calm primary that **vacates the warm-warning end of the spectrum entirely**, leaving terracotta-red free to do the work it actually has to do: stop a parent in their tracks when something is wrong. The two are 180° apart on the color wheel; they will never visually compete.

### Why sage and not blush

Desaturated blush (`#D4A8A4`-ish) reads sweet. The brief is explicit that we're **not** for premium-DTC aesthetes; blush is the dominant CTA color of the premium-DTC formula brands the user is comparing us *to*. We'd be borrowing visual equity from Bobbie / ByHeart and inheriting the lifestyle-gloss baggage that the brief tells us to avoid.

Blush also tests poorly with a real subset of our audience — fathers, single dads, non-binary parents — who report that the gendering of pinks reads as "not for me." Sage is gender-neutral in a way that blush, despite intentions, is not.

### Why sage works for *this* product

1. **It already encodes "in stock / available / good"** in the wider design vocabulary parents bring to the app. We can reuse the primary color as the success-affordance for stock signals and trial-outcome positives without ever inventing a separate "success green."
2. **It pairs with the warm-neutral foundation without going earthy or hippie.** Sage on `#F6F1E8` oat reads as *apothecary* — Aesop, Le Labo, Hims/Roman done right — not as *crunchy*. The brief's reference set (Headspace, NYT Cooking, Stripe docs) all sit in this register.
3. **It survives the WCAG AA budget at small text.** `#4A6B5D` (sage-deep) clears 4.5:1 against `#F6F1E8` (oat) and `#FBF7EE` (paper); `#6B8E7F` (sage primary) clears 3:1 against the same surfaces, which is enough for non-text and large-text usage. We never put body text on sage; we put white on sage and sage-deep on oat.
4. **It's not a tech-company color.** Cobalt, indigo, and purple all signal "enterprise SaaS" or "fintech." Sage signals "thoughtful product made by people who care about the artifact." That matters at 2am in front of a CVS shelf.

### Where sage is NOT used

- **Never on safety surfaces.** Recall banners, allergic-reaction warnings, the pediatrician interstitial — these use the `--danger` red and only the danger red. Sage there would soften a stop-sign into a suggestion.
- **Never as a marketing-page gradient.** No sage-to-something fades. Sage is flat.
- **Never as decoration.** Sage's job is meaning: primary action, selected, in-stock. Decorative sage rectangles teach parents to stop reading the color as a signal.

---

## 2. The type pairing: Newsreader display + Hanken Grotesk body

The brief permits a single humanist sans (Inter, Söhne, GT America, Manrope) or a sans + display-serif pairing. We chose **Newsreader (Google) for display, Hanken Grotesk (Google) for body** — and reach for the pairing rather than a single sans. This is a deliberate trade.

> ⚠ Both faces are Google Fonts substitutes. The closest licensed analogues, in order of preference, are: **Söhne or GT America** for body (Hanken Grotesk's clearest commercial replacement), and **Tiempos Text or GT Sectra** for display (Newsreader's). Swap by replacing the `@import` and `--font-body` / `--font-display` tokens — every other use site reads from those vars.

### Why we pair, instead of single-stack

A single humanist sans (Inter especially) is the safe answer and would be defensible. The reason we don't take it:

The hero numbers in this product — **`$1.78/oz`**, **`Day 7`**, **`Bobbie Original`** as the formula name on a recommendation card — are doing emotional work, not just typographic work. They are the moment a tired parent locks onto the answer. Set in Inter, those numbers read as competent and forgettable. Set in a contemporary serif with optical sizing, those numbers read as **considered** — a human chose this, a human stands behind this number, a human will stand by it tomorrow when it's slightly different.

That same effect, in a marketing context, would be precious. In a decision-support context for a stressed-out parent, it's the difference between feeling **handed an answer** and feeling **sold a recommendation.**

Stripe docs ships a sans-only stack and gets this same authority through density and color discipline. We don't have density on our side — onboarding screens are deliberately one-question-per-screen, recommendation cards are deliberately three-up — so we lean on the serif to carry the weight.

### Why Newsreader specifically

- **Variable optical-size axis.** Newsreader changes its proportions across sizes — narrower and tighter at display sizes, more open and humane at heading sizes. A formula name set at 24px in Newsreader looks unified with the same name set at 56px on a hero; we get a single voice across screens without managing two cuts.
- **Slight literary warmth without being twee.** Newsreader is tuned for digital reading (it ships in NYT-adjacent contexts) but isn't *Times*-stiff. There's a calm in the bowls that matches the brand pillars.
- **Free, FOSS, stable.** GT Sectra and Tiempos Text would both be defensible upgrades but require a real type budget. Newsreader gets us 85% of the way and ships today.

### Why Hanken Grotesk for body, not Inter

Inter is the obvious choice and would work. The reason we picked Hanken:

- **Inter is overused.** Every B2B SaaS is Inter. Bottlewise lives in a category (consumer health for parents) where Inter feels *off* — it reads as someone's dashboard, not someone's nightstand.
- **Hanken's terminals are slightly humanist.** The lowercase `a` and `e` have a warmth Inter sands off. At body sizes this is barely perceptible, but at the small caption sizes ("$1.78 per reconstituted ounce — as of 6 hours ago") it keeps the copy from feeling clinical.
- **It pairs cleanly with Newsreader.** Both faces share generous x-height and balanced letter widths; a serif heading and a sans body in the same paragraph never feel structurally mismatched.

### Where the serif appears, and where it does not

| Surface | Face | Why |
|---|---|---|
| Hero numbers (cost, day-count) | Newsreader | Considered, not corporate |
| Formula names | Newsreader | Treats the product like a real thing, not a row in a database |
| Card titles + page H1 / H2 | Newsreader | Anchors the page |
| Section H3 / H4 | Hanken Grotesk semibold | Density without competing with H1/H2 |
| Body copy | Hanken Grotesk regular | Readability above all |
| Button labels | Hanken Grotesk semibold | Clarity at the action |
| Captions, eyebrows, chip labels | Hanken Grotesk caps + tracking | Information density |
| Mono (HTS codes, batch IDs, raw JSON in dev) | JetBrains Mono | A signal of "this is data, not narrative" |

The serif does not appear in: button labels, body copy, form field labels, status chips. Those surfaces need to read at a glance and serif optical detail is friction there.

### Type scale

A 1.2 modular scale rooted at 16px body. Display sizes use tighter line-height (1.05–1.15); body uses 1.5 with `text-wrap: pretty`. See `colors_and_type.css` for the tokenized scale.

---

## 3. What we ARE NOT doing

Stating this out loud so future iteration doesn't drift into it:

- **No bluish-purple gradients.** Anywhere.
- **No emoji in product copy.** Including 🎉 confetti at flow completion.
- **No baby photography.** Stock baby imagery is a brand and representation minefield.
- **No bouncy / overshoot motion.** Calm-out cubic-bezier only.
- **No marketing-page tropes** in the product surface. Hero carousels, testimonial sliders, animated counters, "trusted by" logo strips. None.
- **No medical iconography that implies clinical authority** (stethoscopes, crosses, pill bottles). We are decision support, not a clinic. Lucide's `shield-check` for FDA-registered is the strongest medical-adjacent glyph we use, and it's intentionally generic.
- **No country-flag emoji** for "European import." Word + globe icon only — flag emoji rendering is inconsistent across platforms and politically loaded.

---

## 4. Reversibility

Every choice in this document maps to a small set of tokens:

```
--primary           sage          → swap for any other accent
--font-display      Newsreader    → swap for Tiempos / GT Sectra / Söhne
--font-body         Hanken        → swap for Inter / GT America / Söhne
--danger            terracotta-red → reserved exclusively for safety
```

If the brand direction changes, the swap is mechanical: replace four CSS variables and one `@import`. The component library, the badge system, the safety surfaces, the spacing scale — all of them survive untouched.
